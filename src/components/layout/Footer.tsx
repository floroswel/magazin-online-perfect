import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Youtube, ArrowRight, Phone, Mail, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import React from "react";
import { useVisibility } from "@/hooks/useVisibility";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";

const emailSchema = z.string().trim().email("Adresa de email nu este validă").max(255);

interface SocialLink { platform: string; url: string; icon: string }
interface FooterLink { label: string; url: string; active: boolean }
interface FooterTexts {
  col1_title: string; col1_description: string;
  col2_title: string; col2_links: FooterLink[];
  col3_title: string; col3_links: FooterLink[];
  col4_title: string; col4_email: string; col4_phone: string; col4_address: string; col4_hours: string;
  col4_show_email: boolean; col4_show_phone: boolean; col4_show_address: boolean; col4_show_hours: boolean;
  copyright: string; extra_legal: string; show_made_in: boolean;
}

const SocialIcon = React.forwardRef<HTMLSpanElement, { icon: string; className?: string }>(
  ({ icon, className }, ref) => {
    const content = (() => {
      switch (icon) {
        case "facebook": return <Facebook className={className} />;
        case "instagram": return <Instagram className={className} />;
        case "youtube": return <Youtube className={className} />;
        case "tiktok": return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>;
        default: return null;
      }
    })();
    return <span ref={ref}>{content}</span>;
  }
);
SocialIcon.displayName = "SocialIcon";

const DEFAULTS: FooterTexts = {
  col1_title: "Mama Lucica", col1_description: "Lumânări artizanale din ceară naturală de soia, turnate manual cu dragoste în România.",
  col2_title: "Magazinul meu", col2_links: [],
  col3_title: "Clienți", col3_links: [],
  col4_title: "Contact", col4_email: "contact@mamalucica.ro", col4_phone: "0800-123-456", col4_address: "București, România", col4_hours: "L-V: 09-17",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} Mama Lucica SRL. Toate drepturile rezervate.", extra_legal: "", show_made_in: true,
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);
  const [footerScripts, setFooterScripts] = useState<string[]>([]);
  const footerScriptsRef = useRef<HTMLDivElement>(null);
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const layout = useLayoutSettings();

  const showColumns = useVisibility("footer_columns");
  const showSocial = useVisibility("footer_social");
  const showNewsletter = useVisibility("footer_newsletter");

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("key, value_json").in("key", ["footer_social_links", "footer_texts", "company_info"]),
      (supabase as any).from("custom_scripts").select("inline_content, content").eq("is_active", true).eq("location", "footer").order("sort_order"),
    ]).then(([settingsRes, scriptsRes]: any[]) => {
      settingsRes.data?.forEach((row: any) => {
        if (row.key === "footer_social_links" && Array.isArray(row.value_json)) setSocialLinks(row.value_json as unknown as SocialLink[]);
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

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    if (!gdprConsent) { toast.error("Acceptă primirea emailurilor."); return; }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: result.data, source: "footer", consent_at: new Date().toISOString() } as any);
    if (error) toast[error.code === "23505" ? "info" : "error"](error.code === "23505" ? "Ești deja abonat!" : "Eroare.");
    else { toast.success("Te-ai abonat cu succes!"); setEmail(""); setGdprConsent(false); }
    setLoading(false);
  };

  const copyrightText = texts.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="mt-auto overflow-hidden">
      {/* Upper Footer */}
      <div style={{ background: "#1A1A1A" }}>
        <div className="container py-10 md:py-12 px-4 max-w-[1200px] mx-auto">
          {showColumns !== false && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1 — About */}
              <div>
                <h4 className="text-lg text-primary mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{texts.col1_title}</h4>
                <p className="text-sm mb-4" style={{ color: "#AAA" }}>{texts.col1_description}</p>
                {showSocial !== false && (
                  <div className="flex gap-3">
                    {(socialLinks.length > 0 ? socialLinks : [
                      { platform: "facebook", url: "#", icon: "facebook" },
                      { platform: "instagram", url: "#", icon: "instagram" },
                      { platform: "youtube", url: "#", icon: "youtube" },
                      { platform: "tiktok", url: "#", icon: "tiktok" },
                    ]).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "hsl(35 75% 42%)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        aria-label={link.platform}>
                        <SocialIcon icon={link.icon} className="w-4 h-4 text-white" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2 — Magazinul meu */}
              <div>
                <h4 className="text-white mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px" }}>{texts.col2_title}</h4>
                <ul className="space-y-2">
                  {col2Links.map((l, i) => (
                    <li key={i}>
                      <Link to={l.url} className="text-[13px] transition-colors hover:text-primary" style={{ color: "#AAA" }}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3 — Clienti + Contact */}
              <div>
                <h4 className="text-white mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px" }}>{texts.col3_title}</h4>
                <ul className="space-y-2 mb-6">
                  {col3Links.map((l, i) => (
                    <li key={i}>
                      {l.url.startsWith("http") ? (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[13px] transition-colors hover:text-primary" style={{ color: "#AAA" }}>
                          {l.label}
                        </a>
                      ) : (
                        <Link to={l.url} className="text-[13px] transition-colors hover:text-primary" style={{ color: "#AAA" }}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Contact info */}
                <div className="space-y-2">
                  {texts.col4_show_phone && texts.col4_phone && (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: "#AAA" }}>
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_phone}</span>
                    </div>
                  )}
                  {texts.col4_show_email && texts.col4_email && (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: "#AAA" }}>
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_email}</span>
                    </div>
                  )}
                  {texts.col4_show_hours && texts.col4_hours && (
                    <div className="flex items-center gap-2 text-[13px]" style={{ color: "#AAA" }}>
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>{texts.col4_hours}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lower Footer */}
      <div style={{ background: "#111" }}>
        <div className="container py-4 px-4 max-w-[1200px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs" style={{ color: "#888" }}>{copyrightText}</p>
              {companyInfo.cui && (
                <p className="text-[10px]" style={{ color: "#666" }}>CUI: {companyInfo.cui} · {companyInfo.reg_com || ""}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-4 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_img]:h-7 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-70 [&_img]:hover:opacity-100 [&_span]:text-sm [&_p]:text-sm [&_div]:contents" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
