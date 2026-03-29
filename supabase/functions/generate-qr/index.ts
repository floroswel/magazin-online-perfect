import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, siteUrl } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = orderId.substring(0, 8);
    const baseUrl = siteUrl || "https://mamalucica.ro";
    const postDeliveryUrl = `${baseUrl}/post-delivery/${token}`;

    // Generate QR code using a public API (no API key needed)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(postDeliveryUrl)}&format=png`;

    const qrResponse = await fetch(qrApiUrl);
    if (!qrResponse.ok) {
      throw new Error("Failed to generate QR code");
    }

    const qrBuffer = await qrResponse.arrayBuffer();
    const qrBase64 = btoa(String.fromCharCode(...new Uint8Array(qrBuffer)));

    return new Response(
      JSON.stringify({
        qr_base64: qrBase64,
        qr_url: qrApiUrl,
        post_delivery_url: postDeliveryUrl,
        token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
