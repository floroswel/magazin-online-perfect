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

interface FooterPage { title: string; slug: string; placement: string }
interface LegalBadge { title: string; url: string; image: string; description?: string }
interface SocialLink { platform: string; url: string; icon: string }
interface PaymentMethod { name: string; image: string }
interface DeliveryPartner { name: string; url: string; image: string }
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

export default function Footer() {
  const branding = useStoreBranding();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [badges, setBadges] = useState<LegalBadge[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

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
      .in("key", ["footer_legal_badges", "footer_social_links", "footer_payment_methods", "footer_delivery_partners", "footer_company_info"])
      .then(({ data }) => {
        data?.forEach(row => {
          const val = row.value_json;
          switch (row.key) {
            case "footer_legal_badges":
              if (Array.isArray(val)) setBadges(val as unknown as LegalBadge[]);
              break;
            case "footer_social_links":
              if (Array.isArray(val)) setSocialLinks(val as unknown as SocialLink[]);
              break;
            case "footer_payment_methods":
              if (Array.isArray(val)) setPaymentMethods(val as unknown as PaymentMethod[]);
              break;
            case "footer_delivery_partners":
              if (Array.isArray(val)) setDeliveryPartners(val as unknown as DeliveryPartner[]);
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

  const [gdprConsent, setGdprConsent] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    if (!gdprConsent) {
      toast.error("Trebuie să accepți primirea emailurilor promoționale.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: result.data, source: "footer", consent_at: new Date().toISOString() } as any);

    if (error) {
      if (error.code === "23505") {
        toast.info("Ești deja abonat la newsletter!");
      } else {
        toast.error("Eroare la abonare. Încearcă din nou.");
      }
    } else {
      toast.success("Te-ai abonat cu succes la newsletter! 🎉");
      setEmail("");
      setGdprConsent(false);
      localStorage.setItem("newsletter_subscribed", "1");
    }
    setLoading(false);
  };

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container py-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + Social */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-emag-yellow">{branding.emoji} {branding.name}</h3>
            <p className="text-sm text-white/70 mb-4">{branding.tagline}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                    aria-label={link.platform}
                  >
                    <SocialIcon icon={link.icon} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Info pages */}
          <div>
            <h4 className="font-semibold mb-3">Informații</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {infoPages.length > 0 ? infoPages.map(p => (
                <li key={p.slug}><Link to={`/page/${p.slug}`} className="hover:text-emag-yellow transition-colors">{p.title}</Link></li>
              )) : (
                <>
                  <li><Link to="/page/despre-noi" className="hover:text-emag-yellow transition-colors">Despre noi</Link></li>
                  <li><Link to="/page/contact" className="hover:text-emag-yellow transition-colors">Contact</Link></li>
                  <li><Link to="/page/termeni-si-conditii" className="hover:text-emag-yellow transition-colors">Termeni și condiții</Link></li>
                  <li><Link to="/page/politica-de-confidentialitate" className="hover:text-emag-yellow transition-colors">Politica de confidențialitate</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Help pages */}
          <div>
            <h4 className="font-semibold mb-3">Ajutor</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {helpPages.length > 0 ? helpPages.map(p => (
                <li key={p.slug}><Link to={`/page/${p.slug}`} className="hover:text-emag-yellow transition-colors">{p.title}</Link></li>
              )) : (
                <>
                  <li><Link to="/page/livrare" className="hover:text-emag-yellow transition-colors">Livrare</Link></li>
                  <li><Link to="/page/returnare" className="hover:text-emag-yellow transition-colors">Returnare</Link></li>
                  <li><Link to="/page/garantie" className="hover:text-emag-yellow transition-colors">Garanție</Link></li>
                  <li><Link to="/page/faq" className="hover:text-emag-yellow transition-colors">FAQ</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Newsletter + Contact */}
          <div>
            <h4 className="font-semibold mb-3">Newsletter</h4>
            <p className="text-sm text-white/70 mb-3">Primește oferte exclusive și noutăți direct pe email.</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email-ul tău"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
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
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {branding.phone}</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {branding.email}</p>
              {companyInfo?.working_hours && (
                <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {companyInfo.working_hours}</p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery partners + Payment methods */}
        {(deliveryPartners.length > 0 || paymentMethods.length > 0) && (
          <div className="border-t border-white/10 mt-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {deliveryPartners.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Livrare prin</h4>
                <div className="flex flex-wrap items-center gap-4">
                  {deliveryPartners.map((partner, i) => (
                    <a key={i} href={partner.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 rounded-md px-3 py-2 hover:bg-white/20 transition-colors" title={partner.name}>
                      {partner.image ? (
                        <img src={partner.image} alt={partner.name} className="h-6 w-auto object-contain" />
                      ) : (
                        <span className="text-xs text-white/70 font-medium">{partner.name}</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {paymentMethods.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Metode de plată</h4>
                <div className="flex flex-wrap items-center gap-3">
                  {paymentMethods.map((method, i) => (
                    <div key={i} className="bg-white/10 rounded-md px-3 py-2" title={method.name}>
                      {method.image ? (
                        <img src={method.image} alt={method.name} className="h-6 w-auto object-contain" />
                      ) : (
                        <span className="text-xs text-white/70 font-medium">{method.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal badges */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col items-center gap-4">
          {badges.length > 0 && (
            <div className="w-full max-w-3xl space-y-4">
              <h4 className="font-semibold text-sm text-center">Soluționarea litigiilor</h4>
              <div className="flex flex-wrap justify-center gap-6">
                {badges.map((badge, i) => (
                  <div key={i} className="flex items-start gap-3 max-w-xs">
                    {badge.image && (
                      <a href={badge.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <img src={badge.image} alt={badge.title} className="h-10 w-auto rounded opacity-90 hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      {badge.description && <span>{badge.description} </span>}
                      <a href={badge.url} target="_blank" rel="noopener noreferrer" className="text-emag-yellow hover:underline">
                        {badge.title}
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

          <p className="text-center text-[11px] text-white/40">{branding.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
