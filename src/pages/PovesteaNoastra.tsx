import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";

export default function PovesteaNoastra() {
  return (
    <Layout>
      <div className="container py-10 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">🕯️ Povestea VENTUZA</h1>
          <p className="text-lg text-muted-foreground mt-2">De la pasiune la parfumuri care transformă fiecare moment</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-foreground">Cum a început totul</h2>
            <p className="text-muted-foreground leading-relaxed">
              VENTUZA s-a născut dintr-o pasiune simplă: dorința de a crea ceva frumos, cu mâinile proprii, din ingrediente naturale. 
              Totul a început acasă, în bucătărie, cu primele experimente cu ceară de soia și uleiuri esențiale. 
              Astăzi, fiecare lumânare VENTUZA poartă aceeași dragoste și atenție la detalii din primele zile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">Ingredientele noastre</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: "🌱", title: "Ceară de soia 100%", desc: "Naturală, vegană, biodegradabilă. Arde mai curat și mai îndelungat decât ceara de parafină." },
                { icon: "🌸", title: "Parfumuri premium", desc: "Uleiuri de parfumerie de calitate superioară, fără ftalați, sigure pentru sănătate." },
                { icon: "🧵", title: "Fitiluri din bumbac", desc: "Fitiluri din bumbac natural, fără plumb, pentru o ardere curată și stabilă." },
              ].map((item, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="font-semibold text-foreground mt-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">Valorile noastre</h2>
            <div className="space-y-3">
              {[
                { v: "🌿 Natural", d: "Folosim doar ingrediente naturale, fără chimicale sintetice sau adăugat artificial." },
                { v: "✋ Handmade", d: "Fiecare lumânare este turnată manual, cu atenție la fiecare detaliu." },
                { v: "♻️ Sustenabil", d: "Ambalaje reciclabile, producție locală, impact minim asupra mediului." },
                { v: "❤️ Cu suflet", d: "Punem pasiune în fiecare produs, de la concept la ambalare." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg">{item.v.split(" ")[0]}</span>
                  <div>
                    <p className="font-semibold text-foreground">{item.v.split(" ").slice(1).join(" ")}</p>
                    <p className="text-sm text-muted-foreground">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">Echipa</h2>
            <p className="text-muted-foreground leading-relaxed">
              VENTUZA este o afacere de suflet, creată cu pasiune și dedicare. 
              Fiecare lumânare trece prin mâinile noastre cu grijă și atenție, de la selectarea ingredientelor până la ambalarea finală.
            </p>
          </section>

          <section className="text-center">
            <h2 className="text-xl font-bold text-foreground">📍 Realizat în București, România</h2>
            <p className="text-muted-foreground mt-2">
              Cu mândrie producem local, susținem economia românească și livrăm în toată țara.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="#" className="text-primary hover:underline text-sm">📱 TikTok</a>
              <a href="#" className="text-primary hover:underline text-sm">📸 Instagram</a>
              <a href="#" className="text-primary hover:underline text-sm">📘 Facebook</a>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
