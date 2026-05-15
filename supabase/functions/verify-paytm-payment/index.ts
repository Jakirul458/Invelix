import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse, verifyChecksum } from "../_shared/paytm.ts";

const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type PaytmCallback = Record<string, string>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ success: false, error: "Invalid session" }, 401);
    }

    const payload = (await req.json()) as PaytmCallback;
    const checksum = payload.CHECKSUMHASH ?? payload.checksumhash ?? "";

    const params = { ...payload };
    delete params.CHECKSUMHASH;
    delete params.checksumhash;

    const valid = await verifyChecksum(params, checksum, PAYTM_MERCHANT_KEY);
    if (!valid) {
      return jsonResponse({ success: false, error: "Invalid checksum" }, 401);
    }

    if (payload.STATUS !== "TXN_SUCCESS") {
      return jsonResponse({
        success: false,
        error: payload.RESPMSG ?? "Payment not successful",
      }, 400);
    }

    const orderId = payload.ORDERID ?? payload.orderId;
    if (!orderId) {
      return jsonResponse({ success: false, error: "Missing order id" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: subscription, error: fetchError } = await admin
      .from("subscriptions")
      .select("id, user_id, payment_status")
      .eq("order_id", orderId)
      .single();

    if (fetchError || !subscription) {
      return jsonResponse({ success: false, error: "Subscription record not found" }, 404);
    }

    if (subscription.user_id !== user.id) {
      return jsonResponse({ success: false, error: "Order does not belong to user" }, 403);
    }

    if (subscription.payment_status === "success") {
      return jsonResponse({
        success: true,
        orderId,
        transactionId: payload.TXNID,
      });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const { error: subError } = await admin
      .from("subscriptions")
      .update({
        payment_status: "success",
        payment_id: payload.TXNID ?? null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        is_first_purchase: false,
      })
      .eq("order_id", orderId);

    if (subError) throw new Error(subError.message);

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: periodEnd.toISOString(),
        account_status: "active",
      })
      .eq("id", subscription.user_id);

    if (profileError) throw new Error(profileError.message);

    await admin.from("owners").update({ is_active: true }).eq("id", subscription.user_id);

    return jsonResponse({
      success: true,
      transactionId: payload.TXNID,
      orderId,
      amount: payload.TXNAMOUNT,
    });
  } catch (error) {
    console.error("verify-paytm-payment:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});
