import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock, CreditCard, Truck, Shield } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface LinkItem { label: string; url: string }

function parseLinks(raw: string): LinkItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((p: any) => p?.label && p?.url);
  } catch {}
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
  const address = unq(s.footer_address) || "Str. Constructorilor 39, Voievoda, Teleorman";
  const email = unq(s.footer_email) || "contact@mamalucica.ro";
  const phone = unq(s.footer_phone) || "+40 743 326 405";
  const schedule = unq(s.footer_col4_support_text) || "Luni - Vineri, 9:00 - 17:00";

  const socialShow = truthy(s.footer_social_show);
  const facebook = unq(s.footer_facebook_url);
  const instagram = unq(s.footer_instagram_url);
  const youtube = unq(s.footer_youtube_url);

  const anpcShow = truthy(s.footer_anpc_show);
  const anpcUrl = unq(s.footer_anpc_url) || "https://anpc.ro/ce-este-sal/";
  const anpcLogo = unq(s.footer_anpc_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg";
  const salShow = truthy(s.footer_sal_show);
  const salUrl = unq(s.footer_sal_url) || "https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO";
  const salLogo = unq(s.footer_sal_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg";

  const copyrightName = unq(s.footer_copyright_name) || "Mama Lucica";
  const brandDescription = unq(s.footer_brand_description) ||
    "Lumânări 100% handmade din ceară de soia, turnate manual cu suflet în România.";

  const trustItems = [
    { Icon: Truck, title: "Livrare 24-48h", subtitle: "În toată România" },
    { Icon: Shield, title: "Plată 100% sigură", subtitle: "Netopia · Mokka · Ramburs" },
    { Icon: CreditCard, title: "Retur 30 zile", subtitle: "Fără întrebări" },
    { Icon: Mail, title: "Suport rapid", subtitle: "L-V 9-17" },
  ];

  return (
    <footer className="footer-dark mt-20">
      {/* Trust strip */}
      <div className="border-b border-white/5">
        <div className="ml-container py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <f.Icon className="h-5 w-5 text-primary" style={{ color: "hsl(var(--footer-accent))" }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-white/60">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns — Altex 5-col layout */}
      <div className="ml-container py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🕯️</span>
            <span className="font-display text-lg font-bold text-white">{copyrightName}</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-5">{brandDescription}</p>
          {socialShow && (
            <div className="flex items-center gap-2">
              {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary flex items-center justify-center transition-colors" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary flex items-center justify-center transition-colors" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {youtube && (
                <a href={youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 hover:bg-primary flex items-center justify-center transition-colors" aria-label="YouTube">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Coloana 1 — Despre */}
        {col1Show && (
          <div>
            <h4 className="footer-col-title">{unq(s.footer_col1_title) || "Despre noi"}</h4>
            <ul className="space-y-1">
              {col1Links.length > 0 ? col1Links.map((l, i) => (
                <li key={i}>
                  {l.url.startsWith("http") ? (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="footer-link">{l.label}</a>
                  ) : (
                    <Link to={l.url} className="footer-link">{l.label}</Link>
                  )}
                </li>
              )) : (
                <>
                  <li><Link to="/page/despre-noi" className="footer-link">Despre noi</Link></li>
                  <li><Link to="/blog" className="footer-link">Blog</Link></li>
                  <li><Link to="/page/cariere" className="footer-link">Cariere</Link></li>
                  <li><Link to="/contact" className="footer-link">Contact</Link></li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Coloana 2 — Suport */}
        {col2Show && (
          <div>
            <h4 className="footer-col-title">{unq(s.footer_col2_title) || "Suport clienți"}</h4>
            <ul className="space-y-1">
              {col2Links.length > 0 ? col2Links.map((l, i) => (
                <li key={i}>
                  {l.url.startsWith("http") ? (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="footer-link">{l.label}</a>
                  ) : (
                    <Link to={l.url} className="footer-link">{l.label}</Link>
                  )}
                </li>
              )) : (
                <>
                  <li><Link to="/track" className="footer-link">Urmărire comandă</Link></li>
                  <li><Link to="/page/livrare" className="footer-link">Transport și livrare</Link></li>
                  <li><Link to="/page/politica-retur" className="footer-link">Politica de retur</Link></li>
                  <li><Link to="/page/faq" className="footer-link">Întrebări frecvente</Link></li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Coloana 3 — Informații legale */}
        {col3Show && (
          <div>
            <h4 className="footer-col-title">{unq(s.footer_col3_title) || "Informații legale"}</h4>
            <ul className="space-y-1">
              <li><Link to="/page/termeni-conditii" className="footer-link">Termeni și condiții</Link></li>
              <li><Link to="/page/politica-de-confidentialitate" className="footer-link">Politica de confidențialitate</Link></li>
              <li><Link to="/page/politica-cookie" className="footer-link">Politica cookies</Link></li>
              <li><Link to="/page/gdpr" className="footer-link">GDPR</Link></li>
              <li className="pt-3 text-xs text-white/40 leading-relaxed">
                {company}<br />
                CUI: {cui} · {regCom}
              </li>
            </ul>
          </div>
        )}

        {/* Coloana 4 — Contact */}
        {col4Show && (
          <div>
            <h4 className="footer-col-title">{unq(s.footer_col4_title) || "Contact"}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 text-white/70">
                <Phone className="h-4 w-4 shrink-0 mt-0.5 text-primary" style={{ color: "hsl(var(--footer-accent))" }} />
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white">{phone}</a>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <Mail className="h-4 w-4 shrink-0 mt-0.5 text-primary" style={{ color: "hsl(var(--footer-accent))" }} />
                <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-primary" style={{ color: "hsl(var(--footer-accent))" }} />
                <span>{schedule}</span>
              </li>
              <li className="flex items-start gap-2 text-white/70">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" style={{ color: "hsl(var(--footer-accent))" }} />
                <span className="text-xs">{address}</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* ANPC strip */}
      {(anpcShow || salShow) && (
        <div className="border-t border-white/5 bg-black/30">
          <div className="ml-container py-5 flex flex-wrap items-center justify-center gap-6">
            {anpcShow && (
              <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity">
                <img src={anpcLogo} alt="ANPC SAL" className="h-10" />
              </a>
            )}
            {salShow && (
              <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity">
                <img src={salLogo} alt="ANPC SOL" className="h-10" />
              </a>
            )}
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>Plătește sigur cu</span>
              <span className="font-bold tracking-wider text-white/70">VISA</span>
              <span className="font-bold tracking-wider text-white/70">MASTERCARD</span>
              <span>· Netopia · Mokka</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-white/5">
        <div className="ml-container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>© {year} {copyrightName}. Toate drepturile rezervate.</p>
          <p>Made with <span className="text-primary" style={{ color: "hsl(var(--footer-accent))" }}>♥</span> în România</p>
        </div>
      </div>
    </footer>
  );
}
