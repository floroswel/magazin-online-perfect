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

export default function Footer() {
  const content = useEditableContent();
  const settings = useSettings();

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

  // Social links from DB
  const socials = [
    { icon: "FB", url: settings.social_facebook },
    { icon: "IG", url: settings.social_instagram },
    { icon: "TT", url: settings.social_tiktok },
    { icon: "YT", url: settings.social_youtube },
  ].filter(s => s.url);

  // If no DB socials, show placeholder icons
  const displaySocials = socials.length > 0 ? socials : [
    { icon: "FB", url: "#" },
    { icon: "IG", url: "#" },
    { icon: "TT", url: "#" },
    { icon: "YT", url: "#" },
  ];

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
            <div className="flex gap-2">
              {displaySocials.map((s, idx) => (
                <a
                  key={`${s.icon}-${idx}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-xs text-primary-foreground font-bold hover:bg-primary transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
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
              <p>📞 {settings.contact_phone || content.header_topbar.phone || "0800-123-456"}</p>
              <p>✉️ {settings.contact_email || content.store_general.store_email}</p>
              <p>📍 {settings.contact_address || "București, România"}</p>
              <p>⏰ {settings.contact_schedule || "Luni - Vineri, 9:00 - 17:00"}</p>
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
