import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { usePageSeo } from "@/components/SeoHead";
import { Share2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  usePageSeo({ title: "Favorite | Mama Lucica", noindex: true });

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product:products(*)").eq("user_id", user!.id);
      return data?.map((f: any) => f.product).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  const handleShare = async () => {
    if (!favorites || favorites.length === 0) return;
    const slugs = favorites.map((p: any) => p.slug).join(",");
    const url = `${window.location.origin}/favorites?shared=${encodeURIComponent(slugs)}`;
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiat! Poți partaja lista de favorite.");
    } catch {
      toast.info("Link generat. Copiază-l manual.");
    }
  };

  return (
    <Layout>
      <div className="ml-container py-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold">Favorite</h1>
          {favorites && favorites.length > 0 && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <Share2 className="h-4 w-4" /> Partajează lista
            </button>
          )}
        </div>

        {shareUrl && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
            <input value={shareUrl} readOnly className="flex-1 bg-transparent text-xs font-mono text-foreground outline-none" />
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copiat!"); }} className="shrink-0">
              <Copy className="h-4 w-4 text-primary" />
            </button>
          </div>
        )}

        {favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">Nu ai produse salvate la favorite.</p>
        )}
      </div>
    </Layout>
  );
}
