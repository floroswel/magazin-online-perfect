import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import NotFound from "./NotFound";

interface LandingPageData {
  id: string;
  name: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  hero_image: string;
  published: boolean;
  visits: number;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  usePageSeo({
    title: page ? `${page.meta_title || page.name} | Mama Lucica` : "Mama Lucica",
    description: page?.meta_description || "",
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (data) {
        setPage(data as unknown as LandingPageData);
        // Track visit
        await supabase
          .from("landing_pages")
          .update({ visits: ((data as any).visits || 0) + 1 } as any)
          .eq("id", (data as any).id);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="ml-container py-12">
          <div className="h-8 bg-muted rounded w-48 mb-4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (notFound || !page) return <NotFound />;

  return (
    <Layout>
      {page.hero_image && (
        <img
          src={page.hero_image}
          alt={page.name}
          className="w-full max-h-[400px] object-cover"
        />
      )}
      <div className="ml-container py-8 max-w-4xl mx-auto">
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
    </Layout>
  );
}
