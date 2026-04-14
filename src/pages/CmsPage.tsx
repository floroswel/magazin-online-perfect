import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";

export default function CmsPage({ overrideSlug }: { overrideSlug?: string }) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = overrideSlug || paramSlug || "";

  const { data: page, isLoading } = useQuery({
    queryKey: ["cms-page", slug],
    queryFn: async () => {
      const { data } = await supabase.from("cms_pages").select("title, slug, body_html, meta_description").eq("slug", slug).eq("published", true).maybeSingle();
      return data;
    },
    enabled: !!slug,
  });

  usePageSeo({ title: page ? `${page.title} | Mama Lucica` : "Mama Lucica", description: page?.meta_description || "" });

  if (isLoading) return <Layout><div className="ml-container py-12"><div className="h-8 skeleton rounded w-48 mb-4" /><div className="h-4 skeleton rounded w-full mb-2" /><div className="h-4 skeleton rounded w-3/4" /></div></Layout>;
  if (!page) return <Layout><div className="ml-container py-20 text-center"><p className="text-lg font-bold">Pagina nu a fost găsită</p></div></Layout>;

  return (
    <Layout>
      <div className="ml-container py-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">{page.title}</h1>
        <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: page.body_html || "" }} />
      </div>
    </Layout>
  );
}