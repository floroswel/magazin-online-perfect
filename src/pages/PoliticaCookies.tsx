import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { Link } from "react-router-dom";

export default function PoliticaCookies() {
  usePageSeo({
    title: "Politica de Cookie-uri | MamaLucica",
    description: "Informații despre cookie-urile utilizate de MamaLucica și cum le poți gestiona.",
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Politica de Cookie-uri</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert text-foreground/80">
          <p className="text-sm text-muted-foreground mb-4">Ultima actualizare: 1 aprilie 2026</p>

          <h2>1. Ce sunt cookie-urile?</h2>
          <p>
            Cookie-urile sunt fișiere text de dimensiuni mici stocate pe dispozitivul tău
            (computer, telefon, tabletă) atunci când vizitezi un site web. Acestea permit
            site-ului să-ți recunoască dispozitivul și să rețină informații despre vizitele tale.
          </p>

          <h2>2. Ce cookie-uri folosim</h2>

          <h3>2.1 Cookie-uri strict necesare</h3>
          <p>
            Aceste cookie-uri sunt esențiale pentru funcționarea site-ului și nu pot fi dezactivate.
            Ele permit funcții de bază precum navigarea pe site, adăugarea produselor în coș și
            autentificarea în cont.
          </p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Scop</th><th>Durată</th></tr>
            </thead>
            <tbody>
              <tr><td>sb-*-auth-token</td><td>Autentificare utilizator</td><td>Sesiune</td></tr>
              <tr><td>gdpr-consent</td><td>Memorarea preferințelor de cookie</td><td>1 an</td></tr>
            </tbody>
          </table>

          <h3>2.2 Cookie-uri de performanță și analiză</h3>
          <p>
            Aceste cookie-uri ne ajută să înțelegem cum este utilizat site-ul, ce pagini sunt
            cele mai populare și cum putem îmbunătăți experiența de navigare. Folosim Google
            Analytics 4 pentru aceste statistici.
          </p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Furnizor</th><th>Scop</th><th>Durată</th></tr>
            </thead>
            <tbody>
              <tr><td>_ga, _ga_*</td><td>Google Analytics</td><td>Statistici de trafic</td><td>2 ani</td></tr>
            </tbody>
          </table>

          <h3>2.3 Cookie-uri de marketing</h3>
          <p>
            Aceste cookie-uri sunt utilizate pentru a-ți afișa reclame relevante pe alte platforme
            și pentru a măsura eficiența campaniilor noastre publicitare.
          </p>
          <table>
            <thead>
              <tr><th>Cookie</th><th>Furnizor</th><th>Scop</th><th>Durată</th></tr>
            </thead>
            <tbody>
              <tr><td>_fbp, _fbc</td><td>Meta (Facebook Pixel)</td><td>Remarketing, conversii</td><td>90 zile</td></tr>
            </tbody>
          </table>

          <h2>3. Consimțământ</h2>
          <p>
            La prima vizită pe site, ți se va afișa un banner de consimțământ pentru cookie-uri.
            Cookie-urile de performanță și marketing sunt activate <strong>doar după ce îți dai
            acordul explicit</strong>. Cookie-urile strict necesare funcționează fără consimțământ,
            deoarece sunt esențiale pentru funcționarea site-ului.
          </p>
          <p>
            Poți modifica preferințele oricând ștergând cookie-ul <code>gdpr-consent</code> din browser,
            ceea ce va reactiva banner-ul de consimțământ la următoarea vizită.
          </p>

          <h2>4. Cum poți controla cookie-urile</h2>
          <p>Poți gestiona cookie-urile prin:</p>
          <ul>
            <li><strong>Banner-ul de consimțământ</strong> — apare la prima vizită pe site</li>
            <li><strong>Setările browser-ului</strong> — poți bloca sau șterge cookie-urile din setările browser-ului tău</li>
            <li><strong>Instrumente terțe</strong> — extensii de browser pentru gestionarea cookie-urilor</li>
          </ul>
          <p>
            Dezactivarea cookie-urilor esențiale poate afecta funcționalitatea site-ului
            (de exemplu, nu vei putea adăuga produse în coș sau te autentifica).
          </p>

          <h2>5. Linkuri utile per browser</h2>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/ro/kb/activarea-si-dezactivarea-cookie-urilor" target="_blank" rel="noopener noreferrer" className="text-primary">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/ro-ro/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary">Safari</a></li>
            <li><a href="https://support.microsoft.com/ro-ro/microsoft-edge/ștergerea-cookie-urilor-în-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary">Microsoft Edge</a></li>
          </ul>

          <h2>6. Mai multe informații</h2>
          <p>
            Pentru informații suplimentare despre cum protejăm datele tale, consultă{" "}
            <Link to="/politica-de-confidentialitate" className="text-primary hover:underline">Politica de Confidențialitate</Link>.
          </p>
          <p>Contact: <strong>contact@mamalucica.ro</strong></p>
        </div>
      </div>
    </Layout>
  );
}
