import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

/* ── Inline SVG icons ── */
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
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
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

/** Parse JSON array format (legacy) */
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

export default function Footer() {
  const { settings: s } = useSettings();

  if (s.footer_show === "false") return null;

  /* ── Colors ── */
  const bgColor = s.footer_bg_color || s.footer_upper_bg || "hsl(220 50% 12%)";
  const textColor = s.footer_text_color || undefined;
  const titleColor = s.footer_title_color || undefined;
  const linkColor = s.footer_link_color || undefined;
  const linkHoverColor = s.footer_link_hover_color || undefined;
  const borderColor = s.footer_border_color || undefined;
  const bottomBg = s.footer_bottom_bg_color || s.footer_lower_bg || "hsl(220 50% 8%)";

  /* ── Identity ── */
  const storeName = s.footer_store_name || s.site_name || "";
  const tagline = s.footer_tagline || s.site_tagline || "";
  const logoUrl = s.footer_logo_url || s.logo_url || "";

  /* ── Contact ── */
  const phone = s.footer_show_phone !== "false" ? (s.footer_phone || s.contact_phone || "") : "";
  const email = s.footer_show_email !== "false" ? (s.footer_email || s.contact_email || "") : "";
  const address = s.footer_show_address !== "false" ? (s.footer_address || s.contact_address || "") : "";
  const schedule = s.footer_show_schedule !== "false" ? (s.footer_schedule || s.contact_schedule || "") : "";

  /* ── Social ── */
  const activeSocials = SOCIAL_DEFS.filter((sc) => s[sc.key]?.trim());

  /* ── Columns ── */
  const showProductsCol = s.footer_show_products_col !== "false";
  const productsTitle = s.footer_products_title || "Produse";
  const productsLinks = parseLinks(s.footer_products_links || "");

  const showInfoCol = s.footer_show_info_col !== "false";
  const infoTitle = s.footer_info_title || s.footer_col1_title || "Informații";
  const infoLinks = parseLinks(s.footer_info_links || "") .length > 0
    ? parseLinks(s.footer_info_links || "")
    : parseJsonLinks(s.footer_col1_links || "[]");

  const showContactCol = s.footer_show_contact_col !== "false";
  const contactTitle = s.footer_contact_title || "Contact";

  /* ── Reviews ── */
  const showReviews = s.footer_show_reviews !== "false";
  const reviewsCount = s.footer_reviews_count || "1000+";
  const reviewsText = s.footer_reviews_text || "clienți mulțumiți";

  /* ── Legal ── */
  const showAnpc = s.footer_anpc_show === "true";
  const showSal = s.footer_sal_show === "true";
  const showSol = s.footer_sol_show === "true";

  const partners = [
    { key: "emag", show: s.footer_partner_emag_show === "true", url: s.footer_partner_emag_url, logo: s.footer_partner_emag_logo, label: "eMAG Marketplace" },
    { key: "compari", show: s.footer_partner_compari_show === "true", url: s.footer_partner_compari_url, logo: s.footer_partner_compari_logo, label: "Compari.ro" },
    { key: "price", show: s.footer_partner_price_show === "true", url: s.footer_partner_price_url, logo: s.footer_partner_price_logo, label: "Price.ro" },
  ].filter((p) => p.show);

  /* ── Payment ── */
  const showPayment = s.footer_show_payment_icons === "true";
  const paymentMethods = (s.footer_payment_methods || "Visa|Mastercard|Netopia").split("|").map((m) => m.trim()).filter(Boolean);

  /* ── Copyright ── */
  const copyrightName = s.footer_copyright_name || storeName || "LUMAX";
  const showMadeIn = s.footer_made_in_romania === "true";
  const madeText = s.footer_made_text || "Made with ❤️ în România";

  /* ── Company ── */
  const showLegal = s.footer_show_legal_data === "true";
  const companyName = s.footer_company_name || "";
  const cui = s.footer_cui || "";
  const regCom = s.footer_reg_com || "";
  const capitalSocial = s.footer_capital_social || "";

  /* ── Inline style helpers ── */
  const titleStyle: React.CSSProperties = titleColor ? { color: titleColor } : {};
  const textStyle: React.CSSProperties = textColor ? { color: textColor } : {};
  const linkStyle: React.CSSProperties = linkColor ? { color: linkColor } : {};

  const renderLinkCol = (title: string, links: { label: string; to: string }[]) => (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={titleColor ? { color: titleColor } : { color: "var(--footer-title, hsl(var(--primary-foreground)))" }}>
        {title}
      </h4>
      <ul className="space-y-1.5">
        {links.map((l, idx) => (
          <li key={idx}>
            <Link
              to={l.to}
              className="text-[13px] transition-colors"
              style={linkColor ? { color: linkColor } : { color: "hsl(var(--primary-foreground) / 0.6)" }}
              onMouseEnter={(e) => { if (linkHoverColor) (e.currentTarget as HTMLElement).style.color = linkHoverColor; }}
              onMouseLeave={(e) => { if (linkColor) (e.currentTarget as HTMLElement).style.color = linkColor; }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer>
      {/* ━━ Main ━━ */}
      <div className="py-10 md:py-12" style={{ background: bgColor }}>
        <div className="lumax-container grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            {logoUrl && s.logo_visible !== "false" ? (
              <img src={logoUrl} alt={storeName} style={{ height: "36px", objectFit: "contain" }} className="mb-1" />
            ) : storeName ? (
              <h3 className="text-2xl font-black mb-1" style={titleStyle}>{storeName}</h3>
            ) : (
              <div style={{ width: 120, height: 36 }} className="mb-1" />
            )}
            {tagline && <p className="text-sm mb-3" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.6)" }}>{tagline}</p>}

            {showReviews && (
              <div className="flex items-center gap-1 mb-4">
                <span className="text-lumax-yellow text-sm">★★★★★</span>
                <span className="text-xs" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.8)" }}>{reviewsCount} {reviewsText}</span>
              </div>
            )}

            {activeSocials.length > 0 && (
              <div className="flex gap-2">
                {activeSocials.map((sc) => (
                  <a
                    key={sc.key}
                    href={s[sc.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={sc.label}
                    className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary transition-colors"
                  >
                    {sc.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Products column */}
          {showProductsCol && productsLinks.length > 0 && renderLinkCol(productsTitle, productsLinks)}

          {/* Info column */}
          {showInfoCol && infoLinks.length > 0 && renderLinkCol(infoTitle, infoLinks)}

          {/* Contact column */}
          {showContactCol && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={titleColor ? { color: titleColor } : { color: "var(--footer-title, hsl(var(--primary-foreground)))" }}>
                {contactTitle}
              </h4>
              <div className="space-y-2 text-[13px]" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.6)" }}>
                {phone && <p>📞 {phone}</p>}
                {email && <p>✉️ {email}</p>}
                {address && <p>📍 {address}</p>}
                {schedule && <p>⏰ {schedule}</p>}
              </div>
            </div>
          )}

          {/* Payment column */}
          {showPayment && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4" style={titleColor ? { color: titleColor } : { color: "var(--footer-title, hsl(var(--primary-foreground)))" }}>
                Metode de plată
              </h4>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <span key={m} className="text-[11px] border rounded px-2 py-1" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.7)", borderColor: borderColor || "hsl(var(--primary-foreground) / 0.15)" }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ━━ Legal badges bar ━━ */}
      {(showAnpc || showSal || showSol || partners.length > 0) && (
        <div className="py-4" style={{ background: bgColor, borderTop: `1px solid ${borderColor || "hsl(var(--primary-foreground) / 0.1)"}` }}>
          <div className="lumax-container flex flex-wrap items-center justify-center gap-4">
            {showAnpc && (
              <a href={s.footer_anpc_url || "https://anpc.gov.ro"} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title={s.footer_anpc_text || "ANPC"}>
                {s.footer_anpc_logo_url ? (
                  <img src={s.footer_anpc_logo_url} alt="ANPC" className="h-7" />
                ) : (
                  <span className="text-xs border rounded px-2 py-1" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.7)", borderColor: borderColor || "hsl(var(--primary-foreground) / 0.2)" }}>ANPC</span>
                )}
              </a>
            )}
            {showSal && (
              <a href={s.footer_sal_url || "https://anpc.gov.ro/ce-facem/sal/"} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title={s.footer_sal_text || "SAL"}>
                <span className="text-xs border rounded px-2 py-1" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.7)", borderColor: borderColor || "hsl(var(--primary-foreground) / 0.2)" }}>SAL</span>
              </a>
            )}
            {showSol && (
              <a href={s.footer_sol_url || "https://ec.europa.eu/consumers/odr"} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title={s.footer_sol_text || "SOL"}>
                <img src="/images/eu-sol.png" alt="SOL" className="h-7" />
              </a>
            )}
            {partners.map((p) => (
              <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" title={p.label}>
                {p.logo ? <img src={p.logo} alt={p.label} className="h-7" /> : (
                  <span className="text-xs border rounded px-2 py-1" style={{ color: textColor || "hsl(var(--primary-foreground) / 0.7)", borderColor: borderColor || "hsl(var(--primary-foreground) / 0.2)" }}>{p.label}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ━━ Bottom bar ━━ */}
      <div className="py-3.5" style={{ background: bottomBg, borderTop: `1px solid ${borderColor || "hsl(var(--primary-foreground) / 0.05)"}` }}>
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {copyrightName}. Toate drepturile rezervate.
            </span>
            {showLegal && (companyName || cui || regCom) && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {[companyName, cui && `CUI: ${cui}`, regCom && `Reg. Com.: ${regCom}`, capitalSocial && `Capital social: ${capitalSocial}`].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {showMadeIn && (
            <span className="text-xs text-muted-foreground">{madeText}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
