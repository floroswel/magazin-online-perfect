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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const SOCIAL_LINKS = [
  { settingsKey: "footer_facebook_url", label: "Facebook", icon: <FacebookIcon /> },
  { settingsKey: "footer_instagram_url", label: "Instagram", icon: <InstagramIcon /> },
  { settingsKey: "footer_tiktok_url", label: "TikTok", icon: <TikTokIcon /> },
];

export default function Footer() {
  const content = useEditableContent();
  const { settings } = useSettings();

  const storeName = settings.footer_store_name || settings.site_name || "";
  const tagline = settings.footer_tagline || settings.site_tagline || "";

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

  // Only show social icons that have a non-empty URL
  const activeSocials = SOCIAL_LINKS.filter(
    (s) => settings[s.settingsKey] && settings[s.settingsKey].trim() !== ""
  );

  const copyrightName = settings.footer_copyright_name || storeName || "LUMAX";
  const copyrightText = `© ${new Date().getFullYear()} ${copyrightName}. Toate drepturile rezervate.`;

  const reviewsCount = settings.footer_reviews_count || "1000+";

  const phone = settings.footer_phone || settings.contact_phone || "";
  const email = settings.footer_email || settings.contact_email || "";
  const address = settings.footer_address || settings.contact_address || "";
  const schedule = settings.footer_schedule || settings.contact_schedule || "";

  const showPaymentIcons = settings.footer_show_payment_icons === "true";
  const paymentMethods = settings.footer_payment_methods || "Visa · Mastercard · Netopia";

  // Legal / company info
  const companyName = settings.footer_company_name || "";
  const cui = settings.footer_cui || "";
  const regCom = settings.footer_reg_com || "";
  const capitalSocial = settings.footer_capital_social || "";

  const showAnpc = settings.footer_anpc_show === "true";
  const anpcUrl = settings.footer_anpc_url || "https://anpc.gov.ro";
  const showSal = settings.footer_sal_show === "true";
  const salUrl = settings.footer_sal_url || "https://anpc.gov.ro/ce-facem/sal/";
  const showSol = settings.footer_sol_show === "true";
  const solUrl = settings.footer_sol_url || "https://ec.europa.eu/consumers/odr";

  const partners = [
    { key: "emag", show: settings.footer_partner_emag_show === "true", url: settings.footer_partner_emag_url, logo: settings.footer_partner_emag_logo, label: "eMAG Marketplace" },
    { key: "compari", show: settings.footer_partner_compari_show === "true", url: settings.footer_partner_compari_url, logo: settings.footer_partner_compari_logo, label: "Compari.ro" },
    { key: "price", show: settings.footer_partner_price_show === "true", url: settings.footer_partner_price_url, logo: settings.footer_partner_price_logo, label: "Price.ro" },
  ].filter(p => p.show);

  return (
    <footer>
      {/* Main footer */}
      <div className="py-10 md:py-12" style={{ background: settings.footer_upper_bg || "hsl(220 50% 12%)" }}>
        <div className="lumax-container grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            {!storeName && !settings.logo_url ? (
              <div style={{ width: "120px", height: "36px" }} className="mb-1" />
            ) : settings.logo_url && settings.logo_visible !== "false" ? (
              <img src={settings.logo_url} alt={storeName} style={{ height: "36px", objectFit: "contain" }} className="mb-1" />
            ) : (
              <h3 className="text-2xl font-black text-primary-foreground mb-1">{storeName}</h3>
            )}
            {tagline && <p className="text-sm text-primary-foreground/60 mb-3">{tagline}</p>}
            <div className="flex items-center gap-1 mb-4">
              <span className="text-lumax-yellow text-sm">★★★★★</span>
              <span className="text-xs text-primary-foreground/80">{reviewsCount} clienți mulțumiți</span>
            </div>
            {activeSocials.length > 0 && (
              <div className="flex gap-2">
                {activeSocials.map((s) => (
                  <a
                    key={s.settingsKey}
                    href={settings[s.settingsKey]}
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
              {phone && <p>📞 {phone}</p>}
              {email && <p>✉️ {email}</p>}
              {address && <p>📍 {address}</p>}
              {schedule && <p>⏰ {schedule}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Legal badges bar */}
      {(showAnpc || showSal || showSol || partners.length > 0) && (
        <div className="py-4 border-t border-primary-foreground/10" style={{ background: settings.footer_lower_bg || "hsl(220 50% 8%)" }}>
          <div className="lumax-container flex flex-wrap items-center justify-center gap-4">
            {showAnpc && (
              <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title="ANPC">
                {settings.footer_anpc_logo_url ? (
                  <img src={settings.footer_anpc_logo_url} alt="ANPC" className="h-7" />
                ) : (
                  <span className="text-xs text-primary-foreground/70 border border-primary-foreground/20 rounded px-2 py-1">ANPC</span>
                )}
              </a>
            )}
            {showSal && (
              <a href={salUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title="SAL – Soluționarea Alternativă a Litigiilor">
                <span className="text-xs text-primary-foreground/70 border border-primary-foreground/20 rounded px-2 py-1">SAL</span>
              </a>
            )}
            {showSol && (
              <a href={solUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title="SOL – Soluționare Online a Litigiilor">
                <img src="/images/eu-sol.png" alt="Soluționare Online a Litigiilor" className="h-7" />
              </a>
            )}
            {partners.map(p => (
              <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title={p.label}>
                {p.logo ? (
                  <img src={p.logo} alt={p.label} className="h-7" />
                ) : (
                  <span className="text-xs text-primary-foreground/70 border border-primary-foreground/20 rounded px-2 py-1">{p.label}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="py-3.5 border-t border-primary-foreground/5" style={{ background: settings.footer_lower_bg || "hsl(220 50% 8%)" }}>
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <span className="text-xs text-muted-foreground">{copyrightText}</span>
            {(companyName || cui || regCom) && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {[companyName, cui && `CUI: ${cui}`, regCom && `Reg. Com.: ${regCom}`, capitalSocial && `Capital social: ${capitalSocial}`].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {showPaymentIcons && (
            <span className="text-xs text-muted-foreground">{paymentMethods}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
