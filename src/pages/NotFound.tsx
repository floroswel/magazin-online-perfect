import { Link } from "react-router-dom";
import { usePageSeo } from "@/components/SeoHead";

export default function NotFound() {
  usePageSeo({ title: "404 — Pagina nu a fost găsită | Mama Lucica", noindex: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <p className="text-7xl mb-6">🕯️</p>
      <h1 className="text-4xl font-display text-foreground mb-3">Pagina s-a stins...</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        Nu am găsit ce căutai. Hai să te ducem înapoi la atelierul nostru de lumânări.
      </p>
      <Link
        to="/"
        className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-sm font-semibold text-sm tracking-wide hover:opacity-90 transition-opacity"
      >
        ← Înapoi la magazin
      </Link>
    </div>
  );
}
