import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVisibility } from "@/hooks/useVisibility";
import { useEditableContent } from "@/hooks/useEditableContent";
import TrustIcons from "@/components/TrustIcons";

interface FooterLink { label: string; url: string; active: boolean }
interface FooterTexts {
  col1_title: string; col1_description: string;
  col2_title: string; col2_links: FooterLink[];
  col3_title: string; col3_links: FooterLink[];
  col4_title: string; col4_email: string; col4_phone: string; col4_address: string; col4_hours: string;
  col4_show_email: boolean; col4_show_phone: boolean; col4_show_address: boolean; col4_show_hours: boolean;
  copyright: string; extra_legal: string; show_made_in: boolean;
}

const DEFAULTS: FooterTexts = {
  col1_title: "Magazinul meu", col1_description: "",
  col2_title: "SHOP", col2_links: [],
  col3_title: "HELP", col3_links: [],
  col4_title: "CONTACT US", col4_email: "contact@mamalucica.ro", col4_phone: "0800-123-456", col4_address: "București, România", col4_hours: "L-V: 09-17",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} MamaLucica. Toate drepturile rezervate.", extra_legal: "", show_made_in: true,
};

export default function Footer() {
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);
  const [footerScripts, setFooterScripts] = useState<string[]>([]);
  const footerScriptsRef = useRef<HTMLDivElement>(null);
  const { store_general } = useEditableContent();
  const storeName = store_general?.store_name || "MamaLucica";
  const showColumns = useVisibility("footer_columns");
  const [email, setEmail] = useState("");

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("key, value_json").in("key", ["footer_texts", "company_info"]),
      (supabase as any).from("custom_scripts").select("inline_content, content").eq("is_active", true).eq("location", "footer").order("sort_order"),
    ]).then(([settingsRes, scriptsRes]: any[]) => {
      settingsRes.data?.forEach((row: any) => {
        if (row.key === "footer_texts" && row.value_json && typeof row.value_json === "object" && !Array.isArray(row.value_json)) setTexts(prev => ({ ...prev, ...(row.value_json as any) }));
      });
      setFooterScripts((scriptsRes.data || []).map((s: any) => (s.inline_content || s.content || "").trim()).filter(Boolean));
    });
  }, []);

  useEffect(() => {
    if (!footerScriptsRef.current || footerScripts.length === 0) return;
    const container = footerScriptsRef.current;
    container.innerHTML = "";
    footerScripts.forEach(html => {
      const range = document.createRange();
      range.setStart(container, 0);
      container.appendChild(range.createContextualFragment(html));
    });
  }, [footerScripts]);

  const col2Links = texts.col2_links.length > 0 ? texts.col2_links.filter(l => l.active) : [
    { label: "Produse noi", url: "/catalog?sort=newest", active: true },
    { label: "Toate produsele", url: "/catalog", active: true },
    { label: "Promoții", url: "/catalog?on_sale=true", active: true },
  ];

  const col3Links = texts.col3_links.length > 0 ? texts.col3_links.filter(l => l.active) : [
    { label: "Despre noi", url: "/despre-noi", active: true },
    { label: "Livrare & Retur", url: "/livrare", active: true },
    { label: "Termeni și Condiții", url: "/termeni-si-conditii", active: true },
    { label: "Politica de Confidențialitate", url: "/politica-de-confidentialitate", active: true },
    { label: "Contact", url: "/contact", active: true },
  ];

  const copyrightText = texts.copyright.replace("{year}", String(new Date().getFullYear()));

  const renderLink = (l: FooterLink, i: number) => {
    const cls = "text-sm text-muted-foreground hover:text-foreground transition-colors";
    if (l.url.startsWith("http")) {
      return <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>{l.label}</a>;
    }
    return <Link key={i} to={l.url} className={cls}>{l.label}</Link>;
  };

  return (
    <footer className="mt-auto">
      <TrustIcons />

      {/* Newsletter — Ella style minimal */}
      <div className="bg-muted py-12">
        <div className="container px-4 max-w-xl mx-auto text-center">
          <div className="flex border-b-2 border-foreground">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground py-3 text-sm focus:outline-none"
            />
            <button className="px-4 py-3 text-foreground hover:opacity-60 transition-opacity" aria-label="Subscribe">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Social icons */}
      <div className="bg-muted pb-8">
        <div className="flex items-center justify-center gap-5">
          {/* X/Twitter */}
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          {/* Facebook */}
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          {/* Pinterest */}
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Pinterest">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
          </a>
          {/* Instagram */}
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          {/* YouTube */}
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>

      {/* Footer columns — Ella style white bg */}
      {showColumns !== false && (
        <div className="bg-background border-t border-border">
          <div className="container py-12 px-4 max-w-[1200px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {/* SHOP */}
              <div>
                <h5 className="text-sm font-bold mb-5 uppercase tracking-wider text-foreground">
                  {texts.col2_title || "SHOP"}
                </h5>
                <ul className="space-y-3">
                  {col2Links.map((l, i) => <li key={i}>{renderLink(l, i)}</li>)}
                </ul>
              </div>

              {/* ABOUT */}
              <div>
                <h5 className="text-sm font-bold mb-5 uppercase tracking-wider text-foreground">
                  Despre
                </h5>
                <ul className="space-y-3">
                  <li><Link to="/despre-noi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Povestea noastră</Link></li>
                  <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
                </ul>
              </div>

              {/* HELP */}
              <div>
                <h5 className="text-sm font-bold mb-5 uppercase tracking-wider text-foreground">
                  {texts.col3_title || "HELP"}
                </h5>
                <ul className="space-y-3">
                  {col3Links.map((l, i) => <li key={i}>{renderLink(l, i)}</li>)}
                </ul>
              </div>

              {/* CONTACT */}
              <div>
                <h5 className="text-sm font-bold mb-5 uppercase tracking-wider text-foreground">
                  {texts.col4_title || "CONTACT US"}
                </h5>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {texts.col4_show_phone && texts.col4_phone && <p>{texts.col4_phone}</p>}
                  {texts.col4_show_email && texts.col4_email && <p>{texts.col4_email}</p>}
                  {texts.col4_show_address && texts.col4_address && <p>{texts.col4_address}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-background border-t border-border pb-16 md:pb-0">
        <div className="container py-4 px-4 max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">{copyrightText}</p>
            <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center justify-center gap-4 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_img]:h-7 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-70 [&_img]:hover:opacity-100 [&_span]:text-sm [&_p]:text-sm [&_div]:contents" />
          </div>
        </div>
      </div>
    </footer>
  );
}
