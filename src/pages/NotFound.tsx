import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePageSeo } from "@/components/SeoHead";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import { Search } from "lucide-react";

interface ButtonConfig { label: string; url: string; style: string; }
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
  show_search: boolean;
  search_placeholder: string;
  background_color: string | null;
  meta_title: string;
}

export default function NotFound() {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState<Settings404 | null>(null);

  // Real 404: noindex + custom meta_title
  usePageSeo({
    title: (settings?.meta_title || "Pagina nu a fost găsită") + " | Mama Lucica",
    noindex: true,
  });

  // Log + load settings
  useEffect(() => {
    // Log this 404 — fire and forget
    (supabase as any)
      .from("custom_404_log")
      .insert({
        url_accessed: pathname.slice(0, 500),
        referrer: document.referrer?.slice(0, 500) || null,
        user_agent: navigator.userAgent?.slice(0, 500) || null,
      })
      .then(() => void 0);

    (supabase as any)
      .from("custom_404_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setSettings({
            ...data,
            buttons: Array.isArray(data.buttons) ? data.buttons : (() => {
              try { return JSON.parse(data.buttons); } catch { return []; }
            })(),
          });
        }
      });
  }, [pathname]);

  // Fallback minimal 404 (used if admin didn't enable custom)
  if (!settings || !settings.enabled) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-background px-4 py-16 text-center">
          <p className="text-7xl mb-6">🕯️</p>
          <h1 className="text-4xl font-display text-foreground mb-3">Pagina s-a stins...</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Nu am găsit ce căutai. Hai să te ducem înapoi la atelierul nostru de lumânări.
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-sm font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity"
          >
            ← Înapoi la magazin
          </Link>
        </div>
      </StorefrontLayout>
    );
  }

  // Custom-rendered 404 from admin
  const align: Record<string, string> = { left: "items-start", center: "items-center", right: "items-end" };

  return (
    <StorefrontLayout>
      <div
        className={`min-h-[60vh] flex flex-col justify-center px-4 py-16 ${align[settings.image_alignment] || "items-center"}`}
        style={{ background: settings.background_color || undefined }}
      >
        <div className="max-w-2xl w-full text-center">
          {settings.image_url && (
            <img
              src={settings.image_url}
              alt=""
              className="mx-auto mb-6"
              style={{ maxWidth: settings.image_max_width }}
            />
          )}
          <h1
            style={{
              fontSize: `${settings.title_font_size}px`,
              color: settings.title_color,
              fontWeight: settings.title_bold ? 700 : 400,
            }}
            className="mb-3 font-display"
          >
            {settings.title_text}
          </h1>
          <p
            style={{ fontSize: `${settings.subtitle_font_size}px`, color: settings.subtitle_color }}
            className="mb-8"
          >
            {settings.subtitle_text}
          </p>

          {settings.show_search && (
            <form
              action="/cautare"
              method="get"
              className="flex max-w-md mx-auto mb-8 border border-border rounded-sm overflow-hidden bg-background"
            >
              <input
                name="q"
                placeholder={settings.search_placeholder}
                className="flex-1 px-4 py-2.5 text-sm outline-none bg-transparent"
              />
              <button type="submit" className="px-4 bg-primary text-primary-foreground" aria-label="Caută">
                <Search className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {settings.buttons.map((b, i) => {
              const base = "px-6 py-3 rounded-sm font-semibold text-sm transition-opacity hover:opacity-90";
              const styles: Record<string, string> = {
                default: "bg-primary text-primary-foreground",
                secondary: "bg-secondary text-secondary-foreground",
                outline: "border border-border text-foreground",
              };
              return (
                <Link key={i} to={b.url} className={`${base} ${styles[b.style] || styles.default}`}>
                  {b.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
