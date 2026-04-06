import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

/* ── Helper: parse "Label:/path|Label2:/path2" format ── */
function parsePipeLinks(raw: string): { label: string; to: string }[] {
  if (!raw) return [];
  return raw.split("|").map((entry) => {
    const idx = entry.lastIndexOf(":");
    if (idx <= 0) return null;
    const label = entry.slice(0, idx).trim();
    const to = entry.slice(idx + 1).trim();
    return label && to ? { label, to } : null;
  }).filter(Boolean) as { label: string; to: string }[];
}

/* ── Social SVG icons ── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);

const SOCIAL_ITEMS = [
  { key: "footer_facebook_url", label: "Facebook", icon: <FacebookIcon /> },
  { key: "footer_instagram_url", label: "Instagram", icon: <InstagramIcon /> },
  { key: "footer_tiktok_url", label: "TikTok", icon: <TikTokIcon /> },
];

export default function Footer() {
  const { settings } = useSettings();

  const storeName = settings.footer_store_name || settings.site_name || "Mama Lucica";
  const description = settings.footer_description || "";
  const email = settings.footer_email || settings.contact_email || "";
  const copyrightName = settings.footer_copyright_name || storeName;
  const showAnpc = settings.footer_show_anpc === "true";
  const madeInRo = settings.footer_made_in_romania === "true";

  const productLinks = parsePipeLinks(settings.footer_products_links || "");
  const infoLinks = parsePipeLinks(settings.footer_info_links || "");

  const activeSocials = SOCIAL_ITEMS.filter(
    (s) => settings[s.key] && settings[s.key].trim() !== ""
  );

  return (
    <footer>
      {/* ── Main footer ── */}
      <div
        className="py-10 md:py-14"
        style={{ background: settings.footer_upper_bg || "hsl(220 50% 12%)" }}
      >
        <div className="lumax-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1 — Brand */}
          <div>
            {settings.logo_url && settings.logo_visible !== "false" ? (
              <img
                src={settings.logo_url}
                alt={storeName}
                style={{ height: "36px", objectFit: "contain" }}
                className="mb-3"
              />
            ) : (
              <h3 className="text-xl font-bold text-primary-foreground mb-3">
                {storeName}
              </h3>
            )}
            {description && (
              <p className="text-sm text-primary-foreground/60 leading-relaxed mb-4">
                {description}
              </p>
            )}
            {activeSocials.length > 0 && (
              <div className="flex gap-2">
                {activeSocials.map((s) => (
                  <a
                    key={s.key}
                    href={settings[s.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary transition-colors"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Col 2 — Produse */}
          {productLinks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
                Produse
              </h4>
              <ul className="space-y-1.5">
                {productLinks.map((l, i) => (
                  <li key={i}>
                    <Link
                      to={l.to}
                      className="text-[13px] text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 3 — Informații */}
          {infoLinks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
                Informații
              </h4>
              <ul className="space-y-1.5">
                {infoLinks.map((l, i) => (
                  <li key={i}>
                    <Link
                      to={l.to}
                      className="text-[13px] text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 4 — Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
              Contact
            </h4>
            <div className="space-y-2 text-[13px] text-primary-foreground/60">
              {email && <p>✉️ {email}</p>}
            </div>

            {showAnpc && (
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest">
                  Soluționarea litigiilor
                </p>
                <a
                  href="https://www.anpc.gov.ro/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary-foreground/60 hover:text-primary-foreground transition-colors block"
                >
                  ANPC – SAL
                </a>
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary-foreground/60 hover:text-primary-foreground transition-colors block"
                >
                  SOL – Platformă ODR
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="py-3.5 border-t border-primary-foreground/5"
        style={{ background: settings.footer_lower_bg || "hsl(220 50% 8%)" }}
      >
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-center gap-1 text-center">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {copyrightName}
            {madeInRo && " · Made with ❤️ în România"}
          </span>
        </div>
      </div>
    </footer>
  );
}
