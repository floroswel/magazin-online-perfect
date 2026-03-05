import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escXml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get store settings for base URL
    const { data: settings } = await supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "general")
      .maybeSingle();

    const storeUrl = (settings?.value_json as any)?.store_url || "https://shop.example.com";
    const storeName = (settings?.value_json as any)?.store_name || "Shop";
    const currency = (settings?.value_json as any)?.currency || "RON";

    // Fetch all active visible products
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, description, price, old_price, stock, image_url, brand, sku, ean, category_id, categories(name), weight_kg, status, visible")
      .eq("status", "active")
      .neq("visible", false)
      .order("name")
      .limit(10000);

    if (error) throw error;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${escXml(storeName)} - Google Shopping Feed</title>
<link>${escXml(storeUrl)}</link>
<description>Product feed for Google Shopping</description>
`;

    for (const p of products || []) {
      const availability = (p.stock || 0) > 0 ? "in_stock" : "out_of_stock";
      const link = `${storeUrl}/produs/${p.slug}`;
      const categoryName = (p as any).categories?.name || "";

      xml += `<item>
<g:id>${escXml(p.sku || p.id)}</g:id>
<title>${escXml(p.name)}</title>
<description>${escXml(p.description?.substring(0, 5000) || p.name)}</description>
<link>${escXml(link)}</link>
<g:image_link>${escXml(p.image_url || "")}</g:image_link>
<g:availability>${availability}</g:availability>
<g:price>${p.price} ${currency}</g:price>
${p.old_price && p.old_price > p.price ? `<g:sale_price>${p.price} ${currency}</g:sale_price>\n<g:price>${p.old_price} ${currency}</g:price>` : ""}
<g:brand>${escXml(p.brand || storeName)}</g:brand>
${p.ean ? `<g:gtin>${escXml(p.ean)}</g:gtin>` : ""}
${categoryName ? `<g:product_type>${escXml(categoryName)}</g:product_type>` : ""}
<g:condition>new</g:condition>
${p.weight_kg ? `<g:shipping_weight>${p.weight_kg} kg</g:shipping_weight>` : ""}
</item>
`;
    }

    xml += `</channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (err) {
    console.error("Google Shopping feed error:", err);
    return new Response(
      `<?xml version="1.0"?><error>${err instanceof Error ? err.message : "Unknown error"}</error>`,
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
});
