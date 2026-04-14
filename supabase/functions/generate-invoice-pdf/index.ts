import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPANY = {
  name: "SC VOMIX GENIUS SRL",
  brand: "Mama Lucica",
  cui: "RO43025661",
  regCom: "J2020000459343",
  address: "Str. Constructorilor nr. 39, Voievoda, Teleorman",
  iban: "RO50BTRLRONCRT0566231601",
  bank: "Banca Transilvania S.A.",
  email: "contact@mamalucica.ro",
  phone: "+40 743 326 405",
  vatNote: "Neplătitor de TVA - art. 310 Cod Fiscal",
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

    const body = await req.json();
    const invoiceId = body.invoice_id || body.invoiceId;
    const orderId = body.order_id || body.orderId;

    let invoice: any;
    let items: any[] = [];

    if (invoiceId) {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("id", invoiceId)
        .single();
      if (error || !data) throw new Error("Invoice not found");
      invoice = data;
      items = (data.invoice_items || []).sort(
        (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
      );
    } else if (orderId) {
      // Generate invoice from order directly
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*, products(name, sku))")
        .eq("id", orderId)
        .single();
      if (error || !order) throw new Error("Order not found");

      const addr = (order.shipping_address || {}) as any;
      invoice = {
        invoice_number: `ML-${new Date().getFullYear()}-${order.order_number || order.id.slice(0, 8)}`,
        type: "fiscal",
        issued_at: order.created_at,
        seller_name: COMPANY.name,
        seller_cui: COMPANY.cui,
        seller_reg_com: COMPANY.regCom,
        seller_address: COMPANY.address,
        seller_iban: COMPANY.iban,
        seller_bank: COMPANY.bank,
        buyer_name: addr.fullName || addr.full_name || order.user_email || "—",
        buyer_address: `${addr.address || ""}, ${addr.city || ""}, ${addr.county || ""}`.trim(),
        buyer_email: order.user_email,
        buyer_phone: addr.phone || "",
        subtotal: order.subtotal || order.total || 0,
        total: order.total || 0,
        discount_amount: order.discount_amount || 0,
        shipping_amount: order.shipping_total || 0,
        currency: "RON",
        payment_method: order.payment_method || "—",
        payment_status: order.payment_status || order.status || "—",
        notes: order.notes || "",
      };
      items = (order.items || []).map((it: any, i: number) => ({
        description: it.products?.name || it.product_name || `Produs ${i + 1}`,
        quantity: it.quantity,
        unit_price: it.price || 0,
        total: (it.price || 0) * (it.quantity || 1),
      }));
    } else {
      throw new Error("invoice_id or order_id required");
    }

    // ─── Build PDF ───
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const black = rgb(0, 0, 0);
    const gray = rgb(0.4, 0.4, 0.4);
    const red = rgb(0.8, 0, 0);
    const lightGray = rgb(0.95, 0.95, 0.95);

    // Helper
    const drawText = (text: string, x: number, yPos: number, opts: { font?: any; size?: number; color?: any } = {}) => {
      page.drawText(text || "", {
        x,
        y: yPos,
        size: opts.size || 10,
        font: opts.font || font,
        color: opts.color || black,
      });
    };

    // ─── HEADER ───
    const typeLabel = invoice.type === "proforma" ? "FACTURA PROFORMA"
      : invoice.type === "storno" ? "NOTA DE CREDITARE (STORNO)"
      : "FACTURA FISCALA";

    drawText(typeLabel, margin, y, { font: fontBold, size: 18, color: red });
    y -= 22;
    drawText(invoice.invoice_number || "", margin, y, { font: fontBold, size: 14 });
    y -= 16;
    const issuedDate = invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString("ro-RO")
      : new Date().toLocaleDateString("ro-RO");
    drawText(`Data emiterii: ${issuedDate}`, margin, y, { size: 9, color: gray });

    // Brand name right side
    drawText(COMPANY.brand, width - margin - fontBold.widthOfTextAtSize(COMPANY.brand, 16), height - margin, {
      font: fontBold, size: 16, color: red,
    });

    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 2, color: red });
    y -= 25;

    // ─── PARTIES ───
    const colLeft = margin;
    const colRight = width / 2 + 20;

    drawText("FURNIZOR", colLeft, y, { font: fontBold, size: 8, color: gray });
    drawText("CUMPARATOR", colRight, y, { font: fontBold, size: 8, color: gray });
    y -= 14;

    const sellerLines = [
      invoice.seller_name || COMPANY.name,
      `CUI: ${invoice.seller_cui || COMPANY.cui}`,
      `Reg. Com.: ${invoice.seller_reg_com || COMPANY.regCom}`,
      invoice.seller_address || COMPANY.address,
      `IBAN: ${invoice.seller_iban || COMPANY.iban}`,
      invoice.seller_bank || COMPANY.bank,
      COMPANY.email,
      COMPANY.phone,
    ];

    const buyerLines = [
      invoice.buyer_name || "—",
      invoice.buyer_cui ? `CUI: ${invoice.buyer_cui}` : "",
      invoice.buyer_address || "",
      invoice.buyer_email ? `Email: ${invoice.buyer_email}` : "",
      invoice.buyer_phone ? `Tel: ${invoice.buyer_phone}` : "",
    ].filter(Boolean);

    const maxLines = Math.max(sellerLines.length, buyerLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (sellerLines[i]) drawText(sellerLines[i], colLeft, y, { size: 9 });
      if (buyerLines[i]) drawText(buyerLines[i], colRight, y, { size: 9 });
      y -= 13;
    }

    y -= 10;

    // ─── TABLE HEADER ───
    const colNr = margin;
    const colDesc = margin + 30;
    const colQty = 370;
    const colPrice = 420;
    const colTotal = 490;
    const tableWidth = width - 2 * margin;

    page.drawRectangle({ x: margin, y: y - 2, width: tableWidth, height: 18, color: rgb(0.93, 0.93, 0.93) });
    drawText("Nr.", colNr, y + 2, { font: fontBold, size: 8 });
    drawText("Descriere", colDesc, y + 2, { font: fontBold, size: 8 });
    drawText("Cant.", colQty, y + 2, { font: fontBold, size: 8 });
    drawText("Pret unit.", colPrice, y + 2, { font: fontBold, size: 8 });
    drawText("Total", colTotal, y + 2, { font: fontBold, size: 8 });
    y -= 20;

    // ─── TABLE ROWS ───
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (y < 100) {
        // Would need page break for very long invoices — simplified for now
        break;
      }
      const desc = (item.description || "").substring(0, 50);
      const qty = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const rowTotal = Number(item.total || qty * unitPrice);

      if (i % 2 === 0) {
        page.drawRectangle({ x: margin, y: y - 4, width: tableWidth, height: 16, color: rgb(0.98, 0.98, 0.98) });
      }

      drawText(`${i + 1}`, colNr, y, { size: 9 });
      drawText(desc, colDesc, y, { size: 9 });
      drawText(`${qty}`, colQty, y, { size: 9 });
      drawText(`${unitPrice.toFixed(2)}`, colPrice, y, { size: 9 });
      drawText(`${rowTotal.toFixed(2)}`, colTotal, y, { font: fontBold, size: 9 });
      y -= 18;
    }

    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: gray });
    y -= 20;

    // ─── TOTALS ───
    const totalsX = 380;
    const currency = invoice.currency || "RON";

    drawText("Subtotal:", totalsX, y, { size: 10 });
    drawText(`${Number(invoice.subtotal || 0).toFixed(2)} ${currency}`, colTotal, y, { size: 10 });
    y -= 16;

    if (invoice.discount_amount && Number(invoice.discount_amount) > 0) {
      drawText("Discount:", totalsX, y, { size: 10 });
      drawText(`-${Number(invoice.discount_amount).toFixed(2)} ${currency}`, colTotal, y, { size: 10, color: rgb(0, 0.6, 0) });
      y -= 16;
    }

    if (invoice.shipping_amount && Number(invoice.shipping_amount) > 0) {
      drawText("Transport:", totalsX, y, { size: 10 });
      drawText(`${Number(invoice.shipping_amount).toFixed(2)} ${currency}`, colTotal, y, { size: 10 });
      y -= 16;
    }

    page.drawLine({ start: { x: totalsX, y: y + 4 }, end: { x: width - margin, y: y + 4 }, thickness: 1.5, color: black });
    y -= 4;
    drawText("TOTAL:", totalsX, y, { font: fontBold, size: 14 });
    drawText(`${Number(invoice.total || 0).toFixed(2)} ${currency}`, colTotal, y, { font: fontBold, size: 14 });
    y -= 14;
    drawText(COMPANY.vatNote, totalsX, y, { size: 7, color: gray });
    y -= 20;

    // Payment info
    drawText(`Metoda plata: ${invoice.payment_method || "—"}`, margin, y, { size: 9, color: gray });
    y -= 13;
    drawText(`Status plata: ${invoice.payment_status || "—"}`, margin, y, { size: 9, color: gray });

    if (invoice.notes) {
      y -= 20;
      drawText(`Observatii: ${(invoice.notes || "").substring(0, 100)}`, margin, y, { size: 9, color: gray });
    }

    // ─── FOOTER ───
    const footerY = 40;
    page.drawLine({ start: { x: margin, y: footerY + 10 }, end: { x: width - margin, y: footerY + 10 }, thickness: 0.5, color: lightGray });
    const footerText = `Factura generata electronic de ${COMPANY.brand}. Document valid fara semnatura si stampila conform art. 319 alin. 29 Cod Fiscal.`;
    drawText(footerText, margin, footerY, { size: 7, color: gray });

    // ─── Serialize PDF ───
    const pdfBytes = await pdfDoc.save();

    // If format=base64 requested (for email attachment)
    if (body.format === "base64") {
      // Convert to base64
      const base64 = btoa(String.fromCharCode(...pdfBytes));
      return new Response(
        JSON.stringify({
          pdf_base64: base64,
          filename: `Factura_${invoice.invoice_number || "ML"}.pdf`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: return PDF binary
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Factura_${invoice.invoice_number || "ML"}.pdf"`,
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
