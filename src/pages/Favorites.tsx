import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/products/ProductCard";
import { usePageSeo } from "@/components/SeoHead";

export default function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  usePageSeo({ title: "Favorite | LUMAX", noindex: true });

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const { data: favorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product:products(*)").eq("user_id", user!.id);
      return data?.map((f: any) => f.product).filter(Boolean) || [];
    },
    enabled: !!user?.id,
  });

  return (
    <Layout>
      <div className="lumax-container py-6 pb-12">
        <h1 className="text-xl font-extrabold mb-6">Favorite</h1>
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