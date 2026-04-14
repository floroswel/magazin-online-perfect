import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";

export default function NotFound() {
  usePageSeo({ title: "404 — Pagina nu a fost găsită | Mama Lucica", noindex: true });
  return (
    <Layout>
      <div className="ml-container py-20 text-center">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-3xl font-extrabold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Pagina pe care o cauți nu există</p>
        <Link to="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-sm hover:bg-ml-primary-dark">← Înapoi acasă</Link>
      </div>
    </Layout>
  );
}