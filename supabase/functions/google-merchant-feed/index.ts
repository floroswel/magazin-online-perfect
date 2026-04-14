import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get site URL
    let siteUrl = "https://www.mamalucica.ro";
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "site_url")
        .maybeSingle();
      if (data?.value_json) siteUrl = String(data.value_json).replace(/\/$/, "");
    } catch (_) {}

    // Get all active products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, description, short_description, price, old_price, stock, image_url, images, brand, sku")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!products || products.length === 0) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Mama Lucica</title></channel></rss>', {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    const escapeXml = (s: string) =>
      (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

    const items = products.map((p: any) => {
      const imageUrl = p.images?.[0] || p.image_url || "";
      const availability = (p.stock || 0) > 0 ? "in stock" : "out of stock";
      const description = (p.short_description || p.description || p.name || "").replace(/<[^>]*>/g, "").slice(0, 5000);
      const price = p.price ? `${Number(p.price).toFixed(2)} RON` : "";
      const salePrice = p.old_price && p.old_price > p.price ? `${Number(p.price).toFixed(2)} RON` : "";

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${siteUrl}/produs/${escapeXml(p.slug)}</g:link>
      <g:image_link>${escapeXml(imageUrl.startsWith("http") ? imageUrl : siteUrl + imageUrl)}</g:image_link>
      <g:price>${p.old_price && p.old_price > p.price ? `${Number(p.old_price).toFixed(2)} RON` : price}</g:price>
      ${salePrice ? `<g:sale_price>${salePrice}</g:sale_price>` : ""}
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand || "Mama Lucica")}</g:brand>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ""}
      <g:google_product_category>Home &amp; Garden &gt; Decor &gt; Candles</g:google_product_category>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Mama Lucica</title>
  <link>${siteUrl}</link>
  <description>Lumânări artizanale handmade</description>
${items}
</channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<!-- Error: ${msg} -->`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});
