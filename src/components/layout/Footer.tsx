import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

/* ── Inline SVG icons ── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

/* ── Payment SVG icons ── */
const VisaIcon = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#E2E8F0"/>
    <text x="24" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1A1F71">VISA</text>
  </svg>
);
const MastercardIcon = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#E2E8F0"/>
    <circle cx="19" cy="16" r="8" fill="#EB001B" opacity="0.8"/>
    <circle cx="29" cy="16" r="8" fill="#F79E1B" opacity="0.8"/>
  </svg>
);
const NetopiaIcon = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#E2E8F0"/>
    <text x="24" y="19" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#00A651">NETOPIA</text>
  </svg>
);
const RambursIcon = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#E2E8F0"/>
    <text x="24" y="15" textAnchor="middle" fontSize="7" fontWeight="600" fill="#475569">Plată la</text>
    <text x="24" y="23" textAnchor="middle" fontSize="7" fontWeight="600" fill="#475569">livrare</text>
  </svg>
);
const TBIIcon = () => (
  <svg viewBox="0 0 48 32" width="48" height="32" fill="none">
    <rect width="48" height="32" rx="4" fill="#fff" stroke="#E2E8F0"/>
    <text x="24" y="19" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0066FF">TBI</text>
  </svg>
);

const SOCIAL_DEFS = [
  { key: "footer_facebook_url", label: "Facebook", icon: <FacebookIcon /> },
  { key: "footer_instagram_url", label: "Instagram", icon: <InstagramIcon /> },
  { key: "footer_tiktok_url", label: "TikTok", icon: <TikTokIcon /> },
  { key: "footer_youtube_url", label: "YouTube", icon: <YouTubeIcon /> },
  { key: "footer_pinterest_url", label: "Pinterest", icon: <PinterestIcon /> },
];

/** Parse pipe-delimited link format: "Label:/path|Label2:/path2" */
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

function parseJsonLinks(raw: string): { label: string; to: string }[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((l: any) => ({ label: l.label, to: l.to || l.url }));
  } catch { /* ignore */ }
  return [];
}

function parseLinks(raw: string): { label: string; to: string }[] {
  if (!raw) return [];
  if (raw.startsWith("[")) return parseJsonLinks(raw);
  return parsePipeLinks(raw);
}

