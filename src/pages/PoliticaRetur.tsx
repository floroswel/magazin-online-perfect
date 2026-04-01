import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { Link } from "react-router-dom";

export default function PoliticaRetur() {
  usePageSeo({
    title: "Politica de Retur | MamaLucica",
    description: "Returnează produsele în 14 zile conform OUG 34/2014. Detalii despre procesul de retur MamaLucica.",
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Politica de Retur</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert text-foreground/80">
          <p className="text-sm text-muted-foreground mb-4">Ultima actualizare: 1 aprilie 2026</p>

          <h2>1. Dreptul de retragere (14 zile)</h2>
          <p>
            Conform <strong>OUG 34/2014</strong> privind drepturile consumatorilor în cadrul
            contractelor încheiate la distanță, ai dreptul de a te retrage din contract în
            termen de <strong>14 zile calendaristice</strong> de la data primirii produsului,
            fără a fi necesar să justifici decizia și fără a suporta alte costuri decât cele
            de returnare a produselor.
          </p>

          <h2>2. Condiții pentru retur</h2>
          <p>Pentru ca returul să fie acceptat, produsele trebuie:</p>
          <ul>
            <li>Să fie în starea originală, nefolosite și nedeteriorate</li>
            <li>Să fie în ambalajul original, intact</li>
            <li>Să fie însoțite de factura sau dovada achiziției</li>
            <li>Să fie trimise în termen de 14 zile de la primire</li>
          </ul>

          <div className="bg-muted/50 border border-border rounded-lg p-4 my-4">
            <p className="font-semibold text-foreground mb-2">⚠️ Excepții de la dreptul de retragere</p>
            <p>Conform art. 16 din OUG 34/2014, dreptul de retragere NU se aplică pentru:</p>
            <ul className="mb-0">
              <li>Produse personalizate (lumânări cu text/design la comandă)</li>
              <li>Produse sigilate care nu pot fi returnate din motive de igienă, dacă sigiliul a fost rupt</li>
              <li>Produse care, prin natura lor, se pot deteriora sau expiră rapid</li>
            </ul>
          </div>

          <h2>3. Cum soliciți un retur</h2>
          <ol>
            <li>
              <strong>Notifică-ne</strong> — Trimite un email la <strong>contact@mamalucica.ro</strong> sau
              completează formularul de retur din <Link to="/account" className="text-primary hover:underline">contul tău</Link>,
              menționând numărul comenzii și produsele pe care dorești să le returnezi.
            </li>
            <li>
              <strong>Confirmarea</strong> — Vei primi un email de confirmare cu instrucțiuni
              de returnare și adresa de expediere în termen de 2 zile lucrătoare.
            </li>
            <li>
              <strong>Expediază produsele</strong> — Ambalează produsele în siguranță și
              trimite-le prin curier în termen de 14 zile de la notificare.
            </li>
            <li>
              <strong>Verificarea</strong> — La primire, vom verifica starea produselor
              în termen de 5 zile lucrătoare.
            </li>
          </ol>

          <h2>4. Rambursarea</h2>
          <ul>
            <li>Rambursarea se efectuează în termen de <strong>maximum 14 zile</strong> de la
              primirea produselor returnate.</li>
            <li>Suma va fi returnată folosind aceeași metodă de plată utilizată la achiziție.</li>
            <li>Costurile de livrare inițiale sunt rambursate doar dacă returnezi toate
              produsele din comandă.</li>
            <li>Costurile de returnare (expediere) sunt suportate de cumpărător, cu excepția
              cazurilor în care produsul este defect sau neconform.</li>
          </ul>

          <h2>5. Produse defecte sau neconforme</h2>
          <p>
            Dacă ai primit un produs deteriorat, defect sau diferit de cel comandat:
          </p>
          <ul>
            <li>Contactează-ne în termen de <strong>48 de ore</strong> de la primirea coletului</li>
            <li>Trimite fotografii clare ale produsului și ambalajului</li>
            <li>Vom suporta integral costurile de returnare și vom trimite un produs nou
              sau vom efectua rambursarea completă</li>
          </ul>

          <h2>6. Formularul de retragere</h2>
          <div className="bg-muted/50 border border-border rounded-lg p-4 my-4">
            <p className="font-semibold text-foreground mb-2">Model de formular de retragere</p>
            <p className="italic text-sm">
              Către MamaLucica,<br /><br />
              Vă notific prin prezenta retragerea mea din contractul privind vânzarea
              următoarelor produse:<br />
              — [denumirea produselor]<br />
              — Comandate la data: [data comenzii]<br />
              — Primite la data: [data primirii]<br />
              — Numele consumatorului: [numele complet]<br />
              — Adresa consumatorului: [adresa]<br />
              — Data: [data completării]<br />
              — Semnătura (doar dacă formularul este transmis pe hârtie)
            </p>
          </div>

          <h2>7. Contact</h2>
          <p>
            Pentru orice întrebări despre procesul de retur, ne poți contacta la:
          </p>
          <ul>
            <li>Email: <strong>contact@mamalucica.ro</strong></li>
            <li>Secțiunea <Link to="/account" className="text-primary hover:underline">Contul Meu → Retururi</Link></li>
          </ul>

          <h2>8. Legislație aplicabilă</h2>
          <p>
            Această politică respectă prevederile <strong>OUG 34/2014</strong> privind drepturile
            consumatorilor în cadrul contractelor încheiate la distanță, transpunere a Directivei
            2011/83/UE, precum și <strong>OG 21/1992</strong> privind protecția consumatorilor.
          </p>
        </div>
      </div>
    </Layout>
  );
}
