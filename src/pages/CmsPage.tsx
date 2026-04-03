import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useEditableContent } from "@/hooks/useEditableContent";
import { usePageSeo } from "@/components/SeoHead";
import { Loader2 } from "lucide-react";
import DOMPurify from "dompurify";

export default function CmsPage({ overrideSlug }: { overrideSlug?: string }) {
  const { store_general } = useEditableContent();
  const params = useParams<{ slug: string }>();
  const slug = overrideSlug ?? params.slug;
  const queryClient = useQueryClient();

  const queryKey = ["cms_page", slug];

  const { data: page, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("cms_pages")
        .select("title, body_html, meta_title, meta_description")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: 0,
  });

  // Realtime subscription — invalidate query on any change to this page
  useEffect(() => {
    if (!slug) return;
    const channel = supabase
      .channel(`cms-page-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cms_pages",
        },
        (payload: any) => {
          // Invalidate if this slug was affected or on any change (slug might not be in filter)
          const changed = payload.new?.slug || payload.old?.slug;
          if (!changed || changed === slug) {
            queryClient.invalidateQueries({ queryKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, queryClient, queryKey]);

  usePageSeo({
    title: page?.meta_title || page?.title || store_general.store_name,
    description: page?.meta_description || `${store_general.store_slogan} — magazin online.`,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (isError || !page) {
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
