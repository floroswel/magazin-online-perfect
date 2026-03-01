import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Adresa de email nu este validă").max(255);

interface FooterPage { title: string; slug: string; placement: string }
interface LegalBadge { title: string; url: string; image: string; description?: string }

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [badges, setBadges] = useState<LegalBadge[]>([]);

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
      .select("value_json")
      .eq("key", "footer_legal_badges")
      .single()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json)) {
          setBadges(data.value_json as unknown as LegalBadge[]);
        }
      });
  }, []);

  const infoPages = pages.filter(p => p.placement === "footer_info");
  const helpPages = pages.filter(p => p.placement === "footer_help");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: result.data });

    if (error) {
      if (error.code === "23505") {
        toast.info("Ești deja abonat la newsletter!");
      } else {
        toast.error("Eroare la abonare. Încearcă din nou.");
      }
    } else {
      toast.success("Te-ai abonat cu succes la newsletter! 🎉");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-emag-yellow">🛒 MegaShop</h3>
            <p className="text-sm text-white/70">Cel mai mare magazin online din România cu mii de produse la prețuri imbatabile.</p>
          </div>
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
          <div>
            <h4 className="font-semibold mb-3">Newsletter</h4>
            <p className="text-sm text-white/70 mb-3">Primește oferte exclusive și noutăți direct pe email.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
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
            </form>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>📞 0800 123 456</p>
              <p>✉️ contact@megashop.ro</p>
            </div>
          </div>
        </div>
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
          <p className="text-center text-[11px] text-white/40">© 2026 MegaShop. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
}
