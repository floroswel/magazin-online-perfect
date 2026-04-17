import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock, CreditCard, Truck, Shield } from "lucide-react";

interface FooterData {
  company_name: string;
  cui: string;
  reg_com: string;
  capital: string;
  iban: string;
  bank: string;
  address: string;
  email: string;
  phone: string;
  schedule: string;
  facebook: string;
  instagram: string;
  copyright: string;
}

const DEFAULTS: FooterData = {
  company_name: "SC VOMIX GENIUS SRL",
  cui: "43025661",
  reg_com: "J2020000459343",
  capital: "200 RON",
  iban: "RO50BTRLRONCRT0566231601",
  bank: "BANCA TRANSILVANIA S.A.",
  address: "Str. Constructorilor 39, Voievoda, Teleorman",
  email: "contact@mamalucica.ro",
  phone: "+40 743 326 405",
  schedule: "Luni - Vineri, 9:00 - 17:00",
  facebook: "",
  instagram: "",
  copyright: "Mama Lucica",
};

export default function Footer() {
  const [data, setData] = useState<FooterData>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const { data: rows } = await (supabase as any)
        .from("app_settings")
        .select("key, value_json")
        .in("key", [
          "footer_company_name", "footer_cui", "footer_reg_com", "footer_capital_social",
          "company_iban", "company_bank", "footer_address", "footer_email", "footer_phone",
          "contact_schedule", "footer_facebook_url", "footer_instagram_url",
          "footer_copyright_name",
        ]);
      if (!rows?.length) return;
      const map: any = {};
      rows.forEach((r: any) => {
        const v = typeof r.value_json === "string" ? r.value_json.replace(/^"|"$/g, "") : r.value_json;
        map[r.key] = v;
      });
      setData({
        company_name: map.footer_company_name || DEFAULTS.company_name,
        cui: map.footer_cui || DEFAULTS.cui,
        reg_com: map.footer_reg_com || DEFAULTS.reg_com,
        capital: map.footer_capital_social || DEFAULTS.capital,
        iban: map.company_iban || DEFAULTS.iban,
        bank: map.company_bank || DEFAULTS.bank,
        address: map.footer_address || DEFAULTS.address,
        email: map.footer_email || DEFAULTS.email,
        phone: map.footer_phone || DEFAULTS.phone,
        schedule: map.contact_schedule || DEFAULTS.schedule,
        facebook: map.footer_facebook_url || "",
        instagram: map.footer_instagram_url || "",
        copyright: map.footer_copyright_name || DEFAULTS.copyright,
      });
    })();
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-noir-gradient text-primary-foreground/90">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="ml-container py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Truck, t: "Livrare 24-48h", s: "În toată România" },
            { icon: Shield, t: "Plată sigură", s: "Netopia · Mokka · Ramburs" },
            { icon: CreditCard, t: "Retur 30 zile", s: "Fără întrebări" },
            { icon: Mail, t: "Suport rapid", s: "L-V 9-17" },
          ].map((f) => (
            <div key={f.t} className="flex flex-col items-center gap-1.5">
              <f.icon className="h-6 w-6 text-accent" />
              <p className="text-sm font-medium">{f.t}</p>
              <p className="text-[11px] opacity-60">{f.s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main columns */}
      <div className="ml-container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🕯️</span>
            <span className="font-display text-xl font-medium">Mama Lucica</span>
          </div>
          <p className="text-sm opacity-70 leading-relaxed mb-4">
            Lumânări 100% handmade din ceară de soia, turnate manual cu suflet în România.
          </p>
          <div className="flex items-center gap-3">
            {data.facebook && (
              <a href={data.facebook} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-sm transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {data.instagram && (
              <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-sm transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Magazin */}
        <div>
          <h4 className="font-display text-base mb-4 text-accent">Magazin</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/page/despre-noi" className="hover:text-accent transition-colors">Despre noi</Link></li>
            <li><Link to="/page/termeni-conditii" className="hover:text-accent transition-colors">Termeni și condiții</Link></li>
            <li><Link to="/page/politica-de-confidentialitate" className="hover:text-accent transition-colors">Politica de confidențialitate</Link></li>
            <li><Link to="/page/politica-cookie" className="hover:text-accent transition-colors">Politica cookies</Link></li>
            <li><Link to="/page/politica-retur" className="hover:text-accent transition-colors">Politica de retur</Link></li>
            <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Clienți */}
        <div>
          <h4 className="font-display text-base mb-4 text-accent">Clienți</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/page/livrare" className="hover:text-accent transition-colors">Transport și livrare</Link></li>
            <li><Link to="/page/metode-plata" className="hover:text-accent transition-colors">Metode de plată</Link></li>
            <li><Link to="/page/garantie" className="hover:text-accent transition-colors">Garanția produselor</Link></li>
            <li><Link to="/page/faq" className="hover:text-accent transition-colors">Întrebări frecvente</Link></li>
            <li><Link to="/track" className="hover:text-accent transition-colors">Urmărire comandă</Link></li>
            <li><a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">ANPC</a></li>
          </ul>
        </div>

        {/* Date comerciale */}
        <div>
          <h4 className="font-display text-base mb-4 text-accent">Date comerciale</h4>
          <ul className="space-y-1.5 text-xs opacity-75 leading-relaxed">
            <li className="font-semibold opacity-100">{data.company_name}</li>
            <li>CUI: {data.cui}</li>
            <li>Reg. Com.: {data.reg_com}</li>
            <li>Capital social: {data.capital}</li>
            <li className="pt-2"><MapPin className="h-3 w-3 inline mr-1" /> {data.address}</li>
            <li><Phone className="h-3 w-3 inline mr-1" /> <a href={`tel:${data.phone.replace(/\s/g, "")}`} className="hover:text-accent">{data.phone}</a></li>
            <li><Mail className="h-3 w-3 inline mr-1" /> <a href={`mailto:${data.email}`} className="hover:text-accent">{data.email}</a></li>
            <li><Clock className="h-3 w-3 inline mr-1" /> {data.schedule}</li>
          </ul>
        </div>
      </div>

      {/* ANPC SAL/SOL bar */}
      <div className="border-t border-white/10">
        <div className="ml-container py-5 flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
            <img src="https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sal.svg" alt="ANPC SAL" className="h-12" />
          </a>
          <a href="https://consumer-redress.ec.europa.eu/site-relocation_en?event=main.home2.show&lng=RO" target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
            <img src="https://etamade-com.github.io/anpc-sal-sol-logo/anpc-sol.svg" alt="ANPC SOL" className="h-12" />
          </a>
          <div className="hidden md:block w-px h-10 bg-white/10" />
          <div className="flex items-center gap-3 text-xs opacity-60">
            <span>Plătește sigur cu</span>
            <span className="font-bold tracking-wider">VISA</span>
            <span className="font-bold tracking-wider">MASTERCARD</span>
            <span className="hidden md:inline">· Netopia</span>
            <span className="hidden md:inline">· Mokka</span>
            <span className="hidden md:inline">· Ramburs</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 bg-black/30">
        <div className="ml-container py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs opacity-60">
          <p>© {year} {data.copyright}. Toate drepturile rezervate.</p>
          <p>Made with <span className="text-accent">❤</span> în România</p>
        </div>
      </div>
    </footer>
  );
}
