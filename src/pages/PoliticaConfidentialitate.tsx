import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";

export default function PoliticaConfidentialitate() {
  usePageSeo({
    title: "Politica de Confidențialitate | MamaLucica",
    description: "Află cum MamaLucica colectează, procesează și protejează datele tale personale, conform GDPR.",
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Politica de Confidențialitate</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert text-foreground/80">
          <p className="text-sm text-muted-foreground mb-4">Ultima actualizare: 1 aprilie 2026</p>

          <h2>1. Cine suntem</h2>
          <p>
            MamaLucica este un magazin online de lumânări artizanale handmade, operat din România.
            Protecția datelor tale personale este o prioritate pentru noi. Această politică explică
            ce date colectăm, de ce le colectăm și cum le protejăm, în conformitate cu Regulamentul
            General privind Protecția Datelor (GDPR — Regulamentul UE 2016/679).
          </p>
          <p><strong>Date de contact:</strong> contact@mamalucica.ro</p>

          <h2>2. Ce date personale colectăm</h2>
          <p>Colectăm următoarele categorii de date personale:</p>
          <ul>
            <li><strong>Date de identificare:</strong> nume, prenume, adresă de email, număr de telefon</li>
            <li><strong>Date de livrare:</strong> adresă completă (stradă, oraș, județ, cod poștal)</li>
            <li><strong>Date de facturare:</strong> nume/denumire, CUI (pentru persoane juridice), adresă</li>
            <li><strong>Date tehnice:</strong> adresă IP, tip browser, sistem de operare, pagini vizitate</li>
            <li><strong>Date de tranzacție:</strong> istoricul comenzilor, produsele achiziționate, sumele plătite</li>
            <li><strong>Preferințe:</strong> produse favorite, preferințe de comunicare, răspunsuri la quiz-uri</li>
          </ul>

          <h2>3. Scopurile prelucrării</h2>
          <p>Datele tale sunt prelucrate pentru:</p>
          <ul>
            <li>Procesarea și livrarea comenzilor tale</li>
            <li>Comunicarea despre statusul comenzilor</li>
            <li>Emiterea facturilor și documentelor fiscale</li>
            <li>Trimiterea de newsletters și oferte promoționale (doar cu consimțământul tău)</li>
            <li>Îmbunătățirea serviciilor și a experienței pe site</li>
            <li>Prevenirea fraudelor și securitatea tranzacțiilor</li>
            <li>Respectarea obligațiilor legale (contabilitate, fiscalitate)</li>
          </ul>

          <h2>4. Temeiul legal al prelucrării</h2>
          <ul>
            <li><strong>Executarea contractului</strong> — pentru procesarea comenzilor</li>
            <li><strong>Consimțământul</strong> — pentru marketing, newsletter, cookies non-esențiale</li>
            <li><strong>Interesul legitim</strong> — pentru îmbunătățirea serviciilor, prevenirea fraudelor</li>
            <li><strong>Obligație legală</strong> — pentru evidențe contabile și fiscale</li>
          </ul>

          <h2>5. Cât timp păstrăm datele</h2>
          <ul>
            <li>Datele de cont — pe durata existenței contului + 30 de zile după ștergere</li>
            <li>Datele comenzilor — 10 ani (obligații fiscale)</li>
            <li>Datele de marketing — până la retragerea consimțământului</li>
            <li>Cookie-uri — conform duratelor specificate în Politica de Cookie-uri</li>
          </ul>

          <h2>6. Cu cine partajăm datele</h2>
          <p>Datele tale pot fi partajate cu:</p>
          <ul>
            <li>Furnizori de servicii de livrare (curierat)</li>
            <li>Procesatori de plăți (Netopia, Mokka, PayPo)</li>
            <li>Furnizori de servicii IT (hosting, email)</li>
            <li>Autorități publice, când legea o impune</li>
          </ul>
          <p>Nu vindem și nu închiriem datele tale personale terților.</p>

          <h2>7. Drepturile tale</h2>
          <p>Conform GDPR, ai următoarele drepturi:</p>
          <ul>
            <li><strong>Dreptul de acces</strong> — poți solicita o copie a datelor tale</li>
            <li><strong>Dreptul la rectificare</strong> — poți corecta datele incorecte</li>
            <li><strong>Dreptul la ștergere</strong> — poți solicita ștergerea datelor („dreptul de a fi uitat")</li>
            <li><strong>Dreptul la restricționarea prelucrării</strong></li>
            <li><strong>Dreptul la portabilitatea datelor</strong></li>
            <li><strong>Dreptul de opoziție</strong> — te poți opune prelucrării în scop de marketing</li>
            <li><strong>Dreptul de a retrage consimțământul</strong> — în orice moment</li>
          </ul>
          <p>
            Pentru exercitarea acestor drepturi, contactează-ne la <strong>contact@mamalucica.ro</strong>.
            Vom răspunde în maximum 30 de zile.
          </p>

          <h2>8. Securitatea datelor</h2>
          <p>
            Implementăm măsuri tehnice și organizatorice adecvate pentru protecția datelor:
            criptare SSL/TLS, acces restricționat pe bază de rol, monitorizare continuă și
            backup-uri regulate.
          </p>

          <h2>9. Plângeri</h2>
          <p>
            Dacă consideri că prelucrarea datelor tale încalcă GDPR, ai dreptul de a depune o plângere
            la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP):
          </p>
          <p>
            <strong>ANSPDCP</strong><br />
            B-dul G-ral Gheorghe Magheru 28-30, Sector 1, București<br />
            Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-primary">www.dataprotection.ro</a>
          </p>

          <h2>10. Modificări</h2>
          <p>
            Ne rezervăm dreptul de a actualiza această politică. Orice modificare va fi publicată
            pe această pagină cu data ultimei actualizări.
          </p>
        </div>
      </div>
    </Layout>
  );
}
