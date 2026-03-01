import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().trim().email("Adresa de email nu este validă").max(255);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Despre noi</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Termeni și condiții</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Politica de confidențialitate</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Ajutor</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Livrare</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Returnare</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">Garanție</Link></li>
              <li><Link to="/" className="hover:text-emag-yellow transition-colors">FAQ</Link></li>
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
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm text-white/50">
          © 2026 MegaShop. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  );
}
