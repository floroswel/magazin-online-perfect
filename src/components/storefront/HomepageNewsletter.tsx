import FooterNewsletter from "./footer/FooterNewsletter";

export default function HomepageNewsletter() {
  return (
    <section style={{ background: "#1f1f1f" }}>
      <div className="ml-container py-12 grid grid-cols-1 lg:grid-cols-[1fr_420px] items-center gap-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Primește 10% reducere la prima comandă</h2>
          <p className="text-sm text-gray-400">Abonează-te la newsletter și fii primul care află despre noutăți și oferte exclusive.</p>
        </div>
        <FooterNewsletter />
      </div>
    </section>
  );
}
