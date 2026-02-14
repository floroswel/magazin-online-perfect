import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export default function Favorites() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from("favorites").select("*, product:products(*)").eq("user_id", user.id).then(({ data }) => {
      setProducts((data || []).map((d: any) => d.product).filter(Boolean));
      setLoading(false);
    });
  }, [user]);

  if (!user) return <Layout><div className="container py-16 text-center"><Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p>Autentifică-te pentru a vedea favoritele.</p><Link to="/auth"><Button className="mt-4">Autentifică-te</Button></Link></div></Layout>;

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Favoritele mele</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16"><Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Nu ai produse favorite.</p><Link to="/catalog"><Button className="mt-4">Descoperă produse</Button></Link></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>
    </Layout>
  );
}
