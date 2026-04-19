import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import SeoHead from "@/components/SeoHead";
import { Skeleton } from "@/components/ui/skeleton";

interface CmsPageData {
  title: string;
  body_html: string | null;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}

export default function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CmsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setPage(null);
    (async () => {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("title, body_html, meta_title, meta_description, updated_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as CmsPageData);
      }
      setLoading(false);
    })();
  }, [slug]);

  return (
    <StorefrontLayout>
      {page && (
        <SeoHead
          title={page.meta_title || page.title}
          description={page.meta_description || undefined}
        />
      )}
      <main className="container max-w-4xl mx-auto px-4 py-10 md:py-16">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        )}

        {!loading && notFound && (
          <div className="text-center py-20">
            <h1 className="text-3xl font-serif mb-3">Pagină inexistentă</h1>
            <p className="text-muted-foreground mb-6">
              Pagina <code className="px-2 py-0.5 bg-muted rounded">/page/{slug}</code> nu a fost găsită.
            </p>
            <Link to="/" className="text-primary underline">Înapoi la pagina principală</Link>
          </div>
        )}

        {!loading && page && (
          <article>
            <header className="mb-8 pb-6 border-b">
              <h1 className="text-3xl md:text-4xl font-serif text-foreground">{page.title}</h1>
              <p className="text-xs text-muted-foreground mt-2">
                Ultima actualizare: {new Date(page.updated_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </header>
            <div
              className="prose prose-neutral max-w-none prose-headings:font-serif prose-h1:hidden prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-li:my-1 prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: page.body_html || "" }}
            />
          </article>
        )}
      </main>
    </StorefrontLayout>
  );
}
