import { useEffect } from "react";

const SitemapXml = () => {
  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/sitemap`);
        const xml = await res.text();
        document.open("text/xml");
        document.write(xml);
        document.close();
      } catch (e) {
        console.error("Sitemap fetch failed", e);
      }
    };
    fetchSitemap();
  }, []);

  return null;
};

export default SitemapXml;
