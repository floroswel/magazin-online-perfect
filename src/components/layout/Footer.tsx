import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Facebook, Instagram, Youtube, Clock, MapPin, Phone, ShieldCheck, Lock, CreditCard, Truck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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

import React from "react";

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
  col1_title: "VENTUZA", col1_description: "Lumânări handmade din ceară naturală, realizate cu pasiune în România.",
  col2_title: "Colecții", col2_links: [],
  col3_title: "Informații", col3_links: [],
  col4_title: "Contact", col4_email: "", col4_phone: "", col4_address: "", col4_hours: "",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} VENTUZA. Toate drepturile rezervate.", extra_legal: "", show_made_in: true,
};

/* ─── Payment & Shipping icons (SVG inline for speed) ─── */
const PaymentIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    {/* Visa */}
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Visa">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">VISA</span>
    </div>
    {/* Mastercard */}
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Mastercard">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">MC</span>
    </div>
    {/* Apple Pay */}
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Apple Pay">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider"> Pay</span>
    </div>
    {/* Google Pay */}
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Google Pay">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">G Pay</span>
    </div>
    {/* Ramburs */}
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Ramburs">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">Ramburs</span>
    </div>
  </div>
);

const ShippingIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Fan Courier">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">Fan Courier</span>
    </div>
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="Sameday">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">Sameday</span>
    </div>
    <div className="bg-primary-foreground/10 rounded px-2 py-1 flex items-center h-7" title="DPD">
      <span className="text-[10px] font-bold text-primary-foreground/70 tracking-wider">DPD</span>
    </div>
  </div>
);

