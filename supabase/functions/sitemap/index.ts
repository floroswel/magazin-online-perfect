import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const baseUrl = req.headers.get("origin") || "https://megashop.ro";

  // Fetch data in parallel
  const [productsRes, categoriesRes, pagesRes, postsRes] = await Promise.all([
    supabase.from("products").select("slug, updated_at").order("updated_at", { ascending: false }).limit(5000),
    supabase.from("categories").select("slug").order("name"),
    supabase.from("cms_pages").select("slug, updated_at").eq("published", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
  ]);

  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];
  const pages = pagesRes.data || [];
  const posts = postsRes.data || [];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/catalog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/auth</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>`;

  for (const cat of categories) {
    xml += `\n  <url><loc>${baseUrl}/catalog?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  }

  for (const p of products) {
    const lastmod = p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/product/${p.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`;
  }

  for (const page of pages) {
    const lastmod = page.updated_at ? `<lastmod>${page.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/page/${page.slug}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.5</priority></url>`;
  }

  for (const post of posts) {
    const lastmod = post.updated_at ? `<lastmod>${post.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/blog/${post.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  }

  xml += "\n</urlset>";

  return new Response(xml, { headers: corsHeaders });
});
