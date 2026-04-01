import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Youtube, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
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
  col1_title: "MamaLucica", col1_description: "Magazinul tău de lumânări artizanale handmade din România.",
  col2_title: "Cumpărători", col2_links: [],
  col3_title: "Artizani", col3_links: [],
  col4_title: "Contact", col4_email: "contact@mamalucica.ro", col4_phone: "0800-123-456", col4_address: "București, România", col4_hours: "L-V: 09-18",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} MamaLucica", extra_legal: "", show_made_in: true,
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

  // Visibility hooks
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
    { label: "Cum Cumpăr", url: "/faq", active: true },
    { label: "Plăți & Rate", url: "/page/plati", active: true },
    { label: "Livrare", url: "/livrare-internationala", active: true },
    { label: "Retururi", url: "/politica-de-retur", active: true },
    { label: "Garanție", url: "/page/garantie", active: true },
  ];

  const col3Links = texts.col3_links.length > 0 ? texts.col3_links.filter(l => l.active) : [
    { label: "Devino Artizan", url: "/page/vinde", active: true },
    { label: "Portal Artizani", url: "/page/portal-vendori", active: true },
    { label: "Reguli & Politici", url: "/page/reguli", active: true },
    { label: "Instalează Aplicația", url: "/install", active: true },
  ];

  const col4Links = [
    { label: "Despre Noi", url: "/povestea-noastra" },
    { label: "Blog", url: "/recenzii" },
    { label: "Cariere", url: "/page/cariere" },
    { label: "Termeni & Condiții", url: "/termeni-si-conditii" },
    { label: "Confidențialitate", url: "/politica-de-confidentialitate" },
    { label: "Cookie-uri", url: "/politica-de-cookies" },
    { label: "Politica de Retur", url: "/politica-de-retur" },
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

  const footerColsClass = layout.footer_columns === 2 ? "lg:grid-cols-2" : layout.footer_columns === 3 ? "lg:grid-cols-3" : layout.footer_columns === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";

  return (
    <footer className="bg-foreground text-background mt-auto overflow-hidden">
      <div className="container py-10 md:py-14 px-4 max-w-[1200px] mx-auto">
        {showColumns !== false && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${footerColsClass} gap-6 md:gap-8`}>
            {/* Brand + Social */}
            <div className="col-span-2 lg:col-span-1">
              <h4 className="text-lg font-extrabold mb-3">{texts.col1_title}</h4>
              <p className="text-background/60 text-sm mb-4">{texts.col1_description}</p>
              {showSocial !== false && (
                <div className="flex gap-3 mb-4">
                  {(socialLinks.length > 0 ? socialLinks : [
                    { platform: "facebook", url: "#", icon: "facebook" },
                    { platform: "instagram", url: "#", icon: "instagram" },
                    { platform: "youtube", url: "#", icon: "youtube" },
                  ]).map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                      aria-label={link.platform}>
                      <SocialIcon icon={link.icon} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold text-sm mb-3">{texts.col2_title}</h4>
              <ul className="space-y-2">
                {col2Links.map((l, i) => (
                  <li key={i}><Link to={l.url} className="text-sm text-background/60 hover:text-background transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold text-sm mb-3">{texts.col3_title}</h4>
              <ul className="space-y-2">
                {col3Links.map((l, i) => (
                  <li key={i}><Link to={l.url} className="text-sm text-background/60 hover:text-background transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="font-bold text-sm mb-3">Companie</h4>
              <ul className="space-y-2">
                {col4Links.map((l, i) => (
                  <li key={i}><Link to={l.url} className="text-sm text-background/60 hover:text-background transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Col 5 - Contact */}
            <div>
              <h4 className="font-bold text-sm mb-3">Contact</h4>
              {texts.col4_show_phone && texts.col4_phone && (
                <div className="flex items-center gap-2 mb-2 text-background/60 text-sm">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{texts.col4_phone}</span>
                </div>
              )}
              {texts.col4_show_email && texts.col4_email && (
                <div className="flex items-center gap-2 mb-2 text-background/60 text-sm">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{texts.col4_email}</span>
                </div>
              )}
              {texts.col4_show_address && texts.col4_address && (
                <div className="flex items-center gap-2 text-background/60 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{texts.col4_address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEO Programmatic Links */}
        <div className="border-t border-background/10 mt-10 pt-6">
          <h4 className="font-bold text-xs mb-2 text-background/60">Lumânări pe orașe</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-4">
            {["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "craiova", "oradea", "sibiu", "arad"].map(city => (
              <Link key={city} to={`/l/${city}/lumanari-parfumate`} className="text-[11px] text-background/40 hover:text-background transition-colors">
                {({"bucuresti":"București","cluj-napoca":"Cluj-Napoca","timisoara":"Timișoara","iasi":"Iași","constanta":"Constanța","brasov":"Brașov","craiova":"Craiova","oradea":"Oradea","sibiu":"Sibiu","arad":"Arad"} as Record<string,string>)[city]}
              </Link>
            ))}
            <Link to="/l" className="text-[11px] text-primary/70 hover:text-primary transition-colors">Toate orașele →</Link>
          </div>
        </div>

        {/* Tax disclaimer */}
        <div className="border-t border-background/10 mt-4 pt-4">
          <p className="text-[11px] text-background/50 text-center mb-4">
            Prețurile sunt finale. Furnizor neplătitor de TVA conform legislației în vigoare.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs text-background/50">{copyrightText}</p>
              {companyInfo.cui && (
                <p className="text-[10px] text-background/40">CUI: {companyInfo.cui} · {companyInfo.reg_com || ""}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-4 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5 [&_a]:text-background/60 [&_a]:hover:text-background [&_a]:transition-colors [&_img]:h-7 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-70 [&_img]:hover:opacity-100 [&_span]:text-sm [&_p]:text-sm [&_div]:contents" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
