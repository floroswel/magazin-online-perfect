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
  const mainBg = unq(s.footer_bg_color) || unq(s.footer_main_bg) || unq(s.theme_footer_color) || "#1f1f1f";
  const copyrightBg = unq(s.footer_copyright_bg) || "#181818";
  const primaryColor = unq(s.primary_color) || unq(s.theme_primary_color) || "#2563eb";

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

  // Dynamic links from admin (pipe-separated: "Label:/url|Label2:/url2")
  const parseLinks = (raw: string, fallback: { label: string; url: string }[]) => {
    const val = unq(raw);
    if (!val) return fallback;
    return val.split("|").map(entry => {
      const [label, ...urlParts] = entry.split(":");
      const url = urlParts.join(":");
      return { label: label.trim(), url: url.trim() };
    }).filter(l => l.label && l.url);
  };

  const col1Links = parseLinks(s.footer_col1_links, [
    { label: "Cum cumpăr", url: "/page/cum-cumpar" },
    { label: "Politica de livrare", url: "/page/livrare" },
    { label: "Politica de returnare", url: "/page/politica-retur" },
    { label: "Termeni și condiții", url: "/page/termeni-conditii" },
    { label: "GDPR", url: "/page/gdpr" },
  ]);

  const col2Links = parseLinks(s.footer_col2_links, [
    { label: "Datele mele", url: "/account" },
    { label: "Comenzi", url: "/account/orders" },
    { label: "Lista de dorințe", url: "/account/favorites" },
  ]);

  // Col3 — if title is "Date comerciale" show company data, otherwise use links
  const col3Title = unq(s.footer_col3_title) || "Magazinul nostru";
  const isCompanyDataCol = col3Title.toLowerCase().includes("date comerciale") || col3Title.toLowerCase().includes("date companie");
  const col3Links = isCompanyDataCol ? [] : parseLinks(s.footer_col3_links || "", [
    { label: "Despre noi", url: "/page/despre-noi" },
    { label: "Blog", url: "/blog" },
    { label: "Contact", url: "/contact" },
  ]);

  const isExternal = (url: string) => url.startsWith("http");

  const renderLinkList = (links: { label: string; url: string }[]) => (
    <ul className="space-y-2 text-sm">
      {links.map((l, i) =>
        <li key={i}>
          {isExternal(l.url) ? (
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{l.label}</a>
          ) : (
            <Link to={l.url} className="hover:text-white transition-colors">{l.label}</Link>
          )}
        </li>
      )}
    </ul>
  );

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
              {renderLinkList(col1Links)}
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col2Heading}</h4>
              {renderLinkList(col2Links)}
            </div>

            <div>
              <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-white">{col3Heading}</h4>
              {isCompanyDataCol ? (
                <ul className="space-y-2 text-sm">
                  <li>{company}</li>
                  {unq(s.footer_cui) && <li>CUI: {unq(s.footer_cui)}</li>}
                  {unq(s.footer_reg_com) && <li>Reg. Com: {unq(s.footer_reg_com)}</li>}
                  {unq(s.footer_capital_social) && <li>Capital social: {unq(s.footer_capital_social)}</li>}
                  {unq(s.footer_address_street) && <li>{unq(s.footer_address_street)}</li>}
                  {unq(s.footer_address_city) && <li>{unq(s.footer_address_city)}</li>}
                </ul>
              ) : renderLinkList(col3Links)}
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
                {schedule && (
                  <li className="text-xs leading-relaxed mt-2" style={{ color: "#999" }}>{schedule}</li>
                )}
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
