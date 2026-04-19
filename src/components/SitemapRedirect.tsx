// Server-side sitemap is at /functions/v1/sitemap.
// If a crawler hits the SPA at /sitemap.xml, redirect them there.
import { useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function SitemapRedirect() {
  useEffect(() => {
    window.location.replace(`${SUPABASE_URL}/functions/v1/sitemap`);
  }, []);
  return null;
}
