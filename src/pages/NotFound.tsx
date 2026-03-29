import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

interface ButtonConfig { label: string; url: string; style: string; color: string; }

interface Settings404 {
  enabled: boolean;
  image_url: string | null;
  image_alignment: string;
  image_max_width: string;
  title_text: string;
  title_font_size: number;
  title_color: string;
  title_bold: boolean;
  subtitle_text: string;
  subtitle_font_size: number;
  subtitle_color: string;
  buttons: ButtonConfig[];
  show_recommended_products: boolean;
  recommended_section_title: string;
  recommended_count: number;
  recommended_source: string;
  recommended_product_ids: string[] | null;
  recommended_show_price: boolean;
  recommended_show_add_to_cart: boolean;
  show_search: boolean;
  search_placeholder: string;
  show_categories: boolean;
  categories_title: string;
  category_ids: string[] | null;
  background_color: string | null;
  background_image_url: string | null;
  meta_title: string;
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings404 | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Log 404 visit (fire-and-forget)
    (supabase as any).from("custom_404_log").insert({
      url_accessed: location.pathname + location.search,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }).then(() => {});

    // Load settings
    (supabase as any).from("custom_404_settings").select("*").limit(1).single().then(({ data }: any) => {
      if (data) {
        const s = {
          ...data,
          buttons: Array.isArray(data.buttons) ? data.buttons as unknown as ButtonConfig[] : [],
          recommended_product_ids: data.recommended_product_ids as string[] | null,
          category_ids: data.category_ids as string[] | null,
        } as Settings404;
        setSettings(s);

        // Set SEO
        document.title = s.meta_title || "Pagina nu a fost găsită";
        let metaRobots = document.querySelector('meta[name="robots"]');
        if (!metaRobots) { metaRobots = document.createElement("meta"); metaRobots.setAttribute("name", "robots"); document.head.appendChild(metaRobots); }
        metaRobots.setAttribute("content", "noindex, nofollow");

        // Load recommended products if enabled
        if (s.enabled && s.show_recommended_products) {
          loadProducts(s);
        }
        // Load categories if enabled
        if (s.enabled && s.show_categories) {
          loadCategories(s);
        }
      }
      setLoading(false);
    });
  }, [location.pathname]);

  async function loadProducts(s: Settings404) {
    let query = supabase.from("products").select("id,name,slug,price,image_url,old_price").eq("visible", true);
    if (s.recommended_source === "featured") {
      query = query.eq("featured", true);
    }
    // For best_selling or featured fallback, just order by created_at desc
    const { data } = await query.order("created_at", { ascending: false }).limit(s.recommended_count);
    setProducts(data || []);
  }

  async function loadCategories(s: Settings404) {
    let query = supabase.from("categories").select("id,name,slug,image_url").eq("visible", true).eq("show_in_nav", true);
    if (s.category_ids && s.category_ids.length > 0) {
      query = query.in("id", s.category_ids);
    } else {
      query = query.is("parent_id", null);
    }
    const { data } = await query.order("display_order").limit(8);
    setCategories(data || []);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Default plain 404
  if (!settings || !settings.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>
        </div>
      </div>
    );
  }

  // Custom branded 404
  return (
    <Layout>
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16"
        style={{
          backgroundColor: settings.background_color || undefined,
          backgroundImage: settings.background_image_url ? `url(${settings.background_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-2xl mx-auto text-center space-y-6 w-full">
          {/* Image */}
          {settings.image_url ? (
            <div style={{ textAlign: settings.image_alignment as any }}>
              <img
                src={settings.image_url}
                alt="404"
                style={{ maxWidth: settings.image_max_width, display: "inline-block" }}
                className="rounded"
              />
            </div>
          ) : (
            <div className="text-8xl font-bold text-muted-foreground/30 select-none">404</div>
          )}

          {/* Title */}
          <h1 style={{ fontSize: settings.title_font_size, color: settings.title_color, fontWeight: settings.title_bold ? 700 : 400 }}>
            {settings.title_text}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: settings.subtitle_font_size, color: settings.subtitle_color }} className="max-w-lg mx-auto">
            {settings.subtitle_text}
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            {settings.buttons.map((btn, i) => (
              <Button key={i} variant={btn.style as any || "default"} size="lg" asChild>
                <Link to={btn.url}>{btn.label}</Link>
              </Button>
            ))}
          </div>

          {/* Search */}
          {settings.show_search && (
            <form onSubmit={handleSearch} className="max-w-sm mx-auto flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={settings.search_placeholder}
              />
              <Button type="submit" size="icon" variant="outline"><Search className="w-4 h-4" /></Button>
            </form>
          )}

          {/* Categories */}
          {settings.show_categories && categories.length > 0 && (
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">{settings.categories_title}</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <Button key={cat.id} variant="outline" size="sm" asChild>
                    <Link to={`/catalog?category=${cat.slug}`}>{cat.name}</Link>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended products */}
          {settings.show_recommended_products && products.length > 0 && (
            <div className="pt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">{settings.recommended_section_title}</h3>
              <div className={`grid gap-4 ${products.length <= 2 ? "grid-cols-2" : products.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"}`}>
                {products.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} className="group border rounded-lg p-3 hover:shadow-md transition-shadow bg-card">
                    {p.image_url && (
                      <img src={p.image_url} alt={p.name} className="w-full aspect-square object-contain rounded mb-2" />
                    )}
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{p.name}</p>
                    {settings.recommended_show_price && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{Number(p.price).toFixed(2)} RON</span>
                        {p.old_price && <span className="text-xs text-muted-foreground line-through">{Number(p.old_price).toFixed(2)} RON</span>}
                      </div>
                    )}
                    {settings.recommended_show_add_to_cart && (
                      <Button size="sm" variant="outline" className="w-full mt-2 text-xs" onClick={(e) => e.preventDefault()}>Adaugă în coș</Button>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
