import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useStoreBranding } from "@/hooks/useStoreBranding";
import { usePageSeo } from "@/components/SeoHead";
import { Loader2 } from "lucide-react";
import DOMPurify from "dompurify";

export default function CmsPage() {
  usePageSeo({ title: "MamaLucica", description: "Magazin de lumânări artizanale handmade." });
  const { slug } = useParams<{ slug: string }>();
  const branding = useStoreBranding();
  const [page, setPage] = useState<{ title: string; body_html: string | null; meta_title: string | null; meta_description: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("cms_pages")
      .select("title, body_html, meta_title, meta_description")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPage(data);
          document.title = data.meta_title || data.title || branding.name;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && data.meta_description) metaDesc.setAttribute("content", data.meta_description);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </Layout>
    );
  }

  if (notFound || !page) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Pagina nu a fost găsită</h1>
          <p className="text-muted-foreground">Această pagină nu există sau nu este publicată.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{page.title}</h1>
        {page.body_html && (
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.body_html) }}
          />
        )}
      </div>
    </Layout>
  );
}
