import { Link } from "react-router-dom";
import { Phone, Mail, Clock } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import FooterNewsletter from "./footer/FooterNewsletter";
import FooterPaymentIcons from "./footer/FooterPaymentIcons";
import BackToTop from "./footer/BackToTop";

const unq = (s?: string) => (s || "").replace(/^"|"$/g, "");

export default function Footer() {
  const { settings: s } = useSettings();
  if (s.footer_show === "false") return null;

  const year = new Date().getFullYear();
  const phone = unq(s.footer_phone) || "+40 743 326 405";
  const email = unq(s.footer_email) || "contact@mamalucica.ro";
  const schedule = unq(s.footer_col4_support_text) || "Luni - Vineri, 9:00 - 17:00";
  const copyrightName = unq(s.footer_copyright_name) || "Mama Lucica";
  const company = unq(s.footer_company_name) || "SC VOMIX GENIUS SRL";

  const anpcUrl = unq(s.footer_anpc_url) || "https://anpc.ro/ce-este-sal/";
  const anpcLogo = unq(s.footer_anpc_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg";
  const salUrl = unq(s.footer_sal_url) || "https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO";
  const salLogo = unq(s.footer_sal_logo_url) || "https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg";

  return (
    <>
      <footer className="mt-0">
        {/* LAYER 1 — Pre-footer steps */}
        <div className="bg-white border-t" style={{ borderColor: "#e5e7eb" }}>
          <div className="ml-container py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Alege produsele", sub: "Navighează catalogul nostru" },
              { step: "2", title: "Finalizează comanda", sub: "Plată securizată online sau ramburs" },
              { step: "3", title: "Primești acasă în 24-48h", sub: "Livrare rapidă în toată România" },
            ].map(({ step, title, sub }) => (
              <div key={step} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-bold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LAYER 2 — Main footer */}
        <div style={{ background: "#1f1f1f", color: "#d4d4d4" }}>
          <div className="ml-container py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">Informații</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/despre-noi" className="hover:text-white transition-colors">Despre noi</Link></li>
                <li><Link to="/page/termeni-conditii" className="hover:text-white transition-colors">Termeni și condiții</Link></li>
                <li><Link to="/page/politica-de-confidentialitate" className="hover:text-white transition-colors">Confidențialitate</Link></li>
                <li><Link to="/page/politica-cookie" className="hover:text-white transition-colors">Politica cookies</Link></li>
                <li><Link to="/page/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">Contul meu</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/account" className="hover:text-white transition-colors">Datele mele</Link></li>
                <li><Link to="/account/orders" className="hover:text-white transition-colors">Comenzile mele</Link></li>
                <li><Link to="/account/favorites" className="hover:text-white transition-colors">Favorite</Link></li>
                <li><Link to="/account/addresses" className="hover:text-white transition-colors">Adrese</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">Magazinul nostru</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/despre-noi" className="hover:text-white transition-colors">Despre noi</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/page/livrare" className="hover:text-white transition-colors">Livrare</Link></li>
                <li><Link to="/page/politica-retur" className="hover:text-white transition-colors">Politica retur</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">Suport clienți</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white font-medium">{phone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
                </li>
                <li className="flex items-center gap-2 text-xs opacity-70">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{schedule}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* LAYER 3 — Payment & compliance */}
        <div style={{ background: "#1f1f1f" }} className="border-t border-gray-800">
          <div className="ml-container py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Plată securizată</span>
              <FooterPaymentIcons />
            </div>
            <div className="flex items-center gap-3">
              <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                <img src={anpcLogo} alt="ANPC SAL" className="h-8" loading="lazy" />
              </a>
              <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
                <img src={salLogo} alt="ANPC SOL" className="h-8" loading="lazy" />
              </a>
            </div>
          </div>
        </div>

        {/* LAYER 4 — Copyright */}
        <div style={{ background: "#181818" }}>
          <div className="ml-container py-4 text-center">
            <p className="text-[11px] text-gray-600">
              © {year} {copyrightName} · {company}. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </footer>
      <BackToTop />
    </>
  );
}
