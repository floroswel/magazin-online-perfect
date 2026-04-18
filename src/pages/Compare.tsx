import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, GitCompareArrows } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/hooks/useCompare";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import StorefrontLayout from "@/components/storefront/StorefrontLayout";
import AvailabilityBadge from "@/components/storefront/AvailabilityBadge";
import SeoHead from "@/components/SeoHead";

interface Product {
  id: string;
  name: string;
  slug?: string | null;
  image_url: string | null;
  price: number;
  short_description?: string | null;
  description?: string | null;
  ingredients?: string | null;
  availability?: string | null;
}

export default function Compare() {
  const { ids, remove, clear } = useCompare();
  const { addItem, setOpen } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await (supabase as any)
        .from("products")
        .select("*")
        .in("id", ids);
      if (data) {
        const map = new Map(data.map((d: Product) => [d.id, d]));
        setProducts(ids.map((id) => map.get(id)).filter(Boolean) as Product[]);
      }
      setLoading(false);
    })();
  }, [ids]);

  const handleAddToCart = (p: Product) => {
    addItem({
      product_id: p.id,
      name: p.name,
      slug: p.slug ?? undefined,
      image_url: p.image_url,
      price: Number(p.price ?? 0),
    });
    setOpen(true);
  };

  return (
    <StorefrontLayout>
      <SeoHead title="Compară produse" description="Compară produsele selectate" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Compară produse</h1>
          </div>
          {ids.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear}>
              <Trash2 className="w-4 h-4 mr-1" /> Golește lista
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <GitCompareArrows className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nu ai produse de comparat încă.</p>
            <Button asChild>
              <Link to="/">Răsfoiește produsele</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground w-40">Caracteristică</th>
                  {products.map((p) => (
                    <th key={p.id} className="p-3 text-left min-w-[200px]">
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Elimină
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Imagine</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      <div className="aspect-square w-32 bg-muted rounded-md overflow-hidden">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Nume</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.slug ? (
                        <Link to={`/p/${p.slug}`} className="hover:underline">
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Preț</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 font-bold text-primary">
                      {Number(p.price ?? 0).toFixed(2)} RON
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Disponibilitate</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      <AvailabilityBadge availability={p.availability} hideWhenInStock={false} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Descriere</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-muted-foreground">
                      {p.short_description || (p.description ? p.description.slice(0, 200) + "..." : "—")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-muted-foreground">Ingrediente</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-muted-foreground text-xs">
                      {p.ingredients || "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3"></td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3">
                      <Button size="sm" onClick={() => handleAddToCart(p)} className="w-full">
                        <ShoppingCart className="w-4 h-4 mr-1" /> Adaugă
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
