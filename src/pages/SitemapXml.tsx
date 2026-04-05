import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function SitemapXml() {
  const [xml, setXml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const siteUrl = (window.location.origin).replace(/\/$/, "");

      const [productsRes, categoriesRes, postsRes] = await Promise.all([
        supabase.from("products").select("slug, created_at").eq("visible", true).order("created_at", { ascending: false }).limit(1000),
        supabase.from("categories").select("slug, created_at").eq("visible", true),
        supabase.from("blog_posts").select("slug, updated_at").eq("status", "published"),
      ]);

      const products = (productsRes.data || []) as any[];
      const categories = (categoriesRes.data || []) as any[];
      const posts = (postsRes.data || []) as any[];

      const staticPages = [
        { path: "/", priority: "1.0", freq: "daily" },
        { path: "/catalog", priority: "0.9", freq: "daily" },
        { path: "/quiz-parfum", priority: "0.7", freq: "monthly" },
        { path: "/recenzii", priority: "0.6", freq: "weekly" },
        { path: "/personalizare", priority: "0.6", freq: "monthly" },
      ];

      let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      for (const sp of staticPages) {
        xmlStr += `\n  <url><loc>${siteUrl}${sp.path}</loc><changefreq>${sp.freq}</changefreq><priority>${sp.priority}</priority></url>`;
      }

      for (const cat of categories) {
        xmlStr += `\n  <url><loc>${siteUrl}/catalog?category=${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }

      for (const p of products) {
        const lastmod = p.created_at ? `<lastmod>${p.created_at.slice(0, 10)}</lastmod>` : "";
        xmlStr += `\n  <url><loc>${siteUrl}/product/${p.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }

      for (const post of posts) {
        const lastmod = post.updated_at ? `<lastmod>${post.updated_at.slice(0, 10)}</lastmod>` : "";
        xmlStr += `\n  <url><loc>${siteUrl}/blog/${post.slug}</loc>${lastmod}<changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }

      xmlStr += "\n</urlset>";
      setXml(xmlStr);
    })();
  }, []);

  useEffect(() => {
    if (xml) {
      document.open("text/xml");
      document.write(xml);
      document.close();
    }
  }, [xml]);

  return null;
}
