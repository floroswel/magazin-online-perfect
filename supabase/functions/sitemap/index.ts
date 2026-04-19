import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

// SEO programmatic cities & categories — keep in sync with src/lib/seoData.ts
const SEO_CITIES = [
  "bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta",
  "brasov", "craiova", "galati", "ploiesti", "oradea",
  "sibiu", "arad", "pitesti", "bacau", "targu-mures",
  "baia-mare", "buzau", "satu-mare", "botosani", "suceava",
];

const SEO_CATEGORIES = [
  "lumanari-parfumate", "lumanari-decorative", "cadouri-lumanari",
  "lumanari-soia", "lumanari-artizanale", "lumanari-masaj",
  "lumanari-botez", "lumanari-nunta", "lumanari-craciun",
  "set-lumanari", "lumanari-lavanda", "lumanari-vanilie",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const siteUrl = (Deno.env.get("SITE_URL") || "https://www.mamalucica.ro").replace(/\/$/, "").replace(/^https?:\/\/(?!www\.)/, "https://www.");
  const url = new URL(req.url);
  const page = url.searchParams.get("page");

  const [productsRes, categoriesRes, pagesRes, postsRes] = await Promise.all([
    supabase.from("products").select("slug, updated_at", { count: "exact" })
      .eq("visible", true)
      .order("updated_at", { ascending: false })
      .range(page ? (Number(page) - 1) * 1000 : 0, page ? Number(page) * 1000 - 1 : 4999),
    supabase.from("categories").select("slug, name").eq("visible", true).order("name"),
    supabase.from("cms_pages").select("slug, updated_at").eq("published", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
  ]);

  const totalProducts = productsRes.count || 0;
  const products = productsRes.data || [];
  const categories = categoriesRes.data || [];
  const cmsPages = pagesRes.data || [];
  const posts = postsRes.data || [];

  // Static pages
  const staticPages = [
    { path: "/", priority: "1.0", freq: "daily" },
    { path: "/catalog", priority: "0.9", freq: "daily" },
    { path: "/quiz-parfum", priority: "0.7", freq: "monthly" },
    { path: "/povestea-noastra", priority: "0.6", freq: "monthly" },
    { path: "/faq", priority: "0.5", freq: "monthly" },
    { path: "/recenzii", priority: "0.6", freq: "weekly" },
    { path: "/afilieri", priority: "0.4", freq: "monthly" },
    { path: "/corporate-gifting", priority: "0.5", freq: "monthly" },
    { path: "/personalizare", priority: "0.6", freq: "monthly" },
    { path: "/ingrijire-lumanari", priority: "0.5", freq: "monthly" },
    { path: "/livrare-internationala", priority: "0.5", freq: "monthly" },
    { path: "/l", priority: "0.7", freq: "weekly" },
  ];

  // Programmatic SEO pages count
  const seoPageCount = SEO_CITIES.length * SEO_CATEGORIES.length; // 240 pages

  const totalUrls = totalProducts + categories.length + cmsPages.length + posts.length + staticPages.length + seoPageCount;
  if (!page && totalUrls > 1000) {
    const numPages = Math.ceil(totalUrls / 1000);
    let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (let i = 1; i <= numPages; i++) {
      indexXml += `\n  <sitemap><loc>${siteUrl}/functions/v1/sitemap?page=${i}</loc></sitemap>`;
    }
    indexXml += "\n</sitemapindex>";
    return new Response(indexXml, { headers: corsHeaders });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  for (const sp of staticPages) {
    xml += `\n  <url><loc>${siteUrl}${sp.path}</loc><changefreq>${sp.freq}</changefreq><priority>${sp.priority}</priority></url>`;
  }

  // Categories
  for (const cat of categories) {
    xml += `\n  <url><loc>${siteUrl}/catalog?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
  }

  // Programmatic SEO pages (city+category)
  for (const city of SEO_CITIES) {
    for (const cat of SEO_CATEGORIES) {
      xml += `\n  <url><loc>${siteUrl}/l/${city}/${cat}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`;
    }
  }

  // Products (canonical: /produs/:slug)
  for (const p of products) {
    const lastmod = p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${siteUrl}/produs/${p.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.9</priority></url>`;
  }

  // CMS pages
  for (const pg of cmsPages) {
    const lastmod = pg.updated_at ? `<lastmod>${pg.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${siteUrl}/page/${pg.slug}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.6</priority></url>`;
  }

  // Blog posts
  for (const post of posts) {
    const lastmod = post.updated_at ? `<lastmod>${post.updated_at.slice(0, 10)}</lastmod>` : "";
    xml += `\n  <url><loc>${siteUrl}/blog/${post.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`;
  }

  xml += "\n</urlset>";

  return new Response(xml, { headers: corsHeaders });
});
