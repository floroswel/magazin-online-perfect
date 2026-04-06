import { Link } from "react-router-dom";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useSettings } from "@/hooks/useSettings";

const DEFAULT_LINKS_COL1 = [
  { label: "Despre noi", to: "/despre-noi" },
  { label: "Blog", to: "/blog" },
  { label: "Recenzii", to: "/recenzii" },
  { label: "Contact", to: "/contact" },
];

const DEFAULT_LINKS_COL2 = [
  { label: "Cum comand?", to: "/cum-comand" },
  { label: "Livrare și retur", to: "/politica-de-retur" },
  { label: "Garanții", to: "/page/garantie" },
  { label: "FAQ", to: "/faq" },
  { label: "Termeni și condiții", to: "/termeni-si-conditii" },
];

const SOCIAL_LINKS = [
  {
    key: "social_facebook",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: "social_instagram",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    key: "social_tiktok",
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  {
    key: "social_youtube",
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
  {
    key: "social_pinterest",
    label: "Pinterest",
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const content = useEditableContent();
  const { settings } = useSettings();

  const siteName = settings.site_name || "LUMAX";
  const siteTagline = settings.site_tagline || "Magazinul tău de încredere din România";

  // Footer columns from DB or fallback
  let col1Links = DEFAULT_LINKS_COL1;
  let col2Links = DEFAULT_LINKS_COL2;
  try {
    const parsed1 = JSON.parse(settings.footer_col1_links || "[]");
    if (Array.isArray(parsed1) && parsed1.length > 0) col1Links = parsed1;
  } catch {}
  try {
    const parsed2 = JSON.parse(settings.footer_col2_links || "[]");
    if (Array.isArray(parsed2) && parsed2.length > 0) col2Links = parsed2;
  } catch {}

  // Only show social icons that have a URL filled in
  const activeSocials = SOCIAL_LINKS.filter(s => settings[s.key] && settings[s.key].trim() !== "");

  const copyrightText = settings.copyright_text || `© ${new Date().getFullYear()} ${siteName} SRL. Toate drepturile rezervate.`;

  return (
    <footer>
      {/* Main footer */}
      <div className="py-10 md:py-12" style={{ background: settings.footer_upper_bg || "hsl(220 50% 12%)" }}>
        <div className="lumax-container grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {settings.logo_url && settings.logo_visible !== "false" ? (
              <img src={settings.logo_url} alt={siteName} style={{ height: "36px", objectFit: "contain" }} className="mb-1" />
            ) : (
              <h3 className="text-2xl font-black text-primary-foreground mb-1">{siteName}</h3>
            )}
            <p className="text-sm text-primary-foreground/60 mb-3">{siteTagline}</p>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-lumax-yellow text-sm">★★★★★</span>
              <span className="text-xs text-primary-foreground/80">1000+ clienți mulțumiți</span>
            </div>
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

          {/* Info links */}
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
              {settings.footer_col1_title || "Informații"}
            </h4>
            <ul className="space-y-1.5">
              {col1Links.map((l: any, idx: number) => (
                <li key={`col1-${idx}`}>
                  <Link to={l.to || l.url} className="text-[13px] text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
              {settings.footer_col2_title || "Ajutor"}
            </h4>
            <ul className="space-y-1.5">
              {col2Links.map((l: any, idx: number) => (
                <li key={`col2-${idx}`}>
                  <Link to={l.to || l.url} className="text-[13px] text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-primary-foreground uppercase tracking-widest mb-4">
              Contact
            </h4>
            <div className="space-y-2 text-[13px] text-primary-foreground/60">
              {settings.contact_phone && <p>📞 {settings.contact_phone}</p>}
              {settings.contact_email && <p>✉️ {settings.contact_email}</p>}
              {settings.contact_address && <p>📍 {settings.contact_address}</p>}
              {settings.contact_schedule && <p>⏰ {settings.contact_schedule}</p>}
              {!settings.contact_phone && !settings.contact_email && !settings.contact_address && (
                <>
                  <p>📞 {content.header_topbar.phone || "0800-123-456"}</p>
                  <p>✉️ contact@magazin.ro</p>
                  <p>📍 București, România</p>
                  <p>⏰ Luni - Vineri, 9:00 - 17:00</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="py-3.5 border-t border-primary-foreground/5" style={{ background: settings.footer_lower_bg || "hsl(220 50% 8%)" }}>
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{copyrightText}</span>
          <div className="flex items-center gap-3">
            {(settings.anpc_display === "widget" || settings.anpc_display === "ambele" || settings.anpc_display === "link" || !settings.anpc_display) && (
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                <img src="/images/eu-sol.png" alt="Soluționare Online a Litigiilor" className="h-6 opacity-60 hover:opacity-100 transition-opacity" />
              </a>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Visa · Mastercard · Netopia</span>
        </div>
      </div>
    </footer>
  );
}
