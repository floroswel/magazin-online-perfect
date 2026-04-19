import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Clock } from "lucide-react";

export default function HeaderTopBar() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [schedule, setSchedule] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", ["contact_phone", "contact_email", "contact_schedule"]);
      data?.forEach((r: any) => {
        const v = typeof r.value_json === "string" ? r.value_json.replace(/^"|"$/g, "") : r.value_json;
        if (r.key === "contact_phone") setPhone(v);
        if (r.key === "contact_email") setEmail(v);
        if (r.key === "contact_schedule") setSchedule(v);
      });
    })();
  }, []);

  return (
    <div className="hidden md:block border-b border-border/40 bg-card">
      <div className="ml-container flex items-center justify-between h-9 text-xs text-muted-foreground">
        <div className="flex items-center gap-5">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Phone className="h-3 w-3" /> {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Mail className="h-3 w-3" /> {email}
            </a>
          )}
          {schedule && (
            <span className="hidden lg:flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {schedule}
            </span>
          )}
        </div>
        <nav className="flex items-center gap-5">
          <Link to="/track" className="hover:text-foreground transition-colors">Urmărire comandă</Link>
          <Link to="/page/livrare" className="hover:text-foreground transition-colors">Livrare</Link>
          <Link to="/page/politica-retur" className="hover:text-foreground transition-colors">Retur</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
