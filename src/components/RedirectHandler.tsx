import { useSeoRedirects } from "@/hooks/useSeoRedirects";
import { useLocation, Navigate } from "react-router-dom";

/**
 * Mounts inside Router. Handles two things:
 * 1. Hard 301 from legacy /product/:slug → /produs/:slug
 * 2. Admin-defined seo_redirects via useSeoRedirects()
 */
export default function RedirectHandler() {
  useSeoRedirects();
  const { pathname, search, hash } = useLocation();

  // Legacy English product URL → canonical Romanian
  if (pathname.startsWith("/product/")) {
    const slug = pathname.slice("/product/".length);
    return <Navigate to={`/produs/${slug}${search}${hash}`} replace />;
  }
  return null;
}
