// SEO head minim — folosit de paginile de auth.
import { useEffect } from "react";

interface SeoOptions {
  title?: string;
  description?: string;
  noindex?: boolean;
  canonical?: string;
}

export function usePageSeo(opts: SeoOptions = {}) {
  useEffect(() => {
    if (opts.title) document.title = opts.title;
    if (opts.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", opts.description.slice(0, 160));
    }
    if (opts.noindex) {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, nofollow");
    }
    if (opts.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", opts.canonical);
    }
  }, [opts.title, opts.description, opts.noindex, opts.canonical]);
}

export default function SeoHead(props: SeoOptions) {
  usePageSeo(props);
  return null;
}
