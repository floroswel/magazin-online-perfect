import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";
import type { ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";
import FooterNewsletter from "./footer/FooterNewsletter";
import FooterPaymentIcons from "./footer/FooterPaymentIcons";
import FooterColumn from "./footer/FooterColumn";
import BackToTop from "./footer/BackToTop";

interface LinkItem { label: string; url: string }

function parseLinks(raw: string): LinkItem[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.filter((x: any) => x?.label && x?.url); } catch {}
  return raw.split("|").map(e => {
    const i = e.indexOf(":"); if (i <= 0) return null;
    return { label: e.slice(0, i).trim(), url: e.slice(i + 1).trim() };
  }).filter(Boolean) as LinkItem[];
}
const unq = (s?: string) => (s || "").replace(/^"|"$/g, "");
const truthy = (v?: string) => v !== "false" && v !== '"false"' && v !== undefined;

const renderLinks = (items: LinkItem[], fallback: ReactNode) =>
  items.length > 0 ? items.map((l, i) => (
    <li key={i}>
      {l.url.startsWith("http")
        ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="footer-link">{l.label}</a>
        : <Link to={l.url} className="footer-link">{l.label}</Link>}
    </li>
  )) : fallback;

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
  const address = unq(s.footer_address) || "Str. Constructorilor 39, Voievoda, Teleorman";
  const email = unq(s.footer_email) || "contact@mamalucica.ro";
  const phone = unq(s.footer_phone) || "+40 743 326 405";
  const schedule = unq(s.footer_col4_support_text) || "Luni - Vineri, 9:00 - 17:00";

  const socialShow = truthy(s.footer_social_show);
  const facebook = unq(s.footer_facebook_url);
  const instagram = unq(s.footer_instagram_url);
  const youtube = unq(s.footer_youtube_url);
  const tiktok = unq(s.footer_tiktok_url);

  const anpcShow = truthy(s.footer_anpc_show);
  const anpcUrl = unq(s.footer_anpc_url) || "https://anpc.ro/ce-este-sal/";
  const anpcLogo = unq(s.footer_anpc_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg";
  const salShow = truthy(s.footer_sal_show);
  const salUrl = unq(s.footer_sal_url) || "https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO";
  const salLogo = unq(s.footer_sal_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg";

  const copyrightName = unq(s.footer_copyright_name) || "Mama Lucica";
  const showLegalData = truthy(s.footer_show_legal_data);
  const showPaymentIcons = truthy(s.footer_show_payment_icons);
  const madeInShow = truthy(s.footer_made_in_romania_show);
  const madeInText = unq(s.footer_made_in_romania_text) || "Made with ♥ în România";

  return (
    <>
      <footer className="footer-dark mt-20">
        {/* === BAND NEWSLETTER (ca bitmi: bandă orizontală sus, accent color) === */}
        <div style={{ background: "hsl(var(--footer-accent))" }} className="text-black">
          <div className="ml-container py-6 lg:py-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-5">
            <div>
              <h3 className="text-lg lg:text-xl font-bold leading-tight">Abonează-te la newsletter</h3>
              <p className="text-sm opacity-80 mt-1">
                Primești 10% reducere la prima comandă și acces anticipat la lansări.
              </p>
            </div>
            <div className="w-full lg:w-[420px]">
              <FooterNewsletter />
            </div>
          </div>
        </div>

        {/* === MAIN: 4 coloane (Magazin / Clienți / Date comerciale / Suport) === */}
        <div className="ml-container py-10 lg:py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-2 md:gap-y-8">

          {/* Col 1: Magazin / Despre */}
          {col1Show && (
            <FooterColumn title={unq(s.footer_col1_title) || "Magazin"}>
              <ul className="space-y-2">
                {renderLinks(col1Links, (
                  <>
                    <li><Link to="/page/despre-noi" className="footer-link">Despre noi</Link></li>
                    <li><Link to="/blog" className="footer-link">Blog</Link></li>
                    <li><Link to="/page/cariere" className="footer-link">Cariere</Link></li>
                    <li><Link to="/contact" className="footer-link">Contact</Link></li>
                    <li><a href="/sitemap.xml" className="footer-link">Sitemap</a></li>
                  </>
                ))}
              </ul>
            </FooterColumn>
          )}

          {/* Col 2: Clienți / Suport */}
          {col2Show && (
            <FooterColumn title={unq(s.footer_col2_title) || "Clienți"}>
              <ul className="space-y-2">
                {renderLinks(col2Links, (
                  <>
                    <li><Link to="/track" className="footer-link">Urmărire comandă</Link></li>
                    <li><Link to="/page/livrare" className="footer-link">Transport și livrare</Link></li>
                    <li><Link to="/page/politica-retur" className="footer-link">Politica de retur</Link></li>
                    <li><Link to="/page/faq" className="footer-link">Întrebări frecvente</Link></li>
                    <li><Link to="/contact" className="footer-link">Reclamații</Link></li>
                  </>
                ))}
              </ul>
            </FooterColumn>
          )}

          {/* Col 3: Date comerciale / Legal */}
          {col3Show && (
            <FooterColumn title={unq(s.footer_col3_title) || "Date comerciale"}>
              <ul className="space-y-2 mb-4">
                <li><Link to="/page/termeni-conditii" className="footer-link">Termeni și condiții</Link></li>
                <li><Link to="/page/politica-de-confidentialitate" className="footer-link">Confidențialitate</Link></li>
                <li><Link to="/page/politica-cookie" className="footer-link">Politica cookies</Link></li>
                <li><Link to="/page/gdpr" className="footer-link">GDPR</Link></li>
              </ul>
              {showLegalData && (
                <div className="pt-3 border-t border-white/10 text-xs text-white/70 leading-relaxed space-y-0.5">
                  <p className="font-semibold text-white/90">{company}</p>
                  <p>CUI: {cui}</p>
                  <p>Reg. Com.: {regCom}</p>
                  <p className="flex items-start gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "hsl(var(--footer-accent))" }} />
                    <span>{address}</span>
                  </p>
                </div>
              )}
            </FooterColumn>
          )}

          {/* Col 4: Suport / Contact direct */}
          {col4Show && (
            <FooterColumn title={unq(s.footer_col4_title) || "Suport"}>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-white/85">
                  <Phone className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--footer-accent))" }} />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white font-medium">{phone}</a>
                </li>
                <li className="flex items-start gap-2 text-white/85">
                  <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--footer-accent))" }} />
                  <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
                </li>
                <li className="flex items-start gap-2 text-white/70 text-xs">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(var(--footer-accent))" }} />
                  <span>{schedule}</span>
                </li>
              </ul>
            </FooterColumn>
          )}
        </div>

        {/* === SOCIAL ROW CENTRAT (ca bitmi) === */}
        {socialShow && (facebook || instagram || youtube || tiktok) && (
          <div className="border-t border-white/10">
            <div className="ml-container py-6 flex flex-col items-center gap-3">
              <p className="text-xs text-white/60 uppercase tracking-[0.2em]">Urmărește-ne</p>
              <div className="flex items-center gap-3">
                {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[hsl(var(--footer-accent))] hover:text-black flex items-center justify-center transition-colors" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>}
                {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[hsl(var(--footer-accent))] hover:text-black flex items-center justify-center transition-colors" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>}
                {youtube && <a href={youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[hsl(var(--footer-accent))] hover:text-black flex items-center justify-center transition-colors" aria-label="YouTube"><Youtube className="h-4 w-4" /></a>}
                {tiktok && <a href={tiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-[hsl(var(--footer-accent))] hover:text-black flex items-center justify-center transition-colors" aria-label="TikTok"><span className="text-sm font-bold">T</span></a>}
              </div>
            </div>
          </div>
        )}

        {/* === COMPLIANCE BAR (Plăți + ANPC/SOL ca bitmi) === */}
        <div className="border-t border-white/10 bg-black/30">
          <div className="ml-container py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
            {showPaymentIcons ? (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span className="text-xs text-white/60 uppercase tracking-wider">Plătește sigur cu</span>
                <FooterPaymentIcons />
              </div>
            ) : <div />}
            <div className="flex items-center gap-3">
              {anpcShow && (
                <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-md px-2 py-1 hover:opacity-90 transition-opacity">
                  <img src={anpcLogo} alt="ANPC SAL" className="h-9" loading="lazy" />
                </a>
              )}
              {salShow && (
                <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-md px-2 py-1 hover:opacity-90 transition-opacity">
                  <img src={salLogo} alt="ANPC SOL" className="h-9" loading="lazy" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* === COPYRIGHT === */}
        <div className="border-t border-white/10">
          <div className="ml-container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/50">
            <p>© {year} {copyrightName}. Toate drepturile rezervate.</p>
            {madeInShow && (
              <p dangerouslySetInnerHTML={{ __html: madeInText.replace(/♥|❤️|❤/g, `<span style="color: hsl(var(--footer-accent))">♥</span>`) }} />
            )}
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
