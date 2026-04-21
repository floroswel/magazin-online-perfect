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

  // Steps
  const showSteps = s.footer_show_steps !== "false";
  const step1 = unq(s.footer_step1_text) || "Alege produsele";
  const step2 = unq(s.footer_step2_text) || "Finalizează comanda";
  const step3 = unq(s.footer_step3_text) || "Primește comanda";

  // Colors
  const mainBg = unq(s.footer_main_bg) || unq(s.footer_bg_color) || "#1f1f1f";
  const copyrightBg = unq(s.footer_copyright_bg) || "#181818";
  const primaryColor = unq(s.theme_primary_color) || "#2563eb";

  // Badges
  const deliveryBadgesRaw = unq(s.footer_delivery_badges) || "DPD,Fan Courier,Cargus";
  const paymentBadgesRaw = unq(s.footer_payment_badges) || "VISA,MASTERCARD,NETOPIA,RAMBURS";
  const deliveryBadges = deliveryBadgesRaw.split(",").map(b => b.trim()).filter(Boolean);
  const paymentBadges = paymentBadgesRaw.split(",").map(b => b.trim()).filter(Boolean);

  // Column headings
  const col1Heading = unq(s.footer_col1_heading) || unq(s.footer_col1_title) || "Informații utilitare";
  const col2Heading = unq(s.footer_col2_heading) || unq(s.footer_col2_title) || "Contul meu";
  const col3Heading = unq(s.footer_col3_heading) || unq(s.footer_col3_title) || "Magazinul nostru";
  const col4Heading = unq(s.footer_col4_heading) || unq(s.footer_col4_title) || "Suport clienți";

  return (
    <>
      <footer className="mt-0">
        {/* LAYER 1 — Pre-footer steps */}
        {showSteps && (
          <div className="bg-white border-t border-gray-200">
            <div className="ml-container py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              {[
                { step: "1", title: step1 },
                { step: "2", title: step2 },
                { step: "3", title: step3 },
              ].map(({ step, title }) => (
                <div key={step} className="flex flex-col md:flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0" style={{ background: primaryColor }}>
                    {step}
                  </div>
                  <p className="font-semibold text-sm text-gray-800">{title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LAYER 2 — Main footer */}
        <div style={{ background: mainBg, color: "#d4d4d4" }}>
          <div className="ml-container py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col1Heading}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/cum-cumpar" className="hover:text-white transition-colors">Cum cumpăr</Link></li>
                <li><Link to="/page/livrare" className="hover:text-white transition-colors">Politica de livrare</Link></li>
                <li><Link to="/page/politica-retur" className="hover:text-white transition-colors">Politica de returnare</Link></li>
                <li><Link to="/page/termeni-conditii" className="hover:text-white transition-colors">Termeni și condiții</Link></li>
                <li><Link to="/page/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col2Heading}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/account" className="hover:text-white transition-colors">Datele mele</Link></li>
                <li><Link to="/account/orders" className="hover:text-white transition-colors">Comenzi</Link></li>
                <li><Link to="/account/favorites" className="hover:text-white transition-colors">Lista de dorințe</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col3Heading}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/page/despre-noi" className="hover:text-white transition-colors">Despre noi</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col4Heading}</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white font-medium">{phone}</a>
                </li>
                <li className="flex items-center gap-2">
                  <span>✉️</span>
                  <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* LAYER 3 — Payment & delivery logos */}
        <div style={{ background: mainBg }} className="border-t border-gray-800">
          <div className="ml-container py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Livrare:</span>
              {deliveryBadges.map((badge) => (
                <span key={badge} className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">{badge}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Plată securizată:</span>
              {paymentBadges.map((badge) => (
                <span key={badge} className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded">{badge}</span>
              ))}
            </div>
          </div>
          {/* ANPC */}
          <div className="ml-container pb-4 flex items-center justify-center gap-3">
            <a href={anpcUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
              <img src={anpcLogo} alt="ANPC SAL" className="h-8" loading="lazy" />
            </a>
            <a href={salUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded px-2 py-1 hover:opacity-90">
              <img src={salLogo} alt="ANPC SOL" className="h-8" loading="lazy" />
            </a>
          </div>
        </div>

        {/* LAYER 4 — Copyright */}
        <div style={{ background: copyrightBg }}>
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
