import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock, CreditCard, Truck, Shield } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface LinkItem { label: string; url: string }

/** Parse "Label:url|Label2:url2" pipe format used by AdminFooterSettings */
function parseLinks(raw: string): LinkItem[] {
  if (!raw) return [];
  // Try JSON array first (newer format)
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((p: any) => p?.label && p?.url);
    }
  } catch {}
  // Fallback to pipe format
  return raw.split("|").map(entry => {
    const idx = entry.indexOf(":");
    if (idx <= 0) return null;
    return { label: entry.slice(0, idx).trim(), url: entry.slice(idx + 1).trim() };
  }).filter(Boolean) as LinkItem[];
}

const unq = (s?: string) => (s || "").replace(/^"|"$/g, "");
const truthy = (v?: string) => v !== "false" && v !== '"false"' && v !== undefined;

export default function Footer() {
  const { settings: s } = useSettings();

  if (s.footer_show === "false") return null;

  const year = new Date().getFullYear();

  const col1Show = truthy(s.footer_col1_show);
  const col2Show = truthy(s.footer_col2_show);
  const col3Show = truthy(s.footer_col3_show);
  const col4Show = truthy(s.footer_col4_show);

  const col1Links = parseLinks(s.footer_col1_links || "");
  const col2Links = parseLinks(s.footer_col2_links || "");

  const company = unq(s.footer_company_name) || "SC VOMIX GENIUS SRL";
  const cui = unq(s.footer_cui) || "43025661";
  const regCom = unq(s.footer_reg_com) || "J2020000459343";
  const capital = unq(s.footer_capital_social) || "200 RON";
  const address = unq(s.footer_address) || [unq(s.footer_address_street), unq(s.footer_address_city)].filter(Boolean).join(", ") || "Str. Constructorilor 39, Voievoda, Teleorman";
  const email = unq(s.footer_email) || "contact@mamalucica.ro";
  const phone = unq(s.footer_phone) || "+40 743 326 405";
  const schedule = unq(s.footer_col4_support_text) || unq(s.contact_schedule) || "Luni - Vineri, 9:00 - 17:00";

  const socialShow = truthy(s.footer_social_show);
  const facebook = unq(s.footer_facebook_url);
  const instagram = unq(s.footer_instagram_url);
  const tiktok = unq(s.footer_tiktok_url);
  const youtube = unq(s.footer_youtube_url);

  const anpcShow = truthy(s.footer_anpc_show);
  const anpcUrl = unq(s.footer_anpc_url) || "https://anpc.ro/ce-este-sal/";
  const anpcLogo = unq(s.footer_anpc_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg";
  const salShow = truthy(s.footer_sal_show);
  const salUrl = unq(s.footer_sal_url) || "https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO";
  const salLogo = unq(s.footer_sal_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg";

  const showPaymentIcons = truthy(s.footer_show_payment_icons);
  const copyrightName = unq(s.footer_copyright_name) || "Mama Lucica";
  const madeInShow = truthy(s.footer_made_in_romania_show);
  const madeInText = unq(s.footer_made_in_romania_text) || "Made with ❤ în România";

  const partners: { show: boolean; url: string; logo: string; name: string }[] = [
    { name: "eMAG", show: truthy(s.footer_partner_emag_show), url: unq(s.footer_partner_emag_url), logo: unq(s.footer_partner_emag_logo) },
    { name: "Compari.ro", show: truthy(s.footer_partner_compari_show), url: unq(s.footer_partner_compari_url), logo: unq(s.footer_partner_compari_logo) },
    { name: "Price.ro", show: truthy(s.footer_partner_price_show), url: unq(s.footer_partner_price_url), logo: unq(s.footer_partner_price_logo) },
  ].filter(p => p.show && (p.url || p.logo));

  // Dynamic colors with sensible fallbacks
  const footerStyle: React.CSSProperties = {
    backgroundColor: unq(s.footer_bg_color) || undefined,
    color: unq(s.footer_text_color) || undefined,
  };
  const titleStyle: React.CSSProperties = {
    color: unq(s.footer_title_color) || undefined,
  };
  const bottomStyle: React.CSSProperties = {
    backgroundColor: unq(s.footer_bottom_bg_color) || undefined,
    color: unq(s.footer_bottom_text_color) || undefined,
  };

  // Trust strip dynamic items (icon by name)
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    truck: Truck, shield: Shield, credit: CreditCard, mail: Mail, phone: Phone, clock: Clock,
  };
  const trustItems = [1, 2, 3, 4]
    .filter(n => truthy(s[`footer_trust_${n}_show`]))
    .map(n => ({
      Icon: iconMap[unq(s[`footer_trust_${n}_icon`]) || "truck"] || Truck,
      title: unq(s[`footer_trust_${n}_title`]),
      subtitle: unq(s[`footer_trust_${n}_subtitle`]),
    }));
  const trustShow = s.footer_trust_show !== "false";
  const defaultTrust = [
    { Icon: Truck, title: "Livrare 24-48h", subtitle: "În toată România" },
    { Icon: Shield, title: "Plată sigură", subtitle: "Netopia · Mokka · Ramburs" },
    { Icon: CreditCard, title: "Retur 30 zile", subtitle: "Fără întrebări" },
    { Icon: Mail, title: "Suport rapid", subtitle: "L-V 9-17" },
  ];
  const finalTrust = trustItems.length > 0 ? trustItems : defaultTrust;

  const brandDescription = unq(s.footer_brand_description) ||
    "Lumânări 100% handmade din ceară de soia, turnate manual cu suflet în România.";

  return (
    <footer className="mt-20 bg-noir-gradient text-primary-foreground/90" style={footerStyle}>
      {/* Trust strip */}
      {trustShow && (
        <div className="border-b border-white/10">
          <div className="ml-container py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {finalTrust.map((f, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <f.Icon className="h-6 w-6 text-accent" />
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-[11px] opacity-60">{f.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main columns */}
      <div className="ml-container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🕯️</span>
            <span className="font-display text-xl font-medium" style={titleStyle}>{copyrightName}</span>
          </div>
          <p className="text-sm opacity-70 leading-relaxed mb-4">
            {brandDescription}
          </p>
          {socialShow && (
            <div className="flex items-center gap-3">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-on-dark/10 rounded-sm transition-colors" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-on-dark/10 rounded-sm transition-colors" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {tiktok && (
                <a href={tiktok} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-on-dark/10 rounded-sm transition-colors" aria-label="TikTok">
                  <span className="text-xs font-bold">TT</span>
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-on-dark/10 rounded-sm transition-colors" aria-label="YouTube">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Coloana 1 — Magazin (dynamic) */}
        {col1Show && (
          <div>
            <h4 className="font-display text-base mb-4 text-accent" style={titleStyle}>
              {unq(s.footer_col1_title) || "Magazin"}
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {col1Links.length > 0 ? col1Links.map((l, i) => (
                <li key={i}>
                  {l.url.startsWith("http") ? (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{l.label}</a>
                  ) : (
                    <Link to={l.url} className="hover:text-accent transition-colors">{l.label}</Link>
                  )}
                </li>
              )) : (
                <>
                  <li><Link to="/page/despre-noi" className="hover:text-accent transition-colors">Despre noi</Link></li>
                  <li><Link to="/page/termeni-conditii" className="hover:text-accent transition-colors">Termeni și condiții</Link></li>
                  <li><Link to="/page/politica-de-confidentialitate" className="hover:text-accent transition-colors">Politica de confidențialitate</Link></li>
                  <li><Link to="/page/politica-cookie" className="hover:text-accent transition-colors">Politica cookies</Link></li>
                  <li><Link to="/page/politica-retur" className="hover:text-accent transition-colors">Politica de retur</Link></li>
                  <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Coloana 2 — Clienți (dynamic) */}
        {col2Show && (
          <div>
            <h4 className="font-display text-base mb-4 text-accent" style={titleStyle}>
              {unq(s.footer_col2_title) || "Clienți"}
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              {col2Links.length > 0 ? col2Links.map((l, i) => (
                <li key={i}>
                  {l.url.startsWith("http") ? (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">{l.label}</a>
                  ) : (
                    <Link to={l.url} className="hover:text-accent transition-colors">{l.label}</Link>
                  )}
                </li>
              )) : (
                <>
                  <li><Link to="/page/livrare" className="hover:text-accent transition-colors">Transport și livrare</Link></li>
                  <li><Link to="/page/metode-plata" className="hover:text-accent transition-colors">Metode de plată</Link></li>
                  <li><Link to="/page/garantie" className="hover:text-accent transition-colors">Garanția produselor</Link></li>
                  <li><Link to="/page/faq" className="hover:text-accent transition-colors">Întrebări frecvente</Link></li>
                  <li><Link to="/track" className="hover:text-accent transition-colors">Urmărire comandă</Link></li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Coloana 3 — Date comerciale */}
        {col3Show && (
          <div>
            <h4 className="font-display text-base mb-4 text-accent" style={titleStyle}>
              {unq(s.footer_col3_title) || "Date comerciale"}
            </h4>
            <ul className="space-y-1.5 text-xs opacity-75 leading-relaxed">
              <li className="font-semibold opacity-100">{company}</li>
              {truthy(s.footer_show_legal_data) && (
                <>
                  <li>CUI: {cui}</li>
                  <li>Reg. Com.: {regCom}</li>
                  <li>Capital social: {capital}</li>
                </>
              )}
              {truthy(s.footer_show_address) && <li className="pt-2"><MapPin className="h-3 w-3 inline mr-1" /> {address}</li>}
            </ul>
          </div>
        )}

        {/* Coloana 4 — Suport / contact */}
        {col4Show && (
          <div>
            <h4 className="font-display text-base mb-4 text-accent" style={titleStyle}>
              {unq(s.footer_col4_title) || "Suport"}
            </h4>
            <ul className="space-y-1.5 text-xs opacity-75 leading-relaxed">
              {truthy(s.footer_show_phone) && <li><Phone className="h-3 w-3 inline mr-1" /> <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-accent">{phone}</a></li>}
              {truthy(s.footer_show_email) && <li><Mail className="h-3 w-3 inline mr-1" /> <a href={`mailto:${email}`} className="hover:text-accent">{email}</a></li>}
              <li><Clock className="h-3 w-3 inline mr-1" /> {schedule}</li>
              {truthy(s.footer_show_contact_btn) && unq(s.footer_contact_btn_url) && (
                <li className="pt-3">
                  <Link
                    to={unq(s.footer_contact_btn_url)}
                    className="inline-block px-4 py-2 rounded text-xs font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: unq(s.footer_contact_btn_color) || "hsl(var(--accent))", color: "white" }}
                  >
                    {unq(s.footer_contact_btn_text) || "Contactează-ne"}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ANPC SAL/SOL bar + parteneri */}
      {(anpcShow || salShow || partners.length > 0) && (
        <div className="border-t border-on-dark/10">
          <div className="ml-container py-5 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {anpcShow && (
              <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                <img src={anpcLogo} alt="ANPC SAL" className="h-12" />
              </a>
            )}
            {salShow && (
              <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                <img src={salLogo} alt="ANPC SOL" className="h-12" />
              </a>
            )}

            {partners.length > 0 && (anpcShow || salShow) && <div className="hidden md:block w-px h-10 bg-on-dark/10" />}

            {partners.map(p => (
              <a key={p.name} href={p.url || "#"} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                {p.logo ? (
                  <img src={p.logo} alt={p.name} className="h-8 object-contain" />
                ) : (
                  <span className="text-xs font-medium opacity-70">{p.name}</span>
                )}
              </a>
            ))}

            {showPaymentIcons && (
              <>
                <div className="hidden md:block w-px h-10 bg-on-dark/10" />
                <div className="flex items-center gap-3 text-xs opacity-60">
                  <span>Plătește sigur cu</span>
                  {truthy(s.footer_payment_visa_show) && <span className="font-bold tracking-wider">VISA</span>}
                  {truthy(s.footer_payment_mastercard_show) && <span className="font-bold tracking-wider">MASTERCARD</span>}
                  {truthy(s.footer_payment_netopia_show) && <span className="hidden md:inline">· Netopia</span>}
                  {truthy(s.footer_payment_tbi_show) && <span className="hidden md:inline">· TBI</span>}
                  {truthy(s.footer_payment_ramburs_show) && <span className="hidden md:inline">· Ramburs</span>}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-on-dark/10 bg-scrim/30" style={bottomStyle}>
        <div className="ml-container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs opacity-60">
          <p>© {year} {copyrightName}. Toate drepturile rezervate.</p>
          {madeInShow && <p>{madeInText}</p>}
        </div>
      </div>
    </footer>
  );
}