function isExternal(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function Footer() {
  const { settings: s } = useSettings();

  if (s.footer_show === "false") return null;

  /* ── Colors ── */
  const bgColor = s.footer_bg_color || "#F1F5F9";
  const textColor = s.footer_text_color || "#475569";
  const titleColor = s.footer_title_color || "#0F172A";
  const linkColor = s.footer_link_color || "#475569";
  const linkHoverColor = s.footer_link_hover_color || "#0066FF";
  const bottomBg = s.footer_bottom_bg_color || "#E2E8F0";
  const bottomTextColor = s.footer_bottom_text_color || "#64748B";
  const contactBtnColor = s.footer_contact_btn_color || "#0066FF";

  /* ── Column 1 – Magazin ── */
  const col1Show = s.footer_col1_show !== "false";
  const col1Title = s.footer_col1_title || "Magazin";
  const col1Links = parseLinks(s.footer_col1_links || "");

  /* ── Column 2 – Clienți ── */
  const col2Show = s.footer_col2_show !== "false";
  const col2Title = s.footer_col2_title || "Clienți";
  const col2Links = parseLinks(s.footer_col2_links || "");

  /* ── Column 3 – Date comerciale ── */
  const col3Show = s.footer_col3_show !== "false";
  const col3Title = s.footer_col3_title || "Date comerciale";
  const companyName = s.footer_company_name || "";
  const cui = s.footer_cui || "";
  const regCom = s.footer_reg_com || "";
  const capitalSocial = s.footer_capital_social || "";
  const addressStreet = s.footer_address_street || "";
  const addressCity = s.footer_address_city || "";

  /* ── Column 4 – Suport clienți ── */
  const col4Show = s.footer_col4_show !== "false";
  const col4Title = s.footer_col4_title || "Suport clienți";
  const col4SupportText = s.footer_col4_support_text || "";
  const phone = s.footer_show_phone !== "false" ? (s.footer_phone || "") : "";
  const email = s.footer_show_email !== "false" ? (s.footer_email || "") : "";
  const showContactBtn = s.footer_show_contact_btn === "true";
  const contactBtnText = s.footer_contact_btn_text || "Contactează-ne";
  const contactBtnUrl = s.footer_contact_btn_url || "/contact";

  /* ── Social ── */
  const showSocial = s.footer_social_show !== "false";
  const activeSocials = SOCIAL_DEFS.filter((sc) => s[sc.key]?.trim());

  /* ── ANPC / SAL ── */
  const showAnpc = s.footer_anpc_show === "true";
  const showSal = s.footer_sal_show === "true";

  /* ── Payment ── */
  const showPayment = s.footer_show_payment_icons === "true";
  const paymentItems = [
    { key: "netopia", show: s.footer_payment_netopia_show === "true", icon: <NetopiaIcon />, label: "Netopia" },
    { key: "visa", show: s.footer_payment_visa_show === "true", icon: <VisaIcon />, label: "Visa" },
    { key: "mastercard", show: s.footer_payment_mastercard_show === "true", icon: <MastercardIcon />, label: "Mastercard" },
    { key: "tbi", show: s.footer_payment_tbi_show === "true", icon: <TBIIcon />, label: "TBI" },
    { key: "ramburs", show: s.footer_payment_ramburs_show === "true", icon: <RambursIcon />, label: "Ramburs" },
  ].filter((p) => p.show);

  /* ── Copyright ── */
  const copyrightName = s.footer_copyright_name || s.footer_store_name || "Mama Lucica SRL";
  const showMadeIn = s.footer_made_in_romania_show === "true";
  const madeText = s.footer_made_in_romania_text || "Made with ❤️ în România";

  /* ── Partners ── */
  const partners = [
    { key: "emag", show: s.footer_partner_emag_show === "true", url: s.footer_partner_emag_url, logo: s.footer_partner_emag_logo, label: "eMAG Marketplace" },
    { key: "compari", show: s.footer_partner_compari_show === "true", url: s.footer_partner_compari_url, logo: s.footer_partner_compari_logo, label: "Compari.ro" },
    { key: "price", show: s.footer_partner_price_show === "true", url: s.footer_partner_price_url, logo: s.footer_partner_price_logo, label: "Price.ro" },
  ].filter((p) => p.show);

  const renderLink = (l: { label: string; to: string }, idx: number) => {
    const style: React.CSSProperties = { color: linkColor };
    const handlers = {
      onMouseEnter: (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = linkHoverColor; },
      onMouseLeave: (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = linkColor; },
    };
    if (isExternal(l.to)) {
      return (
        <li key={idx}>
          <a href={l.to} target="_blank" rel="noopener noreferrer" className="text-[13px] leading-relaxed transition-colors" style={style} {...handlers}>
            {l.label}
          </a>
        </li>
      );
    }
    return (
      <li key={idx}>
        <Link to={l.to} className="text-[13px] leading-relaxed transition-colors" style={style} {...handlers}>
          {l.label}
        </Link>
      </li>
    );
  };

  return (
    <footer>
      {/* ━━ Main 4-column grid ━━ */}
      <div className="py-10 md:py-12" style={{ background: bgColor }}>
        <div className="lumax-container grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">

          {/* Col 1 – Magazin */}
          {col1Show && col1Links.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: titleColor }}>
                {col1Title}
              </h4>
              <ul className="space-y-1">
                {col1Links.map(renderLink)}
              </ul>
            </div>
          )}

          {/* Col 2 – Clienți */}
          {col2Show && col2Links.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: titleColor }}>
                {col2Title}
              </h4>
              <ul className="space-y-1">
                {col2Links.map(renderLink)}
              </ul>
            </div>
          )}

          {/* Col 3 – Date comerciale */}
          {col3Show && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: titleColor }}>
                {col3Title}
              </h4>
              <div className="space-y-1 text-[13px] leading-relaxed" style={{ color: textColor }}>
                {companyName && <p className="font-medium">{companyName}</p>}
                {cui && <p>CUI: {cui}</p>}
                {regCom && <p>Reg. Com.: {regCom}</p>}
                {capitalSocial && <p>Capital social: {capitalSocial}</p>}
                {addressStreet && <p>{addressStreet}</p>}
                {addressCity && <p>{addressCity}</p>}
              </div>
            </div>
          )}

          {/* Col 4 – Suport clienți */}
          {col4Show && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: titleColor }}>
                {col4Title}
              </h4>
              <div className="space-y-2 text-[13px] leading-relaxed" style={{ color: textColor }}>
                {phone && (
                  <p>
                    📞{" "}
                    <a href={`tel:${phone}`} className="font-semibold transition-colors" style={{ color: titleColor }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = linkHoverColor; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = titleColor; }}
                    >
                      {phone}
                    </a>
                  </p>
                )}
                {email && (
                  <p>
                    ✉️{" "}
                    <a href={`mailto:${email}`} className="transition-colors" style={{ color: linkColor }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = linkHoverColor; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = linkColor; }}
                    >
                      {email}
                    </a>
                  </p>
                )}
                {col4SupportText && <p className="text-[12px] mt-1" style={{ color: textColor }}>{col4SupportText}</p>}
                {showContactBtn && (
                  <Link
                    to={contactBtnUrl}
                    className="inline-block mt-2 px-5 py-2 rounded-md text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: contactBtnColor }}
                  >
                    {contactBtnText}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ━━ Social media row ━━ */}
      {showSocial && activeSocials.length > 0 && (
        <div className="py-4" style={{ background: bgColor, borderTop: `1px solid ${bottomBg}` }}>
          <div className="lumax-container flex items-center justify-center gap-3">
            {activeSocials.map((sc) => (
              <a
                key={sc.key}
                href={s[sc.key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={sc.label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: bottomBg, color: textColor }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = linkHoverColor; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = bottomBg; (e.currentTarget as HTMLElement).style.color = textColor; }}
              >
                {sc.icon}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ━━ ANPC / SAL / Partners badges ━━ */}
      {(showAnpc || showSal || partners.length > 0) && (
        <div className="py-4" style={{ background: bgColor, borderTop: `1px solid ${bottomBg}` }}>
          <div className="lumax-container flex flex-wrap items-center justify-center gap-6">
            {showAnpc && (
              <a href={s.footer_anpc_url || "https://anpc.ro/ce-este-sal/"} target="_blank" rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity" title={s.footer_anpc_alt || "ANPC SAL"}>
                {s.footer_anpc_logo_url ? (
                  <img src={s.footer_anpc_logo_url} alt={s.footer_anpc_alt || "ANPC SAL"} className="h-10" />
                ) : (
                  <span className="text-xs border rounded px-3 py-1.5" style={{ color: textColor, borderColor: bottomBg }}>ANPC</span>
                )}
              </a>
            )}
            {showSal && (
              <a href={s.footer_sal_url || "https://ec.europa.eu/consumers/odr"} target="_blank" rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity" title={s.footer_sal_alt || "SOL"}>
                {s.footer_sal_logo_url ? (
                  <img src={s.footer_sal_logo_url} alt={s.footer_sal_alt || "SOL"} className="h-10" />
                ) : (
                  <span className="text-xs border rounded px-3 py-1.5" style={{ color: textColor, borderColor: bottomBg }}>SOL</span>
                )}
              </a>
            )}
            {partners.map((p) => (
              <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity" title={p.label}>
                {p.logo ? <img src={p.logo} alt={p.label} className="h-8" /> : (
                  <span className="text-xs border rounded px-3 py-1.5" style={{ color: textColor, borderColor: bottomBg }}>{p.label}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ━━ Payment icons row ━━ */}
      {showPayment && paymentItems.length > 0 && (
        <div className="py-4" style={{ background: bgColor, borderTop: `1px solid ${bottomBg}` }}>
          <div className="lumax-container flex flex-wrap items-center justify-center gap-3">
            {paymentItems.map((p) => (
              <div key={p.key} title={p.label}>
                {p.icon}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━ Bottom copyright bar ━━ */}
      <div className="py-3.5" style={{ background: bottomBg }}>
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs" style={{ color: bottomTextColor }}>
            © {new Date().getFullYear()} {copyrightName}. Toate drepturile rezervate.
          </span>
          {showMadeIn && (
            <span className="text-xs" style={{ color: bottomTextColor }}>{madeText}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
