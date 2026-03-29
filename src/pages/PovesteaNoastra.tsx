import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";

export default function PovesteaNoastra() {
  usePageSeo({
    title: "Povestea MamaLucica — Lumânări Artizanale din România",
    description: "Descoperă cum a început MamaLucica și pasiunea noastră pentru lumânări artizanale din ingrediente naturale.",
  });
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground py-16 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-4 font-medium">Despre Noi</p>
          <h1 className="font-serif text-3xl md:text-5xl font-medium leading-tight mb-6">Povestea MamaLucica</h1>
          <p className="text-secondary-foreground/60 text-base md:text-lg leading-relaxed">
            De la pasiune la parfumuri care transformă fiecare moment
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto py-12 md:py-24 px-4 space-y-16 md:space-y-20">
        <section>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Cum a Început</p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-6">O Pasiune Născută Acasă</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            MamaLucica s-a născut dintr-o pasiune simplă: dorința de a crea ceva frumos, cu mâinile proprii, din ingrediente naturale. 
            Totul a început acasă, în bucătărie, cu primele experimente cu ceară de soia și uleiuri esențiale. 
            Astăzi, fiecare lumânare MamaLucica poartă aceeași dragoste și atenție la detalii din primele zile.
          </p>
        </section>

        <div className="border-t border-border my-8" />

        <section>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Ingrediente</p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-10">Ce Folosim</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Ceară de Soia 100%", desc: "Naturală, vegană, biodegradabilă. Arde mai curat și mai îndelungat decât ceara de parafină." },
              { title: "Parfumuri Premium", desc: "Uleiuri de parfumerie de calitate superioară, fără ftalați, sigure pentru sănătate." },
              { title: "Fitiluri din Bumbac", desc: "Fitiluri din bumbac natural, fără plumb, pentru o ardere curată și stabilă." },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 border border-border">
                <span className="font-serif text-3xl font-light text-primary/30 block mb-4">0{i + 1}</span>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-border my-8" />

        <section>
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Principii</p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-10">Valorile Noastre</h2>
          <div className="space-y-8">
            {[
              { v: "Natural", d: "Folosim doar ingrediente naturale, fără chimicale sintetice sau adăugat artificial." },
              { v: "Handmade", d: "Fiecare lumânare este turnată manual, cu atenție la fiecare detaliu." },
              { v: "Sustenabil", d: "Ambalaje reciclabile, producție locală, impact minim asupra mediului." },
              { v: "Cu Suflet", d: "Punem pasiune în fiecare produs, de la concept la ambalare." },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <span className="font-serif text-3xl font-light text-primary/30 shrink-0">0{i + 1}</span>
                <div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-1">{item.v}</h3>
                  <p className="text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-border my-8" />

        <section className="text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 font-medium">Angajament</p>
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-6">Promisiunea Noastră</h2>
          <p className="text-muted-foreground leading-relaxed text-lg max-w-xl mx-auto">
            Fiecare lumânare MamaLucica este o mică operă de artă. Promitem să folosim mereu ingrediente naturale, 
            să respectăm mediul și să creăm produse care aduc bucurie în fiecare casă.
          </p>
          <p className="text-xs text-primary tracking-wide mt-8">Handmade cu dragoste în România 🇷🇴</p>
        </section>
      </div>
    </Layout>
  );
}
