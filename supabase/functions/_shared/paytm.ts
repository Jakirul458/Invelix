import PaytmChecksum from "npm:paytmchecksum@1.5.1";

const PAYTM_HOST =
  Deno.env.get("PAYTM_ENVIRONMENT") === "production"
    ? "https://securegw.paytm.in"
    : "https://securegw-stage.paytm.in";

export function getPaytmHost(): string {
  return PAYTM_HOST;
}

export async function generateChecksum(params: Record<string, string>, merchantKey: string): Promise<string> {
  return PaytmChecksum.generateSignature(params, merchantKey);
}

export async function verifyChecksum(
  params: Record<string, string>,
  checksum: string,
  merchantKey: string
): Promise<boolean> {
  return PaytmChecksum.verifySignature(params, merchantKey, checksum);
}

export function corsHeaders(origin = "*"): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
