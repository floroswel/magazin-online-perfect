import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Clock, MapPin, Facebook, Instagram, Youtube, Globe, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import React from "react";

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
  col1_title: "Mama Lucica", col1_description: "Lumânări artizanale din ceară de soia, create cu dragoste în România.",
  col2_title: "Colecții", col2_links: [],
  col3_title: "Informații", col3_links: [],
  col4_title: "Contact", col4_email: "contact@mamalucica.ro", col4_phone: "", col4_address: "", col4_hours: "",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} Mama Lucica", extra_legal: "", show_made_in: true,
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
    { label: "Lumânări Parfumate", url: "/catalog?category=parfumate", active: true },
    { label: "Seturi Cadou", url: "/catalog?category=seturi-cadou", active: true },
    { label: "Personalizare", url: "/personalizare", active: true },
  ];

  const col3Links = texts.col3_links.length > 0 ? texts.col3_links.filter(l => l.active) : [
    { label: "Povestea Noastră", url: "/povestea-noastra", active: true },
    { label: "Îngrijire Lumânări", url: "/ingrijire-lumanari", active: true },
    { label: "FAQ", url: "/faq", active: true },
    { label: "Livrare", url: "/livrare-internationala", active: true },
    { label: "Urmărire Comandă", url: "/tracking", active: true },
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
    <footer className="bg-foreground text-background mt-auto">
      {/* Warm divider */}
      <div className="h-1 bg-primary" />

      <div className="container py-14 md:py-20 px-5">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-4">{texts.col1_title || "Mama Lucica"}</h3>
            <p className="font-sans font-light text-sm text-background/60 leading-relaxed mb-6">{texts.col1_description}</p>
            <div className="flex gap-3">
              {(socialLinks.length > 0 ? socialLinks : [
                { platform: "instagram", url: "#", icon: "instagram" },
                { platform: "facebook", url: "#", icon: "facebook" },
                { platform: "tiktok", url: "#", icon: "tiktok" },
              ]).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 border border-background/20 hover:border-primary hover:text-primary flex items-center justify-center transition-all duration-300 rounded-full text-background/60"
                  aria-label={link.platform}>
                  <SocialIcon icon={link.icon} className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-sans text-[11px] font-semibold tracking-[3px] uppercase text-background/40 mb-6">{texts.col2_title}</h4>
            <ul className="space-y-3">
              {col2Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="font-sans text-sm text-background/60 hover:text-background transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-sans text-[11px] font-semibold tracking-[3px] uppercase text-background/40 mb-6">{texts.col3_title}</h4>
            <ul className="space-y-3">
              {col3Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="font-sans text-sm text-background/60 hover:text-background transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <h4 className="font-sans text-[11px] font-semibold tracking-[3px] uppercase text-background/40 mt-8 mb-4">Informații Legale</h4>
            <ul className="space-y-2">
              <li><Link to="/page/termeni-si-conditii" className="font-sans text-xs text-background/40 hover:text-background/80 transition-colors">Termeni și Condiții</Link></li>
              <li><Link to="/page/politica-de-confidentialitate" className="font-sans text-xs text-background/40 hover:text-background/80 transition-colors">Politica de Confidențialitate</Link></li>
              <li><Link to="/page/politica-cookie" className="font-sans text-xs text-background/40 hover:text-background/80 transition-colors">Politica Cookie</Link></li>
              <li><Link to="/page/politica-retur" className="font-sans text-xs text-background/40 hover:text-background/80 transition-colors">Politica de Retur</Link></li>
            </ul>
          </div>

          {/* Col 4 - Newsletter + Contact */}
          <div>
            <h4 className="font-sans text-[11px] font-semibold tracking-[3px] uppercase text-background/40 mb-6">Newsletter</h4>
            <p className="font-sans font-light text-sm text-background/50 mb-4">Primește -10% la prima comandă.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex">
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-background/10 border-background/10 text-background placeholder:text-background/30 rounded-none flex-1 h-10 font-sans text-sm" required />
                <button type="submit" disabled={loading} className="shrink-0 bg-primary hover:bg-ml-terracotta-dark text-primary-foreground px-4 h-10 transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5 rounded-sm" />
                <span className="font-sans text-[11px] text-background/40">Sunt de acord să primesc emailuri. Citește <Link to="/page/politica-de-confidentialitate" className="text-primary hover:underline">Politica de Confidențialitate</Link>.</span>
              </label>
            </form>
            <div className="mt-6 space-y-2">
              {texts.col4_show_phone && texts.col4_phone && (
                <p className="flex items-center gap-2 font-sans text-sm text-background/50"><Phone className="w-3.5 h-3.5" /> {texts.col4_phone}</p>
              )}
              {texts.col4_show_email && texts.col4_email && (
                <p className="flex items-center gap-2 font-sans text-sm text-background/50"><Mail className="w-3.5 h-3.5" /> {texts.col4_email}</p>
              )}
              {texts.col4_show_hours && texts.col4_hours && (
                <p className="flex items-center gap-2 font-sans text-sm text-background/50"><Clock className="w-3.5 h-3.5" /> {texts.col4_hours}</p>
              )}
              {texts.col4_show_address && texts.col4_address && (
                <p className="flex items-center gap-2 font-sans text-sm text-background/50"><MapPin className="w-3.5 h-3.5" /> {texts.col4_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar with SOL + ANPC */}
        <div className="border-t border-background/10 mt-14 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-sans text-xs text-background/40">{copyrightText}</p>
              <span className="font-sans text-[10px] text-background/25">·</span>
              <p className="font-sans text-[10px] text-background/30">CUI: {companyInfo.cui || "RO00000000"} · {companyInfo.reg_com || "J40/0000/2020"}</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-background/[0.07] hover:bg-background/[0.12] border border-background/10 hover:border-background/20 px-4 py-2 rounded-lg transition-all"
                title="ANPC – Autoritatea Națională pentru Protecția Consumatorilor">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-sans text-xs font-medium text-background/70">ANPC</span>
              </a>
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-background/[0.07] hover:bg-background/[0.12] border border-background/10 hover:border-background/20 px-4 py-2 rounded-lg transition-all"
                title="SOL – Soluționarea Online a Litigiilor (UE)">
                <Globe className="w-5 h-5 text-primary" />
                <span className="font-sans text-xs font-medium text-background/70">SOL / ODR</span>
              </a>
              <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-3 [&_a]:inline-flex [&_a]:items-center [&_a]:bg-background/[0.07] [&_a]:hover:bg-background/[0.12] [&_a]:border [&_a]:border-background/10 [&_a]:hover:border-background/20 [&_a]:px-3 [&_a]:py-2 [&_a]:rounded-lg [&_a]:transition-all [&_img]:h-7 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-70 [&_img]:hover:opacity-100 [&_span]:text-xs [&_span]:text-background/60 [&_p]:text-xs [&_p]:text-background/60 [&_div]:contents" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
