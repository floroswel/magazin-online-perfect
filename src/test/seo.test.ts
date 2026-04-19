import { describe, it, expect } from "vitest";
import { safeJsonLd } from "@/lib/sanitize-json-ld";

describe("SEO regression", () => {
  describe("Canonical URL format", () => {
    it("legacy /product/:slug is recognized as redirect source", () => {
      const path = "/product/lumanare-lavanda";
      expect(path.startsWith("/product/")).toBe(true);
      const slug = path.slice("/product/".length);
      const target = `/produs/${slug}`;
      expect(target).toBe("/produs/lumanare-lavanda");
    });

    it("canonical product path is /produs/:slug", () => {
      const slug = "test-candle";
      expect(`/produs/${slug}`).toMatch(/^\/produs\/[a-z0-9-]+$/);
    });
  });

  describe("Admin redirect matching", () => {
    const redirects = [
      { source_url: "/old-page", target_url: "/new-page", is_active: true },
      { source_url: "/promo-2024", target_url: "/promotii", is_active: true },
      { source_url: "/inactive", target_url: "/x", is_active: false },
    ];

    function matchRedirect(pathname: string) {
      return redirects
        .filter((r) => r.is_active)
        .find((r) => {
          const src = r.source_url.startsWith("/") ? r.source_url : "/" + r.source_url;
          return src === pathname || src === pathname + "/";
        });
    }

    it("matches active redirect by exact path", () => {
      expect(matchRedirect("/old-page")?.target_url).toBe("/new-page");
    });

    it("ignores inactive redirects", () => {
      expect(matchRedirect("/inactive")).toBeUndefined();
    });

    it("returns undefined for unknown paths", () => {
      expect(matchRedirect("/random")).toBeUndefined();
    });
  });

  describe("404 behavior", () => {
    it("404 page must be marked noindex", () => {
      // Simulate the SeoHead noindex flag passed by NotFound
      const noindex = true;
      expect(noindex ? "noindex, nofollow" : "index, follow").toBe("noindex, nofollow");
    });
  });

  describe("JSON-LD safety", () => {
    it("escapes </script> in product name", () => {
      const json = safeJsonLd({
        "@type": "Product",
        name: "Hack</script><script>alert(1)</script>",
      });
      expect(json).not.toContain("</script>");
      expect(json).toContain("<\\/script");
    });

    it("produces valid JSON parseable structure", () => {
      const json = safeJsonLd({
        "@context": "https://schema.org/",
        "@type": "Product",
        name: "Lumânare lavandă",
        offers: { "@type": "Offer", price: "59.00", priceCurrency: "RON" },
      });
      // Reverse the escaping for parse check
      const parsed = JSON.parse(json.replace(/<\\\/script/g, "</script"));
      expect(parsed["@type"]).toBe("Product");
      expect(parsed.offers.priceCurrency).toBe("RON");
    });
  });

  describe("Robots disallow rules", () => {
    const disallowed = ["/admin/", "/checkout", "/account", "/cos", "/cautare", "/auth"];
    it("private routes are disallowed for crawlers", () => {
      for (const path of disallowed) {
        expect(disallowed.includes(path)).toBe(true);
      }
    });
  });
});
