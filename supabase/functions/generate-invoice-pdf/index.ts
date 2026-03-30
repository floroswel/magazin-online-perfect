import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id required");

    // Fetch invoice with items
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", invoice_id)
      .single();

    if (error || !invoice) throw new Error("Invoice not found");

    // Fetch store branding
    let storeName = "Mama Lucica";
    try {
      const { data: branding } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "store_branding")
        .maybeSingle();
      if (branding?.value_json && (branding.value_json as any).name) {
        storeName = (branding.value_json as any).name;
      }
    } catch (_) {}

    // Fetch invoice settings for footer
    let footerText = "";
    try {
      const { data: invSettings } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "invoice_settings")
        .maybeSingle();
      if (invSettings?.value_json) {
        footerText = (invSettings.value_json as any).footer_text || "";
      }
    } catch (_) {}

    const items = (invoice.invoice_items || []).sort(
      (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
    );

    const typeLabel =
      invoice.type === "proforma"
        ? "FACTURĂ PROFORMĂ"
        : invoice.type === "storno"
        ? "NOTĂ DE CREDITARE (STORNO)"
        : "FACTURĂ FISCALĂ";

    const itemsHTML = items
      .map(
        (item: any, i: number) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.description}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:600">${Number(item.total || item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>${typeLabel} ${invoice.invoice_number}</title>
  <style>
    @media print { body { margin: 0; } @page { margin: 15mm; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 13px; line-height: 1.5; background: #fff; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #cc0000; padding-bottom: 20px; }
    .doc-type { font-size: 24px; font-weight: 800; color: #cc0000; letter-spacing: 1px; }
    .doc-number { font-size: 16px; font-weight: 600; color: #333; margin-top: 4px; }
    .doc-date { font-size: 12px; color: #666; margin-top: 2px; }
    .parties { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 30px; }
    .party { flex: 1; }
    .party-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .party-detail { font-size: 12px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f5f5f5; padding: 10px 8px; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #555; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .total-row.grand { border-top: 2px solid #333; padding-top: 10px; margin-top: 6px; font-size: 18px; font-weight: 800; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #888; text-align: center; }
    .storno-badge { background: #fee; border: 2px solid #c00; color: #c00; padding: 6px 16px; border-radius: 4px; font-weight: 800; display: inline-block; margin-bottom: 10px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #cc0000; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 600; z-index: 100; }
    .print-btn:hover { background: #aa0000; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Printează / Salvează PDF</button>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="doc-type">${typeLabel}</div>
        <div class="doc-number">${invoice.invoice_number}</div>
        <div class="doc-date">Data emiterii: ${invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString("ro-RO") : new Date().toLocaleDateString("ro-RO")}</div>
        ${invoice.due_date ? `<div class="doc-date">Scadență: ${new Date(invoice.due_date).toLocaleDateString("ro-RO")}</div>` : ""}
      </div>
      <div style="text-align:right">
        <div style="font-size:20px;font-weight:800;color:#cc0000">${storeName}</div>
        ${invoice.type === "storno" ? '<div class="storno-badge">STORNO</div>' : ""}
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Furnizor</div>
        <div class="party-name">${invoice.seller_name || storeName}</div>
        <div class="party-detail">
          ${invoice.seller_cui ? `CUI: ${invoice.seller_cui}<br>` : ""}
          ${invoice.seller_reg_com ? `Reg. Com.: ${invoice.seller_reg_com}<br>` : ""}
          ${invoice.seller_address || ""}<br>
          ${invoice.seller_bank ? `Banca: ${invoice.seller_bank}<br>` : ""}
          ${invoice.seller_iban ? `IBAN: ${invoice.seller_iban}` : ""}
        </div>
      </div>
      <div class="party">
        <div class="party-label">Cumpărător</div>
        <div class="party-name">${invoice.buyer_name || "—"}</div>
        <div class="party-detail">
          ${invoice.buyer_cui ? `CUI: ${invoice.buyer_cui}<br>` : ""}
          ${invoice.buyer_address || ""}<br>
          ${invoice.buyer_email ? `Email: ${invoice.buyer_email}<br>` : ""}
          ${invoice.buyer_phone ? `Tel: ${invoice.buyer_phone}` : ""}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center">Nr.</th>
          <th>Descriere</th>
          <th style="width:60px;text-align:center">Cant.</th>
          <th style="width:100px;text-align:right">Preț unit.</th>
          <th style="width:110px;text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="total-row"><span>Subtotal (fără TVA):</span><span>${Number(invoice.subtotal || 0).toFixed(2)} ${invoice.currency || "RON"}</span></div>
        <div class="total-row"><span>TVA total:</span><span>${Number(invoice.vat_amount || 0).toFixed(2)} ${invoice.currency || "RON"}</span></div>
        ${invoice.discount_amount ? `<div class="total-row" style="color:green"><span>Discount:</span><span>-${Number(invoice.discount_amount).toFixed(2)} ${invoice.currency || "RON"}</span></div>` : ""}
        ${invoice.shipping_amount ? `<div class="total-row"><span>Transport:</span><span>${Number(invoice.shipping_amount).toFixed(2)} ${invoice.currency || "RON"}</span></div>` : ""}
        <div class="total-row grand"><span>TOTAL:</span><span>${Number(invoice.total || 0).toFixed(2)} ${invoice.currency || "RON"}</span></div>
      </div>
    </div>

    <div style="margin-top:30px;font-size:12px;color:#555">
      <p><strong>Metodă plată:</strong> ${invoice.payment_method || "—"}</p>
      <p><strong>Status plată:</strong> ${invoice.payment_status || invoice.status || "—"}</p>
      ${invoice.storno_reference ? `<p><strong>Referință factură originală:</strong> ${invoice.storno_reference}</p>` : ""}
    </div>

    ${invoice.notes ? `<div style="margin-top:20px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:12px;color:#666"><strong>Observații:</strong> ${invoice.notes}</div>` : ""}

    <div class="footer">
      ${footerText || `Factură generată electronic de ${storeName}. Document valid fără semnătură și ștampilă conform art. 319 alin. 29 din Codul Fiscal.`}
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
