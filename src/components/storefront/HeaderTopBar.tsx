import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Facebook, Instagram, Youtube } from "lucide-react";

const unq = (v: any) => (typeof v === "string" ? v.replace(/^"|"$/g, "") : v);

export default function HeaderTopBar() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fb, setFb] = useState("");
  const [ig, setIg] = useState("");
  const [yt, setYt] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", [
          "contact_phone", "contact_email",
          "footer_facebook_url", "footer_instagram_url", "footer_youtube_url",
        ]);
      data?.forEach((r: any) => {
        const v = unq(r.value_json);
        if (r.key === "contact_phone") setPhone(v);
        if (r.key === "contact_email") setEmail(v);
        if (r.key === "footer_facebook_url") setFb(v);
        if (r.key === "footer_instagram_url") setIg(v);
        if (r.key === "footer_youtube_url") setYt(v);
      });
    })();
  }, []);

  return (
    <div className="hidden md:block journal-topbar">
      <div className="ml-container flex items-center justify-between h-9">
        <div className="flex items-center gap-5 text-[12px]">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Phone className="h-3 w-3" /> {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hidden lg:flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Mail className="h-3 w-3" /> {email}
            </a>
          )}
          <Link to="/contact" className="hidden lg:inline hover:opacity-80 transition-opacity">Contact</Link>
          <Link to="/track" className="hidden lg:inline hover:opacity-80 transition-opacity">Urmărire comandă</Link>
        </div>

        <div className="flex items-center gap-4 text-[12px]">
          <Link to="/page/livrare" className="hover:opacity-80 transition-opacity">Livrare gratuită &gt; 200 lei</Link>
          {(fb || ig || yt) && (
            <div className="flex items-center gap-2 pl-4 border-l border-white/20">
              {fb && <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-80"><Facebook className="h-3.5 w-3.5" /></a>}
              {ig && <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-80"><Instagram className="h-3.5 w-3.5" /></a>}
              {yt && <a href={yt} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:opacity-80"><Youtube className="h-3.5 w-3.5" /></a>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