const TrustBadges = () => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-1.5 text-primary-foreground/60">
      <Lock className="w-3.5 h-3.5" />
      <span className="text-[10px] font-medium">SSL Securizat</span>
    </div>
    <div className="flex items-center gap-1.5 text-primary-foreground/60">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span className="text-[10px] font-medium">GDPR Compliant</span>
    </div>
    <div className="flex items-center gap-1.5 text-primary-foreground/60">
      <CreditCard className="w-3.5 h-3.5" />
      <span className="text-[10px] font-medium">Plăți Securizate</span>
    </div>
    <div className="flex items-center gap-1.5 text-primary-foreground/60">
      <Truck className="w-3.5 h-3.5" />
      <span className="text-[10px] font-medium">Livrare Rapidă</span>
    </div>
  </div>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);
  const [footerScripts, setFooterScripts] = useState<string[]>([]);
  const footerScriptsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("key, value_json")
        .in("key", ["footer_social_links", "footer_texts"]),
      (supabase as any).from("custom_scripts")
        .select("inline_content, content")
        .eq("is_active", true)
        .eq("location", "footer")
        .order("sort_order"),
    ]).then(([settingsRes, scriptsRes]: any[]) => {
      settingsRes.data?.forEach((row: any) => {
        if (row.key === "footer_social_links" && Array.isArray(row.value_json))
          setSocialLinks(row.value_json as unknown as SocialLink[]);
        if (row.key === "footer_texts" && row.value_json && typeof row.value_json === "object" && !Array.isArray(row.value_json))
          setTexts(prev => ({ ...prev, ...(row.value_json as any) }));
      });
      const htmls = (scriptsRes.data || [])
        .map((s: any) => (s.inline_content || s.content || "").trim())
        .filter(Boolean);
      setFooterScripts(htmls);
    });
  }, []);

  // Inject footer script HTML so <script> tags execute
  useEffect(() => {
    if (!footerScriptsRef.current || footerScripts.length === 0) return;
    const container = footerScriptsRef.current;
    container.innerHTML = "";
    footerScripts.forEach(html => {
      const range = document.createRange();
      range.setStart(container, 0);
      const frag = range.createContextualFragment(html);
      container.appendChild(frag);
    });
  }, [footerScripts]);

  const col2Links = texts.col2_links.length > 0 ? texts.col2_links.filter(l => l.active) : [
    { label: "Lumânări Parfumate", url: "/catalog?category=parfumate", active: true },
    { label: "Lumânări Decorative", url: "/catalog?category=decorative", active: true },
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
    if (error) {
      toast[error.code === "23505" ? "info" : "error"](error.code === "23505" ? "Ești deja abonat!" : "Eroare.");
    } else {
      toast.success("Te-ai abonat cu succes!");
      setEmail(""); setGdprConsent(false);
    }
    setLoading(false);
  };

  const copyrightText = texts.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <footer className="bg-[hsl(220,35%,12%)] text-white mt-auto">
      {/* Divider */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container py-10 md:py-16 px-5">
        {/* Main columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-extrabold tracking-tight mb-4 text-primary-foreground">{texts.col1_title || "VENTUZA"}</h3>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">{texts.col1_description}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 border border-primary-foreground/30 hover:border-accent hover:text-accent flex items-center justify-center transition-colors rounded"
                    aria-label={link.platform}>
                    <SocialIcon icon={link.icon} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Col 2 - Colecții */}
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-primary-foreground/60 mb-5">{texts.col2_title}</h4>
            <ul className="space-y-3">
              {col2Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3 - Informații + Suport */}
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-primary-foreground/60 mb-5">{texts.col3_title}</h4>
            <ul className="space-y-3">
              {col3Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="text-sm text-primary-foreground/80 hover:text-accent transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            {/* Legal links */}
            <h4 className="text-xs font-bold tracking-wide uppercase text-primary-foreground/60 mt-6 mb-3">Informații Legale</h4>
            <ul className="space-y-2">
              <li><Link to="/page/termeni-si-conditii" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">Termeni și Condiții</Link></li>
              <li><Link to="/page/politica-confidentialitate" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">Politica de Confidențialitate</Link></li>
              <li><Link to="/page/politica-cookies" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">Politica Cookie</Link></li>
              <li><Link to="/page/politica-retur" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">Politica de Retur</Link></li>
              <li><a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">A.N.P.C. – SAL</a></li>
              <li><a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-xs text-primary-foreground/60 hover:text-accent transition-colors">SOL (ODR)</a></li>
            </ul>
          </div>

          {/* Col 4 - Newsletter + Contact */}
          <div>
            <h4 className="text-xs font-bold tracking-wide uppercase text-primary-foreground/60 mb-5">Newsletter</h4>
            <p className="text-sm text-primary-foreground/70 mb-4">Primește -10% la prima comandă și noutăți despre colecții.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex">
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-l-lg rounded-r-none flex-1" required />
                <Button type="submit" size="icon" disabled={loading} className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground rounded-r-lg rounded-l-none w-10">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5 rounded-sm border-border" />
                <span className="text-[11px] text-primary-foreground/60">Sunt de acord să primesc emailuri.</span>
              </label>
            </form>
            <div className="mt-6 space-y-2 text-sm text-primary-foreground/70">
              {texts.col4_show_phone && texts.col4_phone && (
                <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {texts.col4_phone}</p>
              )}
              {texts.col4_show_email && texts.col4_email && (
                <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {texts.col4_email}</p>
              )}
              {texts.col4_show_hours && texts.col4_hours && (
                <p className="flex items-center gap-2"><Clock className="w-3 h-3" /> {texts.col4_hours}</p>
              )}
              {texts.col4_show_address && texts.col4_address && (
                <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {texts.col4_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* ─── Payment, Shipping, Trust section ─── */}
        <div className="border-t border-primary-foreground/10 mt-10 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment methods */}
            <div>
              <h5 className="text-[10px] font-bold tracking-wide uppercase text-primary-foreground/40 mb-3">Metode de plată</h5>
              <PaymentIcons />
            </div>
            {/* Shipping partners */}
            <div>
              <h5 className="text-[10px] font-bold tracking-wide uppercase text-primary-foreground/40 mb-3">Livrare prin</h5>
              <ShippingIcons />
            </div>
            {/* Trust badges */}
            <div>
              <h5 className="text-[10px] font-bold tracking-wide uppercase text-primary-foreground/40 mb-3">Siguranță</h5>
              <TrustBadges />
            </div>
          </div>
        </div>

        {/* ─── Bottom bar: Copyright + ANPC badges + Company data ─── */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <p className="text-xs text-primary-foreground/60">{copyrightText}</p>
            <div ref={footerScriptsRef} className="inline-flex flex-row flex-wrap items-center gap-2 [&_a]:inline-flex [&_a]:text-[10px] [&_a]:text-primary-foreground/50 [&_a]:hover:text-primary-foreground/80 [&_a]:transition-colors [&_img]:h-5 [&_img]:!w-auto [&_img]:object-contain [&_img]:opacity-60 [&_img]:hover:opacity-90 [&_span]:text-[10px] [&_span]:text-primary-foreground/50 [&_p]:text-[10px] [&_p]:text-primary-foreground/50 [&_div]:contents" />
          </div>
          {/* Company registration data */}
          <p className="text-[10px] text-primary-foreground/40 text-center mt-3">
            S.C. VENTUZA S.R.L. • CUI: RO00000000 • Nr. Reg. Com.: J00/0000/0000 • Sediu: București, România
          </p>
        </div>
      </div>
    </footer>
  );
}
