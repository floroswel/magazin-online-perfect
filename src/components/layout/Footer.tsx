import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Facebook, Instagram, Youtube, Clock, MapPin, Phone } from "lucide-react";
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
  col1_title: "VENTUZA", col1_description: "Lumânări handmade din ceară naturală, realizate cu pasiune în România.",
  col2_title: "Colecții", col2_links: [],
  col3_title: "Informații", col3_links: [],
  col4_title: "Contact", col4_email: "", col4_phone: "", col4_address: "", col4_hours: "",
  col4_show_email: true, col4_show_phone: true, col4_show_address: true, col4_show_hours: true,
  copyright: "© {year} VENTUZA. Toate drepturile rezervate.", extra_legal: "", show_made_in: true,
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [texts, setTexts] = useState<FooterTexts>(DEFAULTS);

  useEffect(() => {
    supabase.from("app_settings").select("key, value_json")
      .in("key", ["footer_social_links", "footer_texts"])
      .then(({ data }) => {
        data?.forEach(row => {
          if (row.key === "footer_social_links" && Array.isArray(row.value_json))
            setSocialLinks(row.value_json as unknown as SocialLink[]);
          if (row.key === "footer_texts" && row.value_json && typeof row.value_json === "object" && !Array.isArray(row.value_json))
            setTexts(prev => ({ ...prev, ...(row.value_json as any) }));
        });
      });
  }, []);

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
    <footer className="bg-card text-foreground mt-auto">
      {/* Divider */}
      <div className="ventuza-divider" />

      <div className="container py-10 md:py-16 px-5">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-2xl font-semibold tracking-[0.08em] mb-4 text-ventuza-gold">{texts.col1_title || "VENTUZA"}</h3>
            <p className="text-sm text-secondary-foreground/60 leading-relaxed mb-6">{texts.col1_description}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 border border-secondary-foreground/20 hover:border-ventuza-gold hover:text-ventuza-gold flex items-center justify-center transition-colors"
                    aria-label={link.platform}>
                    <SocialIcon icon={link.icon} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-secondary-foreground/40 mb-5">{texts.col2_title}</h4>
            <ul className="space-y-3">
              {col2Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="text-sm text-secondary-foreground/60 hover:text-ventuza-gold transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-secondary-foreground/40 mb-5">{texts.col3_title}</h4>
            <ul className="space-y-3">
              {col3Links.map((l, i) => (
                <li key={i}><Link to={l.url} className="text-sm text-secondary-foreground/60 hover:text-ventuza-gold transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.2em] uppercase text-secondary-foreground/40 mb-5">Newsletter</h4>
            <p className="text-sm text-secondary-foreground/60 mb-4">Primește -10% la prima comandă și noutăți despre colecții.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex">
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-transparent border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/30 rounded-none flex-1" required />
                <Button type="submit" size="icon" disabled={loading} className="shrink-0 bg-ventuza-gold hover:bg-ventuza-gold-light text-secondary rounded-none w-10">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={gdprConsent} onChange={e => setGdprConsent(e.target.checked)} className="mt-0.5 rounded-sm border-secondary-foreground/30" />
                <span className="text-[11px] text-secondary-foreground/40">Sunt de acord să primesc emailuri.</span>
              </label>
            </form>
            <div className="mt-6 space-y-2 text-sm text-secondary-foreground/50">
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

        {/* Legal badges */}
        <div className="border-t border-secondary-foreground/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-secondary-foreground/40">{copyrightText}</p>
            {texts.show_made_in && (
              <p className="text-xs text-secondary-foreground/40 tracking-wide">Handmade cu dragoste în România 🇷🇴</p>
            )}
            <div className="flex items-center gap-4">
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-80 transition-opacity">
                <img src="/images/eu-sol.png" alt="ANPC SAL" className="h-8 object-contain" loading="lazy" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
