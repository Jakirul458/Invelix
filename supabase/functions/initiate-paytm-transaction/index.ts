import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateChecksum, getPaytmHost, jsonResponse } from "../_shared/paytm.ts";

const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY") ?? "";
const PAYTM_MID = Deno.env.get("PAYTM_MID") ?? "";
const PAYTM_WEBSITE = Deno.env.get("PAYTM_WEBSITE") ?? "DEFAULT";
const PAYTM_CALLBACK_URL = Deno.env.get("PAYTM_CALLBACK_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const NEW_PRICE = Number(Deno.env.get("SUBSCRIPTION_NEW") ?? "2000");
const RENEWAL_PRICE = Number(Deno.env.get("SUBSCRIPTION_RENEWAL") ?? "1000");

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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: priorSuccess } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("payment_status", "success")
      .limit(1);

    const isFirstPurchase = !priorSuccess || priorSuccess.length === 0;
    const amountInr = isFirstPurchase ? NEW_PRICE : RENEWAL_PRICE;

    const { data: profile } = await admin
      .from("profiles")
      .select("email, phone, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";
    const phone = profile?.phone ?? "9999999999";

    const orderId = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const { error: insertError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      order_id: orderId,
      amount: amountInr,
      payment_status: "pending",
      is_first_purchase: isFirstPurchase,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    const paytmParams: Record<string, string> = {
      requestType: "Payment",
      mid: PAYTM_MID,
      websiteName: PAYTM_WEBSITE,
      orderId,
      callbackUrl: PAYTM_CALLBACK_URL,
      txnAmount: amountInr.toFixed(2),
      userInfo: JSON.stringify({ custId: user.id, email, mobile: phone }),
    };

    const checksum = await generateChecksum(paytmParams, PAYTM_MERCHANT_KEY);

    const initiateBody = {
      body: {
        requestType: "Payment",
        mid: PAYTM_MID,
        websiteName: PAYTM_WEBSITE,
        orderId,
        callbackUrl: PAYTM_CALLBACK_URL,
        txnAmount: { value: amountInr.toFixed(2), currency: "INR" },
        userInfo: { custId: user.id, email, mobile: phone },
      },
      head: { signature: checksum },
    };

    const paytmRes = await fetch(`${getPaytmHost()}/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(initiateBody),
    });

    const paytmJson = await paytmRes.json();
    const txnToken = paytmJson?.body?.txnToken;

    if (!txnToken) {
      const msg = paytmJson?.body?.resultInfo?.resultMsg ?? "Failed to get txn token";
      throw new Error(msg);
    }

    return jsonResponse({
      success: true,
      txnToken,
      orderId,
      amount: amountInr,
      mid: PAYTM_MID,
    });
  } catch (error) {
    console.error("initiate-paytm-transaction:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});
