import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Facebook, Instagram, Youtube, Clock, MapPin, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Adresa de email nu este validă").max(255);

interface SocialLink { platform: string; url: string; icon: string }
interface LogoItem { name: string; image: string; url: string; width: number; active: boolean; target: "_self" | "_blank" }
interface LegalScript { id: string; label: string; sublabel: string; active: boolean; link: string; image: string; width: number; alt: string }
interface FooterLink { label: string; url: string; active: boolean }
interface FooterTexts {
  col1_title: string; col1_description: string;
  col2_title: string; col2_links: FooterLink[];
  col3_title: string; col3_links: FooterLink[];
  col4_title: string; col4_email: string; col4_phone: string; col4_address: string; col4_hours: string;
  col4_show_email: boolean; col4_show_phone: boolean; col4_show_address: boolean; col4_show_hours: boolean;
  copyright: string; extra_legal: string; show_made_in: boolean;
  delivery_section_title: string; payment_section_title: string;
  partners_section_title: string; show_partners_section: boolean;
  legal_section_title: string; sal_sublabel: string; sol_sublabel: string;
}
interface CompanyInfo {
  company_name: string; cui: string; reg_com: string; address: string;
  working_hours: string; app_store_url?: string; google_play_url?: string;
}

const SocialIcon = ({ icon, className }: { icon: string; className?: string }) => {
  switch (icon) {
    case "facebook": return <Facebook className={className} />;
    case "instagram": return <Instagram className={className} />;
    case "youtube": return <Youtube className={className} />;
    case "tiktok": return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>;
    default: return null;
  }
};

const DEFAULTS: FooterTexts = {
  col1_title: "VENTUZA", col1_description: "",
  col2_title: "Navigare", col2_links: [],
  col3_title: "Informații", col3_links: [],
  col4_title: "Contact", col4_email: "", col4_phone: "", col4_address: "", col4_hours: "",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} VENTUZA. Toate drepturile rezervate.",
  extra_legal: "", show_made_in: true,
  delivery_section_title: "Livrare prin", payment_section_title: "Metode de plată",
  partners_section_title: "Parteneri", show_partners_section: false,
  legal_section_title: "Soluționarea litigiilor",
  sal_sublabel: "Soluționarea alternativă a litigiilor – informații pentru consumatori. ANPC – SAL",
  sol_sublabel: "Platforma europeană de soluționare online a litigiilor. SOL – Platformă ODR",
};

