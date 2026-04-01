import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { Link } from "react-router-dom";

export default function TermeniSiConditii() {
  usePageSeo({
    title: "Termeni și Condiții | MamaLucica",
    description: "Termenii și condițiile de utilizare a magazinului online MamaLucica — lumânări artizanale handmade.",
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Termeni și Condiții</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert text-foreground/80">
          <p className="text-sm text-muted-foreground mb-4">Ultima actualizare: 1 aprilie 2026</p>

          <h2>1. Informații generale</h2>
          <p>
            Prezentul document stabilește termenii și condițiile de utilizare a magazinului online
            MamaLucica (denumit în continuare „Magazinul"), accesibil la adresa mamalucica.ro.
            Prin accesarea și utilizarea Magazinului, confirmi că ai citit, înțeles și acceptat
            acești termeni în integralitate.
          </p>

          <h2>2. Definiții</h2>
          <ul>
            <li><strong>Vânzător</strong> — operatorul magazinului online MamaLucica</li>
            <li><strong>Cumpărător</strong> — orice persoană fizică sau juridică ce plasează o comandă</li>
            <li><strong>Produs</strong> — orice lumânare artizanală, accesoriu sau articol oferit spre vânzare</li>
            <li><strong>Comandă</strong> — documentul electronic prin care Cumpărătorul achiziționează Produse</li>
          </ul>

          <h2>3. Produse și prețuri</h2>
          <ul>
            <li>Toate produsele sunt lumânări artizanale, realizate manual din ingrediente naturale.</li>
            <li>Prețurile afișate sunt prețuri finale (furnizor neplătitor de TVA, conform legislației în vigoare).</li>
            <li>Ne rezervăm dreptul de a modifica prețurile fără notificare prealabilă; comenzile plasate anterior rămân la prețul din momentul confirmării.</li>
            <li>Imaginile produselor sunt cu titlu informativ; pot exista mici diferențe de culoare sau textură, specifice produselor handmade.</li>
          </ul>

          <h2>4. Plasarea comenzii</h2>
          <p>
            Prin plasarea unei comenzi, confirmi că informațiile furnizate sunt corecte și complete.
            Comanda reprezintă un contract de vânzare-cumpărare la distanță, reglementat de OG 130/2000
            și OUG 34/2014 privind drepturile consumatorilor.
          </p>
          <p>
            Vom confirma primirea comenzii prin email. Ne rezervăm dreptul de a refuza comenzi
            în cazuri justificate (stoc insuficient, suspiciune de fraudă).
          </p>

          <h2>5. Modalități de plată</h2>
          <ul>
            <li>Card bancar (Visa, Mastercard) — procesare securizată</li>
            <li>Transfer bancar</li>
            <li>Plată în rate (Mokka, TBI, PayPo — unde disponibil)</li>
            <li>Ramburs la livrare (unde disponibil)</li>
          </ul>

          <h2>6. Livrare</h2>
          <ul>
            <li>Livrăm pe teritoriul României și internațional (verifică disponibilitatea).</li>
            <li>Termenul estimat de livrare este de 2-5 zile lucrătoare pentru comenzi în România.</li>
            <li>Costurile de livrare sunt afișate în coș, înainte de finalizarea comenzii.</li>
            <li>Livrarea gratuită se aplică pentru comenzi peste pragul afișat pe site.</li>
          </ul>

          <h2>7. Dreptul de retragere</h2>
          <p>
            Conform OUG 34/2014, ai dreptul de a te retrage din contract în termen de 14 zile
            calendaristice de la primirea produsului, fără a indica motive. Pentru detalii complete,
            consultă <Link to="/politica-de-retur" className="text-primary hover:underline">Politica de Retur</Link>.
          </p>

          <h2>8. Garanție și conformitate</h2>
          <p>
            Produsele noastre sunt realizate manual cu grijă deosebită. Dacă primești un produs
            deteriorat sau neconform, te rugăm să ne contactezi în termen de 48 de ore de la livrare
            la contact@mamalucica.ro cu fotografii ale produsului.
          </p>

          <h2>9. Proprietate intelectuală</h2>
          <p>
            Toate conținuturile site-ului (texte, imagini, logo-uri, design) sunt proprietatea
            MamaLucica și sunt protejate de legislația privind drepturile de autor. Reproducerea
            fără acord scris este interzisă.
          </p>

          <h2>10. Limitarea răspunderii</h2>
          <ul>
            <li>Nu răspundem pentru întârzieri cauzate de furnizorul de curierat.</li>
            <li>Nu răspundem pentru utilizarea incorectă a produselor (consultă ghidul de îngrijire).</li>
            <li>Răspunderea noastră este limitată la valoarea comenzii.</li>
          </ul>

          <h2>11. Protecția datelor</h2>
          <p>
            Datele tale personale sunt prelucrate conform <Link to="/politica-de-confidentialitate" className="text-primary hover:underline">Politicii de Confidențialitate</Link> și
            legislației GDPR aplicabile.
          </p>

          <h2>12. Litigii</h2>
          <p>
            Orice litigiu se va soluționa pe cale amiabilă. În cazul în care acest lucru nu este
            posibil, litigiul va fi soluționat de instanțele competente din România. Poți depune
            și o plângere pe platforma europeană de soluționare online a litigiilor (SOL):{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary">
              ec.europa.eu/consumers/odr
            </a>.
          </p>

          <h2>13. Modificări</h2>
          <p>
            Ne rezervăm dreptul de a modifica acești termeni. Versiunea actualizată va fi
            publicată pe această pagină. Continuarea utilizării site-ului după publicare
            constituie acceptarea modificărilor.
          </p>
        </div>
      </div>
    </Layout>
  );
}
