import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { useVisibility } from "@/hooks/useVisibility";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
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
  col2_title: "Clienți", col2_links: [],
  col3_title: "Date comerciale", col3_links: [],
  col4_title: "Contact", col4_email: "contact@mamalucica.ro", col4_phone: "0800-123-456", col4_address: "București, România", col4_hours: "L-V: 09-17",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} Mama Lucica SRL. Toate drepturile rezervate.", extra_legal: "", show_made_in: true,
};

export default function Footer() {
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);
  const [footerScripts, setFooterScripts] = useState<string[]>([]);
  const footerScriptsRef = useRef<HTMLDivElement>(null);
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const layout = useLayoutSettings();

  const showColumns = useVisibility("footer_columns");

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("key, value_json").in("key", ["footer_texts", "company_info"]),
      (supabase as any).from("custom_scripts").select("inline_content, content").eq("is_active", true).eq("location", "footer").order("sort_order"),
    ]).then(([settingsRes, scriptsRes]: any[]) => {
      settingsRes.data?.forEach((row: any) => {
        if (row.key === "footer_texts" && row.value_json && typeof row.value_json === "object" && !Array.isArray(row.value_json)) setTexts(prev => ({ ...prev, ...(row.value_json as any) }));
        if (row.key === "company_info" && row.value_json) setCompanyInfo(row.value_json);
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
    { label: "Despre noi", url: "/povestea-noastra", active: true },
    { label: "Termeni si Conditii", url: "/termeni-si-conditii", active: true },
    { label: "Politica de Confidentialitate", url: "/politica-de-confidentialitate", active: true },
    { label: "Politica de livrare", url: "/livrare-internationala", active: true },
    { label: "Contact", url: "/faq", active: true },
  ];

  const col3Links = texts.col3_links.length > 0 ? texts.col3_links.filter(l => l.active) : [
    { label: "Metode de Plata", url: "/page/plati", active: true },
    { label: "Politica de Retur", url: "/politica-de-retur", active: true },
    { label: "Garantia Produselor", url: "/page/garantie", active: true },
    { label: "Solutionarea Online a Litigiilor", url: "#", active: true },
    { label: "ANPC", url: "https://anpc.ro", active: true },
    { label: "ANPC-SAL", url: "https://anpc.ro/ce-este-sal", active: true },
  ];

  const copyrightText = texts.copyright.replace("{year}", String(new Date().getFullYear()));

  const renderLink = (l: FooterLink, i: number) => {
    const cls = "text-[13px] transition-colors text-white/60 hover:text-primary hover:underline";
    if (l.url.startsWith("http")) {
      return <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className={cls}>{l.label}</a>;
    }
    return <Link key={i} to={l.url} className={cls}>{l.label}</Link>;
  };

  return (
    <footer className="mt-auto overflow-hidden">
      {/* Trust Icons from admin */}
      <TrustIcons />
      {/* Upper Footer — eMAG dark style */}
      <div className="bg-[hsl(0_0%_13%)]">
        <div className="container py-12 px-4 max-w-[1200px] mx-auto">
          {showColumns !== false && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Brand column */}
              <div>
                <h4 className="text-lg font-black mb-4 text-white">
                  Mama<span className="text-primary">Lucica</span>
                </h4>
                {texts.col1_description && (
                  <p className="text-[13px] text-white/40 leading-relaxed">{texts.col1_description}</p>
                )}
                {companyInfo.cui && (
                  <p className="text-[12px] mt-3 text-white/30">CUI: {companyInfo.cui}</p>
                )}
                {companyInfo.reg_com && (
                  <p className="text-[12px] text-white/30">Reg. Com.: {companyInfo.reg_com}</p>
                )}
              </div>

              {/* Column 2 — Links */}
              <div>
                <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-white/80">
                  {texts.col1_title || "Informații"}
                </h5>
                <ul className="space-y-2.5">
                  {col2Links.map((l, i) => <li key={i}>{renderLink(l, i)}</li>)}
                </ul>
              </div>

              {/* Column 3 — Legal */}
              <div>
                <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-white/80">
                  {texts.col3_title || "Legal"}
                </h5>
                <ul className="space-y-2.5">
                  {col3Links.map((l, i) => <li key={i}>{renderLink(l, i)}</li>)}
                </ul>
              </div>

              {/* Column 4 — Contact */}
              <div>
                <h5 className="text-sm font-bold mb-4 uppercase tracking-wider text-white/80">
                  Contact
                </h5>
                <div className="space-y-3">
                  {texts.col4_show_phone && texts.col4_phone && (
                    <div className="flex items-center gap-2.5 text-[13px] text-white/60">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_phone}</span>
                    </div>
                  )}
                  {texts.col4_show_email && texts.col4_email && (
                    <div className="flex items-center gap-2.5 text-[13px] text-white/60">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_email}</span>
                    </div>
                  )}
                  {texts.col4_show_hours && texts.col4_hours && (
                    <div className="flex items-center gap-2.5 text-[13px] text-white/60">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_hours}</span>
                    </div>
                  )}
                  {texts.col4_show_address && texts.col4_address && (
                    <p className="text-[13px] text-white/40 mt-2">{texts.col4_address}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lower Footer */}
      <div className="bg-[hsl(0_0%_10%)] border-t border-white/10">
        <div className="container py-4 px-4 max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/30">{copyrightText}</p>
            <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-4 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_img]:h-7 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-70 [&_img]:hover:opacity-100 [&_span]:text-sm [&_p]:text-sm [&_div]:contents" />
          </div>
        </div>
      </div>
    </footer>
  );
}