export default function Footer() {
  const branding = useStoreBranding();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  // Managed footer state
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [deliveryLogos, setDeliveryLogos] = useState<LogoItem[]>([]);
  const [paymentLogos, setPaymentLogos] = useState<LogoItem[]>([]);
  const [partnerLogos, setPartnerLogos] = useState<LogoItem[]>([]);
  const [legalScripts, setLegalScripts] = useState<LegalScript[]>([]);
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [pages, setPages] = useState<{ title: string; slug: string; placement: string }[]>([]);

  useEffect(() => {
    supabase
      .from("cms_pages")
      .select("title, slug, placement")
      .eq("published", true)
      .in("placement", ["footer_info", "footer_help"])
      .order("title")
      .then(({ data }) => setPages(data || []));

    supabase
      .from("app_settings")
      .select("key, value_json")
      .in("key", [
        "footer_social_links", "footer_delivery_logos", "footer_payment_logos",
        "footer_partner_logos", "footer_legal_scripts", "footer_texts",
        "footer_company_info",
        // Legacy keys
        "footer_delivery_partners", "footer_payment_methods", "footer_legal_badges",
      ])
      .then(({ data }) => {
        if (!data) return;
        const hasNew = (k: string) => data.some(r => r.key === k);
        data.forEach(row => {
          const val = row.value_json;
          switch (row.key) {
            case "footer_social_links":
              if (Array.isArray(val)) setSocialLinks(val as unknown as SocialLink[]);
              break;
            case "footer_delivery_logos":
              if (Array.isArray(val)) setDeliveryLogos(val as unknown as LogoItem[]);
              break;
            case "footer_delivery_partners":
              if (Array.isArray(val) && !hasNew("footer_delivery_logos"))
                setDeliveryLogos((val as any[]).map(v => ({ name: v.name || "", image: v.image || "", url: v.url || "", width: 80, active: true, target: "_blank" as const })));
              break;
            case "footer_payment_logos":
              if (Array.isArray(val)) setPaymentLogos(val as unknown as LogoItem[]);
              break;
            case "footer_payment_methods":
              if (Array.isArray(val) && !hasNew("footer_payment_logos"))
                setPaymentLogos((val as any[]).map(v => ({ name: v.name || "", image: v.image || "", url: "", width: 60, active: true, target: "_self" as const })));
              break;
            case "footer_partner_logos":
              if (Array.isArray(val)) setPartnerLogos(val as unknown as LogoItem[]);
              break;
            case "footer_legal_scripts":
              if (Array.isArray(val)) setLegalScripts(val as unknown as LegalScript[]);
              break;
            case "footer_legal_badges":
              // Legacy: only use if new key not present
              if (Array.isArray(val) && !hasNew("footer_legal_scripts"))
                setLegalScripts((val as any[]).map((b, i) => ({
                  id: `legacy-${i}`, label: b.title || "", sublabel: b.description || "",
                  active: true, link: b.url || "", image: b.image || "", width: 250, alt: b.title || "",
                })));
              break;
            case "footer_texts":
              if (val && typeof val === "object" && !Array.isArray(val)) setTexts(prev => ({ ...prev, ...(val as any) }));
              break;
            case "footer_company_info":
              if (val && typeof val === "object" && !Array.isArray(val)) setCompanyInfo(val as unknown as CompanyInfo);
              break;
          }
        });
      });
  }, []);

  const infoPages = pages.filter(p => p.placement === "footer_info");
  const helpPages = pages.filter(p => p.placement === "footer_help");

  // Use managed links if available, otherwise CMS pages, otherwise defaults
  const col2Links = texts.col2_links.length > 0
    ? texts.col2_links.filter(l => l.active)
    : infoPages.length > 0
    ? infoPages.map(p => ({ label: p.title, url: `/page/${p.slug}`, active: true }))
    : [
        { label: "Despre noi", url: "/povestea-noastra", active: true },
        { label: "Produse", url: "/catalog", active: true },
        { label: "Contact", url: "/page/contact", active: true },
      ];

  const col3Links = texts.col3_links.length > 0
    ? texts.col3_links.filter(l => l.active)
    : helpPages.length > 0
    ? helpPages.map(p => ({ label: p.title, url: `/page/${p.slug}`, active: true }))
    : [
        { label: "Livrare", url: "/page/livrare", active: true },
        { label: "Returnare", url: "/page/returnare", active: true },
        { label: "FAQ", url: "/page/faq", active: true },
      ];

  const activeDelivery = deliveryLogos.filter(l => l.active);
  const activePayment = paymentLogos.filter(l => l.active);
  const activePartners = partnerLogos.filter(l => l.active);
  const activeLegal = legalScripts.filter(s => s.active);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    if (!gdprConsent) { toast.error("Trebuie să accepți primirea emailurilor promoționale."); return; }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: result.data, source: "footer", consent_at: new Date().toISOString() } as any);
    if (error) {
      toast[error.code === "23505" ? "info" : "error"](error.code === "23505" ? "Ești deja abonat!" : "Eroare la abonare.");
    } else {
      toast.success("Te-ai abonat cu succes! 🎉");
      setEmail(""); setGdprConsent(false);
      localStorage.setItem("newsletter_subscribed", "1");
    }
    setLoading(false);
  };

  const copyrightText = texts.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container py-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand + Social */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-emag-yellow">{texts.col1_title || branding.name}</h3>
            <p className="text-sm text-white/70 mb-4">{texts.col1_description || branding.tagline}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                    aria-label={link.platform}>
                    <SocialIcon icon={link.icon} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-semibold mb-3">{texts.col2_title}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {col2Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="hover:text-emag-yellow transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3: Info */}
          <div>
            <h4 className="font-semibold mb-3">{texts.col3_title}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {col3Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="hover:text-emag-yellow transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter + Contact */}
          <div>
            <h4 className="font-semibold mb-3">Newsletter</h4>
            <p className="text-sm text-white/70 mb-3">Primește oferte exclusive și noutăți direct pe email.</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <Input type="email" placeholder="Email-ul tău" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50" required />
                <Button type="submit" size="icon" disabled={loading} className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5 rounded border-white/30" />
                <span className="text-[11px] text-white/60">Sunt de acord să primesc emailuri promoționale.</span>
              </label>
            </form>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {texts.col4_show_phone && (texts.col4_phone || branding.phone) && (
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {texts.col4_phone || branding.phone}</p>
              )}
              {texts.col4_show_email && (texts.col4_email || branding.email) && (
                <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {texts.col4_email || branding.email}</p>
              )}
              {texts.col4_show_hours && (texts.col4_hours || companyInfo?.working_hours) && (
                <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {texts.col4_hours || companyInfo?.working_hours}</p>
              )}
              {texts.col4_show_address && texts.col4_address && (
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {texts.col4_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery + Payment logos */}
        {(activeDelivery.length > 0 || activePayment.length > 0) && (
          <div className="border-t border-white/10 mt-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeDelivery.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{texts.delivery_section_title}</h4>
                <div className="flex flex-wrap items-center gap-4">
                  {activeDelivery.map((logo, i) => {
                    const inner = logo.image
                      ? <img src={logo.image} alt={logo.name} style={{ height: Math.min(logo.width * 0.4, 28) }} className="object-contain" />
                      : <span className="text-xs text-white/70 font-medium">{logo.name}</span>;
                    return logo.url ? (
                      <a key={i} href={logo.url} target={logo.target} rel="noopener noreferrer" className="bg-white/10 rounded-md px-3 py-2 hover:bg-white/20 transition-colors" title={logo.name}>
                        {inner}
                      </a>
                    ) : (
                      <div key={i} className="bg-white/10 rounded-md px-3 py-2" title={logo.name}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            )}
            {activePayment.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{texts.payment_section_title}</h4>
                <div className="flex flex-wrap items-center gap-3">
                  {activePayment.map((logo, i) => (
                    <div key={i} className="bg-white/10 rounded-md px-3 py-2" title={logo.name}>
                      {logo.image
                        ? <img src={logo.image} alt={logo.name} style={{ height: Math.min(logo.width * 0.4, 24) }} className="object-contain" />
                        : <span className="text-xs text-white/70 font-medium">{logo.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Partner logos */}
        {texts.show_partners_section && activePartners.length > 0 && (
          <div className="border-t border-white/10 mt-6 pt-6">
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{texts.partners_section_title}</h4>
            <div className="flex flex-wrap items-center gap-4">
              {activePartners.map((logo, i) => {
                const inner = logo.image
                  ? <img src={logo.image} alt={logo.name} style={{ height: Math.min(logo.width * 0.4, 28) }} className="object-contain" />
                  : <span className="text-xs text-white/70 font-medium">{logo.name}</span>;
                return logo.url ? (
                  <a key={i} href={logo.url} target={logo.target} rel="noopener noreferrer" className="bg-white/10 rounded-md px-3 py-2 hover:bg-white/20 transition-colors" title={logo.name}>
                    {inner}
                  </a>
                ) : (
                  <div key={i} className="bg-white/10 rounded-md px-3 py-2" title={logo.name}>{inner}</div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legal badges (ANPC SAL/SOL) */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col items-center gap-4">
          {activeLegal.length > 0 && (
            <div className="w-full max-w-3xl space-y-4">
              <h4 className="font-semibold text-sm text-center">{texts.legal_section_title}</h4>
              <div className="flex flex-wrap justify-center gap-6">
                {activeLegal.map((script) => (
                  <div key={script.id} className="flex items-start gap-3 max-w-xs">
                    {script.image && (
                      <a href={script.link} target="_blank" rel="noopener noreferrer nofollow" className="shrink-0">
                        <img src={script.image} alt={script.alt} style={{ width: Math.min(script.width, 250) }}
                          className="rounded opacity-90 hover:opacity-100 transition-opacity" loading="lazy" />
                      </a>
                    )}
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      <span>{script.id === "anpc-sal" ? texts.sal_sublabel : script.id === "sol-odr" ? texts.sol_sublabel : script.sublabel} </span>
                      <a href={script.link} target="_blank" rel="noopener noreferrer nofollow" className="text-emag-yellow hover:underline">
                        {script.label}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company info */}
          {companyInfo && (
            <div className="w-full text-center space-y-1 text-[11px] text-white/40">
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {companyInfo.company_name}</span>
                {companyInfo.cui && <span>CUI: {companyInfo.cui}</span>}
                {companyInfo.reg_com && <span>Reg. Com.: {companyInfo.reg_com}</span>}
              </div>
              {companyInfo.address && (
                <p className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> {companyInfo.address}</p>
              )}
            </div>
          )}

          {/* App download */}
          {companyInfo && (companyInfo.app_store_url || companyInfo.google_play_url) && (
            <div className="flex gap-3">
              {companyInfo.google_play_url && (
                <a href={companyInfo.google_play_url} target="_blank" rel="noopener noreferrer">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-10" />
                </a>
              )}
              {companyInfo.app_store_url && (
                <a href={companyInfo.app_store_url} target="_blank" rel="noopener noreferrer">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-10" />
                </a>
              )}
            </div>
          )}

          {/* Copyright */}
          <div className="text-center space-y-1">
            <p className="text-[11px] text-white/40">{copyrightText}</p>
            {texts.extra_legal && <p className="text-[10px] text-white/30">{texts.extra_legal}</p>}
            {texts.show_made_in && <p className="text-[10px] text-white/30">Made with ❤️ în România</p>}
          </div>
        </div>
      </div>
    </footer>
  );
}
