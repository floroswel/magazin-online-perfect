/**
 * Sanitize a string for safe use inside a <script type="application/ld+json"> tag.
 * Prevents XSS by escaping </script> sequences and control characters.
 */
export function sanitizeForJsonLd(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "")
    .replace(/-->/g, "");
}

/**
 * Create a safe JSON-LD string from an object.
 * Escapes any </script> tags that might appear in string values.
 */
export function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");
}
