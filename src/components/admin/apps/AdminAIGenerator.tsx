import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  brands: { name: string } | null;
  description: string | null;
  image_url: string | null;
  price: number;
  category_id: string | null;
}

export default function AdminAIGenerator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errors: 0 });
  const [filter, setFilter] = useState<"all" | "no-description" | "no-image">("all");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchProducts(); }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("id, name, brand_id, brands(name), description, image_url, price, category_id").order("name");
    
    if (filter === "no-description") {
      query = query.or("description.is.null,description.eq.");
    } else if (filter === "no-image") {
      query = query.or("image_url.is.null,image_url.eq.");
    }

    const { data, error } = await query.limit(500);
    if (!error) setProducts((data as any) || []);
    setLoading(false);
  };

  const filtered = products.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Authorization": `Bearer ${session?.access_token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const generateBulk = async () => {
    const ids = Array.from(selected);
    if (!ids.length) { toast.error("Selectează cel puțin un produs"); return; }
    
    setGenerating(true);
    setProgress({ current: 0, total: ids.length, success: 0, errors: 0 });

    const headers = await getAuthHeaders();
    let success = 0, errors = 0;

    for (let i = 0; i < ids.length; i++) {
      const product = products.find(p => p.id === ids[i]);
      if (!product) continue;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-description`,
          {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ name: product.name, brand: product.brand }),
          }
        );

        if (res.status === 429) {
          toast.warning("Limită AI atinsă, se așteaptă 5 secunde...");
          await new Promise(r => setTimeout(r, 5000));
          i--; // retry
          continue;
        }

        const data = await res.json();
        if (data.description) {
          await supabase.from("products").update({ description: data.description }).eq("id", product.id);
          success++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }

      setProgress({ current: i + 1, total: ids.length, success, errors });
      
      // Rate limit: wait 1s between requests
      if (i < ids.length - 1) await new Promise(r => setTimeout(r, 1000));
    }

    setGenerating(false);
    toast.success(`✅ ${success} descrieri generate, ${errors} erori`);
    setSelected(new Set());
    fetchProducts();
  };

  const noDescCount = products.filter(p => !p.description?.trim()).length;
  const noImgCount = products.filter(p => !p.image_url?.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Generator AI Descrieri
          </h1>
          <p className="text-sm text-muted-foreground">Generează automat descrieri comerciale pentru produse folosind AI</p>
        </div>
        <Button onClick={generateBulk} disabled={generating || !selected.size}>
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se generează ({progress.current}/{progress.total})...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generează pentru {selected.size} produse</>
          )}
        </Button>
      </div>

      {generating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progres generare</span>
              <span className="font-mono">{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
            <div className="flex gap-4 text-xs">
              <span className="text-green-500">✓ {progress.success} succese</span>
              {progress.errors > 0 && <span className="text-destructive">✗ {progress.errors} erori</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total produse</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            {filter === "all" && <Badge>Activ</Badge>}
          </CardContent>
        </Card>
        <Card className="border-border cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilter("no-description")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fără descriere</p>
              <p className="text-2xl font-bold text-yellow-500">{noDescCount}</p>
            </div>
            {filter === "no-description" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
        <Card className="border-border cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setFilter("no-image")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fără imagine</p>
              <p className="text-2xl font-bold text-destructive">{noImgCount}</p>
            </div>
            {filter === "no-image" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
      </div>

      {/* Search + List */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută produse..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === filtered.length ? "Deselectează tot" : "Selectează tot"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Niciun produs găsit.</p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filtered.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand || "—"} · {p.price} RON</p>
                  </div>
                  <div className="flex gap-1">
                    {!p.description?.trim() && <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">Fără descriere</Badge>}
                    {!p.image_url?.trim() && <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">Fără imagine</Badge>}
                    {p.description?.trim() && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
