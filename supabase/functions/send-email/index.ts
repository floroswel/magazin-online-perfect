import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: "order_placed" | "order_status" | "welcome" | "return_status";
  to: string;
  data: Record<string, any>;
}

function orderPlacedHTML(data: Record<string, any>) {
  const items = (data.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${Number(i.price).toFixed(2)} RON</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#cc0000;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">🎉 Comandă plasată cu succes!</h1>
      </div>
      <div style="padding:24px">
        <p>Bună, <strong>${data.customerName || "Client"}</strong>!</p>
        <p>Comanda ta <strong>#${(data.orderId || "").slice(0, 8)}</strong> a fost înregistrată.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produs</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Preț</th></tr>
          ${items}
        </table>
        <div style="background:#f9f9f9;padding:16px;border-radius:6px;margin-top:16px">
          <p style="margin:4px 0"><strong>Total:</strong> ${Number(data.total).toFixed(2)} RON</p>
          <p style="margin:4px 0"><strong>Metodă plată:</strong> ${data.paymentMethod || "Ramburs"}</p>
          ${data.pointsEarned ? `<p style="margin:4px 0;color:#cc8800"><strong>+${data.pointsEarned} puncte fidelitate</strong> câștigate!</p>` : ""}
        </div>
        <p style="margin-top:16px;color:#666;font-size:14px">Vei primi un email când comanda va fi expediată.</p>
      </div>
    </div>`;
}

function orderStatusHTML(data: Record<string, any>) {
  const statusMap: Record<string, { label: string; color: string; emoji: string }> = {
    processing: { label: "În procesare", color: "#2563eb", emoji: "⚙️" },
    shipped: { label: "Expediată", color: "#7c3aed", emoji: "🚚" },
    delivered: { label: "Livrată", color: "#16a34a", emoji: "✅" },
    cancelled: { label: "Anulată", color: "#dc2626", emoji: "❌" },
  };
  const s = statusMap[data.status] || { label: data.status, color: "#666", emoji: "📦" };

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:${s.color};padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">${s.emoji} Comandă ${s.label}</h1>
      </div>
      <div style="padding:24px">
        <p>Bună!</p>
        <p>Comanda ta <strong>#${(data.orderId || "").slice(0, 8)}</strong> are un status nou:</p>
        <div style="text-align:center;padding:20px">
          <span style="background:${s.color};color:#fff;padding:10px 24px;border-radius:20px;font-size:18px;font-weight:bold">${s.emoji} ${s.label}</span>
        </div>
        ${data.status === "shipped" ? '<p style="color:#666">Comanda ta este pe drum! O vei primi în curând.</p>' : ""}
        ${data.status === "delivered" ? '<p style="color:#666">Comanda a fost livrată. Mulțumim pentru cumpărătură!</p>' : ""}
      </div>
    </div>`;
}

function welcomeHTML(data: Record<string, any>) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:#cc0000;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">🎊 Bine ai venit!</h1>
      </div>
      <div style="padding:24px;text-align:center">
        <p style="font-size:18px">Bună, <strong>${data.name || "Client"}</strong>!</p>
        <p>Contul tău a fost creat cu succes. Ești gata să descoperi ofertele noastre!</p>
        <div style="background:#fff8e1;padding:16px;border-radius:8px;margin:20px 0">
          <p style="margin:0;font-size:16px">🏆 Ai primit automat nivelul <strong>Bronze</strong> în programul de fidelitate!</p>
        </div>
        <p style="color:#666;font-size:14px">Cumpără produse pentru a acumula puncte și a debloca reduceri permanente.</p>
      </div>
    </div>`;
}

function returnStatusHTML(data: Record<string, any>) {
  const statusMap: Record<string, { label: string; color: string; emoji: string; message: string }> = {
    approved: { label: "Aprobat", color: "#2563eb", emoji: "✅", message: "Cererea ta de retur a fost aprobată. Te rugăm să expediezi produsul conform instrucțiunilor." },
    rejected: { label: "Respins", color: "#dc2626", emoji: "❌", message: "Din păcate, cererea ta de retur a fost respinsă." },
    shipped: { label: "Expediat", color: "#7c3aed", emoji: "🚚", message: "Am înregistrat expedierea produsului returnat. Îl vom verifica la primire." },
    received: { label: "Recepționat", color: "#059669", emoji: "📦", message: "Produsul returnat a fost recepționat. Procesăm rambursarea." },
    refunded: { label: "Rambursat", color: "#16a34a", emoji: "💰", message: "Rambursarea a fost procesată cu succes!" },
    closed: { label: "Închis", color: "#6b7280", emoji: "🔒", message: "Cererea de retur a fost închisă." },
  };
  const s = statusMap[data.status] || { label: data.status, color: "#666", emoji: "📋", message: "Statusul returului tău s-a schimbat." };

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
      <div style="background:${s.color};padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">${s.emoji} Retur ${s.label}</h1>
      </div>
      <div style="padding:24px">
        <p>Bună!</p>
        <p>Returul tău <strong>#${(data.returnId || "").slice(0, 8)}</strong> (comandă #${(data.orderId || "").slice(0, 8)}) are un status nou:</p>
        <div style="text-align:center;padding:20px">
          <span style="background:${s.color};color:#fff;padding:10px 24px;border-radius:20px;font-size:18px;font-weight:bold">${s.emoji} ${s.label}</span>
        </div>
        <p style="color:#444">${s.message}</p>
        ${data.refundAmount ? `<p style="color:#16a34a;font-weight:bold">Sumă rambursată: ${Number(data.refundAmount).toFixed(2)} RON</p>` : ""}
        ${data.resolution ? `<p style="color:#666;font-size:14px">Rezoluție: <strong>${data.resolution}</strong></p>` : ""}
        ${data.adminNotes ? `<p style="color:#666;font-size:14px;background:#f9f9f9;padding:12px;border-radius:6px">${data.adminNotes}</p>` : ""}
        <p style="margin-top:20px;color:#666;font-size:14px">Poți vedea detaliile returului în contul tău.</p>
      </div>
    </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { type, to, data } = (await req.json()) as EmailRequest;

    let subject: string;
    let html: string;

    switch (type) {
      case "order_placed":
        subject = `Comandă confirmată #${(data.orderId || "").slice(0, 8)}`;
        html = orderPlacedHTML(data);
        break;
      case "order_status":
        subject = `Actualizare comandă #${(data.orderId || "").slice(0, 8)}`;
        html = orderStatusHTML(data);
        break;
      case "welcome":
        subject = "Bine ai venit! 🎊";
        html = welcomeHTML(data);
        break;
      case "return_status":
        subject = `Actualizare retur #${(data.returnId || "").slice(0, 8)}`;
        html = returnStatusHTML(data);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Magazin <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Email send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
