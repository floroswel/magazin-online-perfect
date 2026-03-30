import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: string;
  to: string;
  data: Record<string, any>;
}

const BRAND = {
  name: "Mama Lucica",
  color: "#B45309", // amber-700
  bgColor: "#FFFBEB", // amber-50 / ivory
  accentColor: "#D97706", // amber-600
  textColor: "#1C1917", // stone-900
  mutedColor: "#78716C", // stone-500
  font: "'Georgia', 'Times New Roman', serif",
  fromEmail: "no-reply@mamalucica.ro",
  fromName: "Mama Lucica",
  cui: "RO12345678",
  address: "București, România",
  phone: "+40 700 000 000",
};

function header(title: string, emoji = "🕯️") {
  return `
    <div style="background:${BRAND.bgColor};font-family:${BRAND.font};max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #F5E6D3">
      <div style="background:linear-gradient(135deg,${BRAND.color},${BRAND.accentColor});padding:32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:bold;letter-spacing:1px">${emoji} ${title}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;letter-spacing:2px">${BRAND.name}</p>
      </div>
      <div style="padding:28px 24px">`;
}

function footer() {
  return `
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E7E5E4;text-align:center">
          <p style="color:${BRAND.mutedColor};font-size:11px;margin:4px 0">${BRAND.name} | ${BRAND.cui}</p>
          <p style="color:${BRAND.mutedColor};font-size:11px;margin:4px 0">${BRAND.address} | ${BRAND.phone}</p>
          <p style="color:${BRAND.mutedColor};font-size:11px;margin:8px 0">
            <a href="{{unsubscribe_url}}" style="color:${BRAND.mutedColor};text-decoration:underline">Dezabonare</a>
          </p>
        </div>
      </div>
    </div>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:${BRAND.color};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:0.5px">${text}</a>`;
}

