import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Globe, ShieldCheck, ArrowRight } from "lucide-react";
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
    { label: "FAQ", url: "/faq", active: true },
    { label: "Livrare", url: "/livrare-internationala", active: true },
    { label: "Urmărire Comandă", url: "/tracking", active: true },
  ];

  const legalLinks = [
    { label: "Termeni și Condiții", url: "/page/termeni-si-conditii" },
    { label: "Politica de Confidențialitate", url: "/page/politica-de-confidentialitate" },
    { label: "Politica Cookie", url: "/page/politica-cookie" },
    { label: "Politica de Retur", url: "/page/politica-retur" },
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
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container py-14 md:py-16 px-5">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-8">
          {/* Newsletter column (like Ella footer) */}
          <div className="col-span-2 lg:col-span-1">
            <p className="font-sans text-sm text-muted-foreground mb-4">
              Abonează-te pentru noutăți și oferte!
            </p>
            <form onSubmit={handleSubscribe} className="mb-4">
              <div className="flex border border-foreground">
                <Input type="email" placeholder="Adresa de email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-transparent border-0 text-foreground placeholder:text-muted-foreground rounded-none flex-1 h-10 font-sans text-sm focus:ring-0" required />
                <button type="submit" disabled={loading} className="shrink-0 px-3 h-10 text-foreground hover:opacity-70 transition-opacity">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5" />
                <span className="font-sans text-[11px] text-muted-foreground">Sunt de acord cu <Link to="/page/politica-de-confidentialitate" className="underline">Politica de Confidențialitate</Link>.</span>
              </label>
            </form>
            <div className="flex gap-4 mt-4">
              {(socialLinks.length > 0 ? socialLinks : [
                { platform: "instagram", url: "#", icon: "instagram" },
                { platform: "facebook", url: "#", icon: "facebook" },
                { platform: "tiktok", url: "#", icon: "tiktok" },
              ]).map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-foreground transition-colors"
                  aria-label={link.platform}>
                  <SocialIcon icon={link.icon} className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-sans text-sm font-medium text-foreground mb-4">{texts.col2_title}</h4>
            <ul className="space-y-2.5">
              {col2Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-sans text-sm font-medium text-foreground mb-4">{texts.col3_title}</h4>
            <ul className="space-y-2.5">
              {col3Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-sans text-sm font-medium text-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((l, i) => (
                <li key={i}><Link to={l.url} className="font-sans text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            {texts.col4_show_phone && texts.col4_phone && (
              <p className="font-sans text-sm text-foreground mb-1">{texts.col4_phone}</p>
            )}
            {texts.col4_show_email && texts.col4_email && (
              <p className="font-sans text-sm text-muted-foreground mb-3">{texts.col4_email}</p>
            )}
            {texts.col4_show_address && texts.col4_address && (
              <p className="font-sans text-sm text-muted-foreground">{texts.col4_address}</p>
            )}
          </div>
        </div>

        {/* Bottom bar with SOL + ANPC */}
        <div className="border-t border-border mt-12 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-sans text-xs text-muted-foreground">{copyrightText}</p>
              {companyInfo.cui && (
                <>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <p className="font-sans text-[10px] text-muted-foreground">CUI: {companyInfo.cui} · {companyInfo.reg_com || ""}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="ANPC">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-sans text-xs">ANPC</span>
              </a>
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                title="SOL / ODR">
                <Globe className="w-4 h-4" />
                <span className="font-sans text-xs">SOL</span>
              </a>
              <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-3 [&_a]:inline-flex [&_a]:items-center [&_a]:text-muted-foreground [&_a]:hover:text-foreground [&_a]:transition-colors [&_img]:h-5 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-60 [&_img]:hover:opacity-100 [&_span]:text-xs [&_p]:text-xs [&_div]:contents" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
