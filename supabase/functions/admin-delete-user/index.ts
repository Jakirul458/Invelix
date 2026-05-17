import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/paytm.ts";
import { getServiceClient, requireAdmin, requireUser } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    const authResult = await requireUser(req);
    if (authResult instanceof Response) {
      return new Response(authResult.body, {
        status: authResult.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      });
    }

    const { user: caller } = authResult;
    const isAdmin = await requireAdmin(caller.id);
    if (!isAdmin) {
      return jsonResponse({ success: false, error: "Admin access required" }, 403);
    }

    const { userId } = (await req.json()) as { userId?: string };
    if (!userId) {
      return jsonResponse({ success: false, error: "userId is required" }, 400);
    }

    if (userId === caller.id) {
      return jsonResponse({ success: false, error: "You cannot delete your own admin account" }, 400);
    }

    const admin = getServiceClient();
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      const notFound = error.message.toLowerCase().includes("not found");
      if (notFound) {
        return jsonResponse({ success: true, message: "User already removed" });
      }
      throw error;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("admin-delete-user:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500
    );
  }
});
