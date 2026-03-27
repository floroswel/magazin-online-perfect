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

  const baseUrl = req.headers.get("origin") || "https://ventuza.ro";
  const url = new URL(req.url);
  const page = url.searchParams.get("page");

  // Fetch counts first to decide if we need sitemap index
  const [productsRes, categoriesRes, pagesRes, postsRes] = await Promise.all([
    supabase.from("products").select("slug, updated_at, noindex", { count: "exact" }).is("noindex", null).order("updated_at", { ascending: false }).limit(page ? 1000 : 5000).range(page ? (Number(page) - 1) * 1000 : 0, page ? Number(page) * 1000 - 1 : 4999),
    supabase.from("categories").select("slug, meta_title, meta_description").eq("visible", true).order("name"),
    supabase.from("cms_pages").select("slug, updated_at").eq("published", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
  ]);

  const totalProducts = productsRes.count || 0;
  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];
  const pages2 = pagesRes.data || [];
  const posts = postsRes.data || [];

  // If > 1000 products and no page param, return sitemap index
  const totalUrls = totalProducts + categories.length + pages2.length + posts.length + 3;
  if (!page && totalUrls > 1000) {
    const numPages = Math.ceil(totalProducts / 1000);
    let indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (let i = 1; i <= numPages + 1; i++) {
      indexXml += `\n  <sitemap><loc>${baseUrl}/functions/v1/sitemap?page=${i}</loc></sitemap>`;
    }
    indexXml += "\n</sitemapindex>";
    return new Response(indexXml, { headers: corsHeaders });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/catalog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;

  for (const cat of categories) {
    xml += `\n  <url><loc>${baseUrl}/catalog?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  }

  for (const p of products) {
    const lastmod = p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/product/${p.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  }

  for (const pg of pages2) {
    const lastmod = pg.updated_at ? `<lastmod>${pg.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/page/${pg.slug}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.5</priority></url>`;
  }

  for (const post of posts) {
    const lastmod = post.updated_at ? `<lastmod>${post.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${baseUrl}/blog/${post.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
  }

  xml += "\n</urlset>";

  return new Response(xml, { headers: corsHeaders });
});