function orderPlacedHTML(data: Record<string, any>) {
  const items = (data.items || [])
    .map((i: any) =>
      `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #F5E6D3">
          ${i.image_url ? `<img src="${i.image_url}" alt="${i.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px" />` : ""}
          <span style="vertical-align:middle">${i.name}</span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #F5E6D3;text-align:center">${i.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #F5E6D3;text-align:right;font-weight:bold">${Number(i.price * i.quantity).toFixed(2)} RON</td>
      </tr>`)
    .join("");

  const addr = data.shippingAddress;
  const addressHTML = addr
    ? `<div style="background:#fff;padding:16px;border-radius:8px;margin-top:16px;border:1px solid #F5E6D3">
        <p style="margin:0 0 8px;font-weight:bold;color:${BRAND.color}">📍 Adresă livrare:</p>
        <p style="margin:2px 0;color:${BRAND.textColor}">${addr.full_name || addr.fullName || ""}</p>
        <p style="margin:2px 0;color:${BRAND.mutedColor}">${addr.address || ""}</p>
        <p style="margin:2px 0;color:${BRAND.mutedColor}">${addr.city || ""}, ${addr.county || ""} ${addr.postal_code || addr.postalCode || ""}</p>
        <p style="margin:2px 0;color:${BRAND.mutedColor}">Tel: ${addr.phone || ""}</p>
      </div>`
    : "";

  const paymentLabels: Record<string, string> = {
    ramburs: "🏠 Ramburs (la livrare)",
    card_online: "💳 Card online (Netopia)",
    transfer_bancar: "🏦 Transfer bancar",
    mokka: "📦 Mokka (rate)",
    paypo: "⏳ PayPo (plătești în 30 zile)",
  };

  const bankHTML = data.bankDetails
    ? `<div style="background:#EFF6FF;padding:16px;border-radius:8px;margin-top:16px;border:2px solid #3B82F6">
        <p style="margin:0 0 8px;font-weight:bold;color:#1E40AF">🏦 Detalii transfer bancar</p>
        ${data.bankDetails.iban ? `<p style="margin:4px 0"><strong>IBAN:</strong> <span style="font-family:monospace;letter-spacing:1px">${data.bankDetails.iban}</span></p>` : ""}
        ${data.bankDetails.account_holder ? `<p style="margin:4px 0"><strong>Titular:</strong> ${data.bankDetails.account_holder}</p>` : ""}
        ${data.bankDetails.bank_name ? `<p style="margin:4px 0"><strong>Banca:</strong> ${data.bankDetails.bank_name}</p>` : ""}
        <p style="margin:4px 0"><strong>Suma:</strong> <span style="font-size:18px;font-weight:bold;color:#1E40AF">${Number(data.total).toFixed(2)} RON</span></p>
        <p style="margin:4px 0"><strong>Referința plății:</strong> <span style="font-family:monospace">${(data.orderId || "").slice(0, 8)}</span></p>
        <p style="margin:8px 0 0;color:#B91C1C;font-weight:bold;font-size:13px">⏳ Plata trebuie efectuată în 3 zile lucrătoare</p>
      </div>`
    : "";

  return `${header("Comandă confirmată!", "🎉")}
    <p style="color:${BRAND.textColor};font-size:15px">Bună, <strong>${data.customerName || "Client"}</strong>!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Comanda ta <strong>#${(data.orderId || "").slice(0, 8)}</strong> a fost înregistrată cu succes.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr style="background:${BRAND.color}"><th style="padding:10px 8px;text-align:left;color:#fff;border-radius:6px 0 0 0">Produs</th><th style="padding:10px 8px;text-align:center;color:#fff">Cant.</th><th style="padding:10px 8px;text-align:right;color:#fff;border-radius:0 6px 0 0">Preț</th></tr>
      ${items}
    </table>
    <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #F5E6D3">
      <p style="margin:4px 0"><strong>Total:</strong> <span style="font-size:20px;font-weight:bold;color:${BRAND.color}">${Number(data.total).toFixed(2)} RON</span></p>
      <p style="margin:4px 0;color:${BRAND.mutedColor}"><strong>Metodă plată:</strong> ${paymentLabels[data.paymentMethod] || data.paymentMethod}</p>
      ${data.pointsEarned ? `<p style="margin:8px 0 0;color:${BRAND.accentColor};font-weight:bold">🏆 +${data.pointsEarned} puncte fidelitate câștigate!</p>` : ""}
    </div>
    ${bankHTML}
    ${addressHTML}
    <div style="text-align:center;margin-top:24px">
      ${btn("Urmărește comanda →", `https://mamalucica.ro/account`)}
    </div>
    <p style="margin-top:20px;color:${BRAND.mutedColor};font-size:13px;text-align:center">Vei primi un email când comanda va fi expediată.</p>
  ${footer()}`;
}

function orderShippedHTML(data: Record<string, any>) {
  const trackingHTML = data.trackingNumber
    ? `<div style="background:#EDE9FE;padding:20px;border-radius:8px;margin:20px 0;text-align:center;border:1px solid #C4B5FD">
        <p style="margin:0 0 8px;font-weight:bold;color:#5B21B6">📦 AWB / Tracking</p>
        <p style="margin:4px 0;font-size:24px;font-family:monospace;letter-spacing:3px;font-weight:bold;color:#5B21B6">${data.trackingNumber}</p>
        ${data.courierName ? `<p style="margin:8px 0;color:#7C3AED">Curier: <strong>${data.courierName}</strong></p>` : ""}
        ${data.trackingUrl ? `<div style="margin-top:12px">${btn("Urmărește coletul →", data.trackingUrl)}</div>` : ""}
      </div>`
    : "";

  const itemsSummary = (data.items || [])
    .map((i: any) => `<li style="margin:4px 0;color:${BRAND.mutedColor};font-size:13px">${i.name} × ${i.quantity}</li>`)
    .join("");

  return `${header("Comanda ta a fost expediată!", "🚚")}
    <p style="color:${BRAND.textColor};font-size:15px">Bună!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Comanda <strong>#${(data.orderId || "").slice(0, 8)}</strong> este pe drum către tine.</p>
    ${trackingHTML}
    ${itemsSummary ? `<div style="margin-top:16px"><p style="font-weight:bold;color:${BRAND.textColor};margin:0 0 8px">Produse comandate:</p><ul style="padding-left:20px;margin:0">${itemsSummary}</ul></div>` : ""}
    ${data.estimatedDelivery ? `<p style="margin-top:16px;color:${BRAND.mutedColor};font-size:14px">📅 Livrare estimată: <strong>${data.estimatedDelivery}</strong></p>` : ""}
  ${footer()}`;
}

function adminNewOrderHTML(data: Record<string, any>) {
  const items = (data.items || [])
    .map((i: any) => `<li style="margin:4px 0">${i.name} × ${i.quantity} — ${Number(i.price * i.quantity).toFixed(2)} RON</li>`)
    .join("");

  const addr = data.shippingAddress || {};

  return `${header(`Comandă nouă #${(data.orderId || "").slice(0, 8)}`, "🛒")}
    <div style="background:#FEF3C7;padding:16px;border-radius:8px;border:1px solid #F59E0B;margin-bottom:16px">
      <p style="margin:0;font-size:20px;font-weight:bold;color:${BRAND.color};text-align:center">${Number(data.total).toFixed(2)} RON</p>
      <p style="margin:4px 0 0;text-align:center;color:${BRAND.mutedColor};font-size:13px">${data.paymentMethod}</p>
    </div>
    <p style="font-weight:bold;color:${BRAND.textColor}">Client: ${data.customerName || "N/A"}</p>
    <p style="color:${BRAND.mutedColor};font-size:13px">Email: ${data.email || "N/A"}</p>
    <p style="color:${BRAND.mutedColor};font-size:13px">Adresă: ${addr.address || ""}, ${addr.city || ""}, ${addr.county || ""}</p>
    <p style="color:${BRAND.mutedColor};font-size:13px">Telefon: ${addr.phone || ""}</p>
    <p style="font-weight:bold;margin-top:16px;color:${BRAND.textColor}">Produse:</p>
    <ul style="padding-left:20px">${items}</ul>
    <div style="text-align:center;margin-top:20px">
      ${btn("Vezi comanda în admin →", `https://mamalucica.ro/admin/orders`)}
    </div>
  ${footer()}`;
}

function welcomeHTML(data: Record<string, any>) {
  return `${header("Bine ai venit!", "🎊")}
    <p style="font-size:18px;color:${BRAND.textColor};text-align:center">Bună, <strong>${data.name || "Client"}</strong>!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px;text-align:center">Contul tău a fost creat cu succes. Ești gata să descoperi lumea Mama Lucica!</p>
    <div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:20px 0;text-align:center;border:1px solid #F59E0B">
      <p style="margin:0;font-size:16px;color:${BRAND.color}">🎁 Cod reducere 10% prima comandă:</p>
      <p style="margin:8px 0;font-size:28px;font-weight:bold;font-family:monospace;letter-spacing:3px;color:${BRAND.color}">BINEAIVENIT10</p>
    </div>
    <div style="text-align:center;margin-top:20px">
      ${btn("Explorează colecția →", "https://mamalucica.ro/catalog")}
    </div>
  ${footer()}`;
}

function abandonedCartHTML(data: Record<string, any>) {
  const items = (data.items || [])
    .map((i: any) =>
      `<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #F5E6D3">
        ${i.image_url ? `<img src="${i.image_url}" alt="${i.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:12px" />` : ""}
        <div>
          <p style="margin:0;font-weight:bold;color:${BRAND.textColor};font-size:14px">${i.name}</p>
          <p style="margin:2px 0 0;color:${BRAND.mutedColor};font-size:13px">${i.quantity} × ${Number(i.price).toFixed(2)} RON</p>
        </div>
      </div>`)
    .join("");

  return `${header("Ai uitat ceva?", "🛒")}
    <p style="font-size:15px;color:${BRAND.textColor}">Bună!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Coșul tău te așteaptă cu produsele pe care le-ai ales:</p>
    <div style="margin:16px 0">${items}</div>
    ${data.couponCode ? `<div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:16px 0;text-align:center;border:1px solid #F59E0B">
      <p style="margin:0;color:${BRAND.color};font-weight:bold">🎁 Reducere 5% cu codul:</p>
      <p style="margin:8px 0;font-size:24px;font-weight:bold;font-family:monospace;letter-spacing:3px;color:${BRAND.color}">${data.couponCode}</p>
      <p style="margin:4px 0 0;color:${BRAND.mutedColor};font-size:12px">Valabil 24 ore</p>
    </div>` : ""}
    <div style="text-align:center;margin-top:20px">
      ${btn("Finalizează comanda →", data.recoverUrl || "https://mamalucica.ro/checkout")}
    </div>
  ${footer()}`;
}

function returnStatusHTML(data: Record<string, any>) {
  const statusMap: Record<string, { label: string; emoji: string }> = {
    approved: { label: "Aprobat", emoji: "✅" },
    rejected: { label: "Respins", emoji: "❌" },
    shipped: { label: "Expediat", emoji: "🚚" },
    received: { label: "Recepționat", emoji: "📦" },
    refunded: { label: "Rambursat", emoji: "💰" },
    closed: { label: "Închis", emoji: "🔒" },
  };
  const s = statusMap[data.status] || { label: data.status, emoji: "📋" };

  return `${header(`Retur ${s.label}`, s.emoji)}
    <p style="color:${BRAND.textColor}">Returul <strong>#${(data.returnId || "").slice(0, 8)}</strong> (comanda #${(data.orderId || "").slice(0, 8)}) are un status nou.</p>
    <div style="text-align:center;padding:20px">
      <span style="background:${BRAND.color};color:#fff;padding:10px 24px;border-radius:20px;font-size:18px;font-weight:bold">${s.emoji} ${s.label}</span>
    </div>
    ${data.refundAmount ? `<p style="color:#16a34a;font-weight:bold;text-align:center">Sumă rambursată: ${Number(data.refundAmount).toFixed(2)} RON</p>` : ""}
    ${data.adminNotes ? `<p style="color:${BRAND.mutedColor};font-size:14px;background:#fff;padding:12px;border-radius:6px;border:1px solid #F5E6D3">${data.adminNotes}</p>` : ""}
  ${footer()}`;
}

function orderStatusHTML(data: Record<string, any>) {
  const statusMap: Record<string, { label: string; emoji: string }> = {
    processing: { label: "În procesare", emoji: "⚙️" },
    shipped: { label: "Expediată", emoji: "🚚" },
    delivered: { label: "Livrată", emoji: "✅" },
    cancelled: { label: "Anulată", emoji: "❌" },
    confirmed: { label: "Confirmată", emoji: "✅" },
  };
  const s = statusMap[data.status] || { label: data.status, emoji: "📦" };

  return `${header(`Comandă ${s.label}`, s.emoji)}
    <p style="color:${BRAND.textColor}">Comanda ta <strong>#${(data.orderId || "").slice(0, 8)}</strong> are un status nou:</p>
    <div style="text-align:center;padding:20px">
      <span style="background:${BRAND.color};color:#fff;padding:10px 24px;border-radius:20px;font-size:18px;font-weight:bold">${s.emoji} ${s.label}</span>
    </div>
    ${data.status === "shipped" ? '<p style="color:#78716C;text-align:center">Comanda ta este pe drum! O vei primi în curând.</p>' : ""}
    ${data.status === "delivered" ? '<p style="color:#78716C;text-align:center">Comanda a fost livrată. Mulțumim pentru cumpărătură!</p>' : ""}
  ${footer()}`;
}

function testHTML(data: Record<string, any>) {
  return `${header("Email de test", "✅")}
    <p style="font-size:16px;text-align:center;color:${BRAND.textColor}">${data.message || "Configurarea email funcționează corect!"}</p>
    <p style="color:${BRAND.mutedColor};font-size:14px;text-align:center">Trimis la: ${new Date().toLocaleString("ro-RO")}</p>
  ${footer()}`;
}

function careGuideHTML(data: Record<string, any>) {
  return `${header("Ghid de Îngrijire 🕯️", "📖")}
    <p style="color:${BRAND.textColor};font-size:15px">Bună, <strong>${data.name || "Client"}</strong>!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Mulțumim pentru comanda <strong>#${(data.orderNumber || data.orderId || "").slice(0, 8)}</strong>! Iată câteva sfaturi pentru a te bucura la maxim de lumânările tale:</p>
    <div style="background:#fff;padding:20px;border-radius:8px;margin:16px 0;border:1px solid #F5E6D3">
      <h3 style="color:${BRAND.color};margin:0 0 12px">✨ Sfaturi esențiale</h3>
      <ul style="padding-left:18px;color:${BRAND.textColor};font-size:14px;line-height:1.8">
        <li><strong>Prima ardere:</strong> Lasă lumânarea să ardă 1-2 ore sau până când toată suprafața este topită. Previne formarea "tunelului".</li>
        <li><strong>Tăierea fitilului:</strong> Înainte de fiecare utilizare, taie fitilul la ~5mm pentru o ardere curată și uniformă.</li>
        <li><strong>Durata recomandată:</strong> Nu lăsa lumânarea să ardă mai mult de 4 ore consecutive.</li>
        <li><strong>Suprafață stabilă:</strong> Poziționează lumânarea pe o suprafață plană, departe de curenți de aer.</li>
        <li><strong>Stingerea:</strong> Folosește un capac sau o linguriță pentru a stinge — nu sufla, pentru a evita fumul.</li>
      </ul>
    </div>
    <div style="text-align:center;margin-top:20px">
      ${btn("Citește ghidul complet →", "https://mamalucica.ro/ingrijire-lumanari")}
    </div>
  ${footer()}`;
}

function trackingUpdateHTML(data: Record<string, any>) {
  return `${header("Comanda ta e pe drum!", "🚚")}
    <p style="color:${BRAND.textColor};font-size:15px">Bună, <strong>${data.name || "Client"}</strong>!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Comanda <strong>#${(data.orderNumber || data.orderId || "").slice(0, 8)}</strong> este în curs de procesare.</p>
    ${data.trackingNumber ? `
      <div style="background:#EDE9FE;padding:16px;border-radius:8px;margin:16px 0;text-align:center;border:1px solid #C4B5FD">
        <p style="margin:0 0 6px;font-weight:bold;color:#5B21B6">📦 Număr tracking</p>
        <p style="margin:0;font-size:20px;font-family:monospace;font-weight:bold;color:#5B21B6">${data.trackingNumber}</p>
      </div>
    ` : `
      <div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:16px 0;text-align:center;border:1px solid #F59E0B">
        <p style="margin:0;color:${BRAND.color}">📦 Status: <strong>${data.status === "shipped" ? "Expediat" : data.status === "processing" ? "În procesare" : "Confirmat"}</strong></p>
        <p style="margin:8px 0 0;color:${BRAND.mutedColor};font-size:13px">Vei primi AWB-ul de urmărire imediat ce coletul este predat curierului.</p>
      </div>
    `}
    <div style="text-align:center;margin-top:20px">
      ${btn("Verifică statusul →", data.trackingUrl || "https://mamalucica.ro/tracking")}
    </div>
  ${footer()}`;
}

function reviewRequestHTML(data: Record<string, any>) {
  const productList = (data.products || []).map((name: string) => `<li style="margin:4px 0">${name}</li>`).join("");
  return `${header("Cum a fost experiența?", "⭐")}
    <p style="color:${BRAND.textColor};font-size:15px">Bună, <strong>${data.name || "Client"}</strong>!</p>
    <p style="color:${BRAND.mutedColor};font-size:14px">Au trecut câteva zile de când ai primit comanda <strong>#${(data.orderNumber || data.orderId || "").slice(0, 8)}</strong>. Ne-ar bucura enorm să ne spui ce părere ai!</p>
    ${productList ? `<div style="background:#fff;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #F5E6D3">
      <p style="margin:0 0 8px;font-weight:bold;color:${BRAND.color}">Produse de evaluat:</p>
      <ul style="padding-left:18px;color:${BRAND.textColor};font-size:14px">${productList}</ul>
    </div>` : ""}
    <div style="text-align:center;margin:24px 0">
      <p style="font-size:32px;margin:0">⭐⭐⭐⭐⭐</p>
    </div>
    <div style="text-align:center">
      ${btn("Scrie o recenzie →", data.reviewUrl || "https://mamalucica.ro/account")}
    </div>
    <p style="color:${BRAND.mutedColor};font-size:13px;text-align:center;margin-top:16px">Recenziile tale ajută alți clienți să aleagă! 💛</p>
  ${footer()}`;
}

function weeklyReportHTML(data: Record<string, any>) {
  return data.html || `${header("Raport Săptămânal", "📊")}<p>Raport gol</p>${footer()}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Dynamic sender settings (fallback to Mama Lucica defaults)
    let fromEmail = BRAND.fromEmail;
    let fromName = BRAND.fromName;
    try {
      const { data: settingsRow } = await supabaseAdmin
        .from("app_settings")
        .select("value_json")
        .eq("key", "email_settings")
        .maybeSingle();
      if (settingsRow?.value_json) {
        const s = settingsRow.value_json as any;
        if (s.from_email) fromEmail = s.from_email;
        if (s.from_name) fromName = s.from_name;
      }
    } catch (_) {}

    const { type, to, data } = (await req.json()) as EmailRequest;

    let subject: string;
    let html: string;

    switch (type) {
      case "order_placed":
        subject = `Comandă confirmată #${(data.orderId || "").slice(0, 8)} — Mama Lucica`;
        html = orderPlacedHTML(data);
        break;
      case "order_status":
        subject = `Actualizare comandă #${(data.orderId || "").slice(0, 8)} — Mama Lucica`;
        html = orderStatusHTML(data);
        break;
      case "shipping_update":
        subject = `Comanda #${(data.orderId || "").slice(0, 8)} a fost expediată! AWB: ${data.trackingNumber || ""} 🚚`;
        html = orderShippedHTML(data);
        break;
      case "admin_new_order":
        subject = `🛒 Comandă nouă #${(data.orderId || "").slice(0, 8)} — ${Number(data.total).toFixed(2)} RON — ${data.paymentMethod}`;
        html = adminNewOrderHTML(data);
        break;
      case "welcome":
        subject = `Bun venit la Mama Lucica, ${data.name || ""}! 🎊`;
        html = welcomeHTML(data);
        break;
      case "abandoned_cart":
        subject = "Ai uitat ceva? Coșul tău te așteaptă 🛒";
        html = abandonedCartHTML(data);
        break;
      case "return_status":
        subject = `Actualizare retur #${(data.returnId || "").slice(0, 8)} — Mama Lucica`;
        html = returnStatusHTML(data);
        break;
      case "test":
        subject = "✅ Email de test — Mama Lucica";
        html = testHTML(data);
        break;
      case "care_guide":
        subject = `Ghid de îngrijire pentru comanda #${(data.orderNumber || data.orderId || "").slice(0, 8)} 🕯️ — Mama Lucica`;
        html = careGuideHTML(data);
        break;
      case "tracking_update":
        subject = `Comanda #${(data.orderNumber || data.orderId || "").slice(0, 8)} — actualizare status 📦`;
        html = trackingUpdateHTML(data);
        break;
      case "review_request":
        subject = `Cum a fost experiența cu comanda #${(data.orderNumber || data.orderId || "").slice(0, 8)}? ⭐`;
        html = reviewRequestHTML(data);
        break;
      case "weekly_report":
        subject = `📊 Raport săptămânal Mama Lucica — ${new Date().toLocaleDateString("ro-RO")}`;
        html = weeklyReportHTML(data);
        break;
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const fromField = `${fromName} <${fromEmail}>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromField, to: [to], subject, html }),
    });

    const resData = await res.json();

    // Log email
    try {
      await supabaseAdmin.from("email_logs").insert({
        to_email: to,
        from_email: fromField,
        subject,
        type,
        status: res.ok ? "sent" : "failed",
        resend_id: resData.id || null,
        error_message: res.ok ? null : JSON.stringify(resData),
        metadata: { data_keys: Object.keys(data) },
      });
    } catch (_) { console.error("Failed to log email:", _); }

    if (!res.ok) throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);

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
