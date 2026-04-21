import FooterNewsletter from "./footer/FooterNewsletter";
import { useSettings } from "@/hooks/useSettings";

const unq = (v?: string) => (v || "").replace(/^"|"$/g, "");

export default function HomepageNewsletter() {
  const { settings: s } = useSettings();

  const bg = unq(s.newsletter_bg) || unq(s.footer_bg_color) || "#1f1f1f";
  const title = unq(s.newsletter_title) || "Primește 10% reducere la prima comandă";
  const subtitle = unq(s.newsletter_subtitle) || "Abonează-te la newsletter și fii primul care află despre noutăți și oferte exclusive.";
  const textColor = unq(s.newsletter_text_color) || "#ffffff";

  return (
    <section style={{ background: bg }}>
      <div className="ml-container py-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] items-center gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: textColor }}>{title}</h2>
          <p className="text-sm" style={{ color: `${textColor}99` }}>{subtitle}</p>
        </div>
        <FooterNewsletter />
      </div>
    </section>
  );
}
