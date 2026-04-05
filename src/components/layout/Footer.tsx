import { Link } from "react-router-dom";
import { useEditableContent } from "@/hooks/useEditableContent";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FOOTER_LINKS_COL1 = [
  { label: "Despre noi", to: "/despre-noi" },
  { label: "Blog", to: "/blog" },
  { label: "Recenzii", to: "/recenzii" },
  { label: "Contact", to: "/contact" },
];

const FOOTER_LINKS_COL2 = [
  { label: "Cum comand?", to: "/faq" },
  { label: "Livrare și retur", to: "/politica-de-retur" },
  { label: "Garanții", to: "/page/garantie" },
  { label: "FAQ", to: "/faq" },
  { label: "Termeni și condiții", to: "/termeni-si-conditii" },
];

export default function Footer() {
  const content = useEditableContent();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await supabase.from("subscribers" as any).insert({ email });
    setLoading(false);
    setEmail("");
    toast.success("Te-ai abonat cu succes!");
  };

  return (
    <footer>
      {/* Newsletter strip */}
      <div className="bg-primary py-4">
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-primary-foreground text-sm md:text-base font-bold">
            📧 Abonează-te pentru oferte exclusive
          </span>
          <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email-ul tău..."
              className="h-9 px-3 text-sm rounded-md bg-card text-foreground flex-1 sm:w-64 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 bg-destructive text-destructive-foreground text-sm font-bold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Abonează-te
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-[#1A2332] py-10 md:py-12">
        <div className="lumax-container grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-2xl font-black text-white mb-1">LUMAX</h3>
            <p className="text-sm text-gray-400 mb-3">
              Magazinul tău de încredere din România
            </p>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-lumax-yellow text-sm">★★★★★</span>
              <span className="text-xs text-white">1000+ clienți mulțumiți</span>
            </div>
            <div className="flex gap-2">
              {["FB", "IG", "TT", "YT"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold hover:bg-primary transition-colors"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Info links */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">
              Informații
            </h4>
            <ul className="space-y-1.5">
              {FOOTER_LINKS_COL1.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[13px] text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">
              Ajutor
            </h4>
            <ul className="space-y-1.5">
              {FOOTER_LINKS_COL2.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[13px] text-gray-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-white uppercase tracking-widest mb-4">
              Contact
            </h4>
            <div className="space-y-2 text-[13px] text-gray-400">
              <p>📞 {content.header_topbar.phone || "0800-123-456"}</p>
              <p>✉️ {content.store_general.store_email}</p>
              <p>📍 București, România</p>
              <p>⏰ Luni - Vineri, 9:00 - 17:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#111] py-3.5 border-t border-white/5">
        <div className="lumax-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            © {new Date().getFullYear()} LUMAX SRL. Toate drepturile rezervate.
          </span>
          <div className="flex items-center gap-3">
            <img src="/images/eu-sol.png" alt="SOL" className="h-6 opacity-60" />
          </div>
          <span className="text-xs text-gray-500">
            Visa · Mastercard · Netopia
          </span>
        </div>
      </div>
    </footer>
  );
}
