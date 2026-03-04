import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Layout from "@/components/layout/Layout";
import { useComparison } from "@/hooks/useComparison";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

export default function Compare() {
  const { user } = useAuth();
  const { comparisonItems, removeFromComparison, clearComparison, loading } = useComparison();
  const { addToCart } = useCart();
  const { format } = useCurrency();

  if (!user) return <Layout><div className="container py-16 text-center"><p>Autentifică-te pentru a compara produse.</p><Link to="/auth"><Button className="mt-4">Autentifică-te</Button></Link></div></Layout>;

  if (loading) return <Layout><div className="container py-16 text-center">Se încarcă...</div></Layout>;

  if (comparisonItems.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Comparare produse</h1>
          <p className="text-muted-foreground mb-4">Nu ai produse de comparat. Adaugă produse din catalog.</p>
          <Link to="/catalog"><Button>Vezi produse</Button></Link>
        </div>
      </Layout>
    );
  }

  // Collect all spec keys
  const allSpecKeys = new Set<string>();
  comparisonItems.forEach(p => {
    if (p.specs && typeof p.specs === "object") {
      Object.keys(p.specs as Record<string, string>).forEach(k => allSpecKeys.add(k));
    }
  });

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Comparare produse ({comparisonItems.length})</h1>
          <Button variant="outline" size="sm" onClick={clearComparison}>
            <Trash2 className="h-4 w-4 mr-1" /> Șterge tot
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Produs</TableHead>
                {comparisonItems.map(p => (
                  <TableHead key={p.id} className="min-w-[200px]">
                    <div className="relative">
                      <Button
                        variant="ghost" size="icon"
                        className="absolute -top-1 -right-1 h-6 w-6"
                        onClick={() => removeFromComparison(p.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Link to={`/product/${p.slug}`} className="block">
                        <img src={p.image_url || "/placeholder.svg"} alt={p.name} className="h-24 object-contain mx-auto mb-2" />
                        <p className="text-sm font-medium line-clamp-2">{p.name}</p>
                      </Link>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Preț</TableCell>
                {comparisonItems.map(p => (
                  <TableCell key={p.id}>
                    <span className="text-lg font-bold text-primary">{format(p.price)}</span>
                    {p.old_price && <span className="block text-xs text-muted-foreground line-through">{format(p.old_price)}</span>}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Brand</TableCell>
                {comparisonItems.map(p => <TableCell key={p.id}>{(p as any).brands?.name || "-"}</TableCell>)}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Rating</TableCell>
                {comparisonItems.map(p => (
                  <TableCell key={p.id}>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-emag-yellow text-emag-yellow" />
                      <span>{p.rating}</span>
                      <span className="text-xs text-muted-foreground">({p.review_count})</span>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">Stoc</TableCell>
                {comparisonItems.map(p => (
                  <TableCell key={p.id} className={p.stock > 0 ? "text-green-600" : "text-destructive"}>
                    {p.stock > 0 ? `În stoc (${p.stock})` : "Stoc epuizat"}
                  </TableCell>
                ))}
              </TableRow>
              {[...allSpecKeys].map(key => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-muted-foreground">{key}</TableCell>
                  {comparisonItems.map(p => (
                    <TableCell key={p.id}>
                      {(p.specs as Record<string, string>)?.[key] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              <TableRow>
                <TableCell></TableCell>
                {comparisonItems.map(p => (
                  <TableCell key={p.id}>
                    <Button size="sm" className="w-full" onClick={async () => {
                      if (!user) { toast.error("Autentifică-te"); return; }
                      await addToCart(p.id);
                      toast.success("Adăugat în coș!");
                    }}>
                      Adaugă în coș
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
