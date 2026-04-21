import { Link } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";
import BackToTop from "./footer/BackToTop";

const unq = (s?: string) => (s || "").replace(/^"|"$/g, "");

export default function Footer() {
  const { settings: s } = useSettings();
  if (s.footer_show === "false") return null;

  const year = s.footer_copyright_year_auto === "false"
    ? "" : new Date().getFullYear();

  /* ── CULORI ── */
  const mainBg = unq(s.footer_bg_color) || "#1f1f1f";
  const titleColor = unq(s.footer_title_color) || "#ffffff";
  const textColor = unq(s.footer_text_color) || "#d4d4d4";
  const linkColor = unq(s.footer_link_color) || "#9ca3af";
  const linkHover = unq(s.footer_link_hover_color) || "#ffffff";
  const bottomBg = unq(s.footer_bottom_bg_color) || "#181818";
  const bottomText = unq(s.footer_bottom_text_color) || "#6b7280";
  const primaryColor = unq(s.primary_color) || "#2563eb";

  /* ── IDENTITATE BRAND ── */
  const brandDesc = unq(s.footer_brand_description);

  /* ── BARA DE ÎNCREDERE ── */
  const showTrust = s.footer_trust_show !== "false";
  const trustItems = [1, 2, 3, 4].map(i => ({
    show: s[`footer_trust_${i}_show`] !== "false",
    icon: unq(s[`footer_trust_${i}_icon`]) || (i === 1 ? "truck" : i === 2 ? "shield" : i === 3 ? "credit" : "mail"),
    title: unq(s[`footer_trust_${i}_title`]) || "",
    subtitle: unq(s[`footer_trust_${i}_subtitle`]) || "",
  })).filter(t => t.show && t.title);

  /* ── PAȘI (pre-footer) ── */
  const showSteps = s.footer_show_steps !== "false";
  const steps = [
    unq(s.footer_step1_text) || "Alege produsele",
    unq(s.footer_step2_text) || "Finalizează comanda",
    unq(s.footer_step3_text) || "Primești acasă în 24-48h",
  ];

  /* ── COLOANA 1 — Magazin ── */
  const showCol1 = s.footer_col1_show !== "false";
  const col1Title = unq(s.footer_col1_title) || "Informații";
  const col1LinksFallback = [
    { label: "Cum cumpăr", url: "/page/cum-cumpar" },
    { label: "Politica de livrare", url: "/page/livrare" },
    { label: "Politica de returnare", url: "/page/politica-retur" },
    { label: "Termeni și condiții", url: "/page/termeni-conditii" },
    { label: "GDPR", url: "/page/gdpr" },
  ];
  const col1Links = parsePipeLinks(s.footer_col1_links, col1LinksFallback);

  /* ── COLOANA 2 — Clienți ── */
  const showCol2 = s.footer_col2_show !== "false";
  const col2Title = unq(s.footer_col2_title) || "Contul meu";
  const col2LinksFallback = [
    { label: "Datele mele", url: "/account" },
    { label: "Comenzi", url: "/account/orders" },
    { label: "Favorite", url: "/account/favorites" },
    { label: "Adresele mele", url: "/account/addresses" },
  ];
  const col2Links = parsePipeLinks(s.footer_col2_links, col2LinksFallback);

  /* ── COLOANA 3 — Date comerciale ── */
  const showCol3 = s.footer_col3_show !== "false";
  const col3Title = unq(s.footer_col3_title) || "Magazinul nostru";
  const showLegal = s.footer_show_legal_data !== "false";
  const companyName = unq(s.footer_company_name) || "SC VOMIX GENIUS SRL";
  const cui = unq(s.footer_cui) || "43025661";
  const regCom = unq(s.footer_reg_com) || "";
  const capital = unq(s.footer_capital_social) || "";
  const street = unq(s.footer_address_street) || "";
  const city = unq(s.footer_address_city) || "";

  /* ── COLOANA 4 — Suport ── */
  const showCol4 = s.footer_col4_show !== "false";
  const col4Title = unq(s.footer_col4_title) || "Suport clienți";
  const phone = unq(s.footer_phone) || "+40753326405";
  const email = unq(s.footer_email) || "contact@mamalucica.ro";
  const schedule = unq(s.footer_schedule) || unq(s.footer_col4_support_text) || "Luni-Vineri 09:00-17:00";
  const showPhone = s.footer_show_phone !== "false";
  const showEmail = s.footer_show_email !== "false";
  const showSchedule = s.footer_show_schedule !== "false";
  const showContactBtn = s.footer_show_contact_btn === "true";
  const contactBtnText = unq(s.footer_contact_btn_text) || "Contactează-ne";
  const contactBtnUrl = unq(s.footer_contact_btn_url) || "/contact";
  const contactBtnColor = unq(s.footer_contact_btn_color) || primaryColor;

  /* ── SOCIAL MEDIA ── */
  const showSocial = s.footer_social_show !== "false";
  const fbUrl = unq(s.footer_facebook_url);
  const igUrl = unq(s.footer_instagram_url);
  const ttUrl = unq(s.footer_tiktok_url);
  const ytUrl = unq(s.footer_youtube_url);

  /* ── ANPC / SAL ── */
  const showAnpc = s.footer_anpc_show !== "false";
  const anpcUrl = unq(s.footer_anpc_url) || "https://anpc.ro/ce-este-sal/";
  const anpcLogo = unq(s.footer_anpc_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg";
  const showSal = s.footer_sal_show !== "false";
  const salUrl = unq(s.footer_sal_url) || "https://consumer-redress.ec.europa.eu";
  const salLogo = unq(s.footer_sal_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg";

  /* ── PARTENERI MARKETPLACE ── */
  const showEmag = s.footer_partner_emag_show === "true";
  const emagUrl = unq(s.footer_partner_emag_url);
  const emagLogo = unq(s.footer_partner_emag_logo);
  const showCompari = s.footer_partner_compari_show === "true";
  const compariUrl = unq(s.footer_partner_compari_url);
  const compariLogo = unq(s.footer_partner_compari_logo);
  const showPrice = s.footer_partner_price_show === "true";
  const priceUrl = unq(s.footer_partner_price_url);
  const priceLogo = unq(s.footer_partner_price_logo);

  /* ── METODE DE PLATĂ ── */
  const showPayment = s.footer_show_payment_icons !== "false";
  const showNetopia = s.footer_payment_netopia_show !== "false";
  const showVisa = s.footer_payment_visa_show !== "false";
  const showMastercard = s.footer_payment_mastercard_show !== "false";
  const showRamburs = s.footer_payment_ramburs_show !== "false";
  const showTbi = s.footer_payment_tbi_show === "true";

  /* ── CURIERI ── */
  const deliveryBadges = (unq(s.footer_delivery_badges) || "Fan Courier,DPD,Sameday,Cargus")
    .split(",").map(b => b.trim()).filter(Boolean);

  /* ── COPYRIGHT ── */
  const copyrightName = unq(s.footer_copyright_name) || "Mama Lucica";
  const showMadeIn = s.footer_made_in_romania_show !== "false";
  const madeInText = unq(s.footer_made_in_romania_text) || "Made with ❤️ în România";

  /* ── ICON MAP pentru Trust Bar ── */
  const iconMap: Record<string, string> = {
    truck: "🚚", shield: "🛡️", credit: "💳",
    mail: "✉️", phone: "📞", clock: "🕐",
  };

  const isExternal = (url: string) => url.startsWith("http");

  return (
    <>
      <footer className="mt-0">

        {/* TRUST BAR — bara de încredere */}
        {showTrust && trustItems.length > 0 && (
          <div style={{ background: primaryColor }} className="text-white">
            <div className="ml-container py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {trustItems.map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{iconMap[t.icon] || "✅"}</span>
                  <div>
                    <p className="text-sm font-bold">{t.title}</p>
                    <p className="text-xs opacity-80">{t.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRE-FOOTER — 3 pași */}
        {showSteps && (
          <div className="bg-white border-t border-gray-200">
            <div className="ml-container py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              {steps.map((text, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: primaryColor }}
                  >
                    {i + 1}
                  </div>
                  <p className="font-semibold text-sm text-gray-800">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER PRINCIPAL */}
        <div style={{ background: mainBg, color: textColor }}>
          <div className="ml-container py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* COL 1 — Magazin */}
            {showCol1 && (
              <div>
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: titleColor }}>{col1Title}</h4>
                <ul className="space-y-2 text-sm">
                  {col1Links.map((l, i) => (
                    <li key={i}>
                      {isExternal(l.url) ? (
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: linkColor }}
                          onMouseEnter={e => (e.target as HTMLElement).style.color = linkHover}
                          onMouseLeave={e => (e.target as HTMLElement).style.color = linkColor}
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          to={l.url}
                          style={{ color: linkColor }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = linkHover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = linkColor}
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* COL 2 — Clienți */}
            {showCol2 && (
              <div>
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: titleColor }}>{col2Title}</h4>
                <ul className="space-y-2 text-sm">
                  {col2Links.map((l, i) => (
                    <li key={i}>
                      <Link
                        to={l.url}
                        style={{ color: linkColor }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = linkHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = linkColor}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* COL 3 — Date comerciale */}
            {showCol3 && (
              <div>
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: titleColor }}>{col3Title}</h4>
                {showLegal ? (
                  <div className="space-y-1 text-sm" style={{ color: textColor }}>
                    <p className="font-semibold">{companyName}</p>
                    {cui && <p>CUI: {cui}</p>}
                    {regCom && <p>Reg. Com.: {regCom}</p>}
                    {capital && <p>Capital social: {capital}</p>}
                    {street && <p>{street}</p>}
                    {city && <p>{city}</p>}
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {[
                      { label: "Despre noi", url: "/page/despre-noi" },
                      { label: "Blog", url: "/blog" },
                      { label: "Contact", url: "/contact" },
                      { label: "ANPC", url: "/page/anpc" },
                    ].map((l, i) => (
                      <li key={i}>
                        <Link
                          to={l.url}
                          style={{ color: linkColor }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = linkHover}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = linkColor}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Social Media */}
                {showSocial && (fbUrl || igUrl || ttUrl || ytUrl) && (
                  <div className="flex gap-3 mt-4 text-xl">
                    {fbUrl && <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">📘</a>}
                    {igUrl && <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">📷</a>}
                    {ttUrl && <a href={ttUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">🎵</a>}
                    {ytUrl && <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">▶️</a>}
                  </div>
                )}
              </div>
            )}

            {/* COL 4 — Suport clienți */}
            {showCol4 && (
              <div>
                <h4 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: titleColor }}>{col4Title}</h4>
                <ul className="space-y-3 text-sm">
                  {showPhone && (
                    <li className="flex items-center gap-2">
                      <span>📞</span>
                      <a href={`tel:${phone.replace(/\s/g, "")}`} style={{ color: linkColor }} className="hover:opacity-80 font-medium">
                        {phone}
                      </a>
                    </li>
                  )}
                  {showEmail && (
                    <li className="flex items-center gap-2">
                      <span>✉️</span>
                      <a href={`mailto:${email}`} style={{ color: linkColor }} className="hover:opacity-80 break-all">
                        {email}
                      </a>
                    </li>
                  )}
                  {showSchedule && (
                    <li className="flex items-center gap-2 mt-1">
                      <span>🕐</span>
                      <span style={{ color: textColor, opacity: 0.8 }}>{schedule}</span>
                    </li>
                  )}
                </ul>
                {showContactBtn && (
                  <a
                    href={contactBtnUrl}
                    className="inline-block mt-4 px-5 py-2 rounded text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: contactBtnColor }}
                  >
                    {contactBtnText}
                  </a>
                )}
                {brandDesc && (
                  <p className="mt-4 text-xs leading-relaxed" style={{ color: textColor, opacity: 0.7 }}>{brandDesc}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CURIERI + PLĂȚI + ANPC */}
        <div style={{ background: mainBg }} className="border-t border-gray-800">
          <div className="ml-container py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: bottomText }}>Livrare:</span>
              {deliveryBadges.map(b => (
                <span key={b} className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">{b}</span>
              ))}
            </div>
            {showPayment && (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: bottomText }}>Plată securizată:</span>
                {showVisa && <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">VISA</span>}
                {showMastercard && <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">Mastercard</span>}
                {showNetopia && <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">Netopia</span>}
                {showRamburs && <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">Ramburs</span>}
                {showTbi && <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">TBI Bank</span>}
              </div>
            )}
          </div>

          {/* ANPC + SAL + Parteneri */}
          <div className="ml-container pb-4 flex items-center justify-center gap-3 flex-wrap">
            {showAnpc && (
              <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                <img src={anpcLogo} alt="ANPC SAL" className="h-8" loading="lazy" />
              </a>
            )}
            {showSal && (
              <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                <img src={salLogo} alt="ANPC SOL" className="h-8" loading="lazy" />
              </a>
            )}
            {showEmag && emagUrl && (
              <a href={emagUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                {emagLogo
                  ? <img src={emagLogo} alt="eMAG" className="h-6 object-contain" loading="lazy" />
                  : <span className="text-xs font-bold text-gray-800 px-1">eMAG</span>
                }
              </a>
            )}
            {showCompari && compariUrl && (
              <a href={compariUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                {compariLogo
                  ? <img src={compariLogo} alt="Compari.ro" className="h-6 object-contain" loading="lazy" />
                  : <span className="text-xs font-bold text-gray-800 px-1">Compari.ro</span>
                }
              </a>
            )}
            {showPrice && priceUrl && (
              <a href={priceUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                {priceLogo
                  ? <img src={priceLogo} alt="Price.ro" className="h-6 object-contain" loading="lazy" />
                  : <span className="text-xs font-bold text-gray-800 px-1">Price.ro</span>
                }
              </a>
            )}
          </div>
        </div>

        {/* COPYRIGHT */}
        <div style={{ background: bottomBg }}>
          <div className="ml-container py-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-[11px]" style={{ color: bottomText }}>
              © {year} {copyrightName} · {companyName} · CUI: {cui} · Toate drepturile rezervate.
            </p>
            {showMadeIn && (
              <p className="text-[11px]" style={{ color: bottomText }}>
                {madeInText}
              </p>
            )}
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}

/* ── Helper: parse pipe-separated links "Label:/url|Label2:/url2" ── */
function parsePipeLinks(raw: string | undefined, fallback: { label: string; url: string }[]) {
  const val = unq(raw);
  if (!val) return fallback;
  const parsed = val.split("|").map(entry => {
    const [label, ...urlParts] = entry.split(":");
    const url = urlParts.join(":");
    return { label: label.trim(), url: url.trim() };
  }).filter(l => l.label && l.url);
  return parsed.length > 0 ? parsed : fallback;
}
