// Centralized HTML sanitizer for storefront content rendered with dangerouslySetInnerHTML.
// Used wherever user-generated or admin-authored HTML reaches end users (product descriptions,
// CMS pages, blog posts, etc). Admin-only previews can use raw HTML — admins are trusted.
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "i", "img", "li", "ol", "p", "pre", "span", "strong", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "u", "ul", "iframe", "figure", "figcaption",
];

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "target", "rel", "class", "id", "style",
  "width", "height", "loading", "decoding", "frameborder", "allow", "allowfullscreen",
];

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:|\/|#)/i,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "form", "input", "button", "object", "embed"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"],
  });
}
