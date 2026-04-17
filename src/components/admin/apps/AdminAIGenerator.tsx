import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, Search,
  Wand2, FileText, Tag, Image, Type, AlignLeft, Eye,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  short_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  price: number;
  category_id: string | null;
  tags: string[] | null;
}

const GENERATION_TARGETS = [
  { key: "short_description", label: "Descriere scurtă", icon: AlignLeft },
  { key: "description", label: "Descriere lungă (HTML)", icon: FileText },
  { key: "meta_title", label: "Meta Title (SEO)", icon: Type, maxChars: 70 },
  { key: "meta_description", label: "Meta Description (SEO)", icon: Type, maxChars: 160 },
  { key: "tags", label: "Tag-uri / Cuvinte cheie", icon: Tag },
  { key: "alt_text", label: "Alt text imagini", icon: Image },
];

export default function AdminAIGenerator() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errors: 0 });
  const [filter, setFilter] = useState<"all" | "no-description" | "no-image">("all");
  const [search, setSearch] = useState("");
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewResults, setPreviewResults] = useState<Record<string, string>>({});
  const [previewUniqueness, setPreviewUniqueness] = useState<Record<string, number>>({});
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>(["description", "short_description", "meta_title", "meta_description", "tags"]);

  const { data: settings } = useQuery({
    queryKey: ["ai-generator-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_generator_settings").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  useEffect(() => { fetchProducts(); }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from("products").select("id, name, brand, description, short_description, meta_title, meta_description, image_url, price, category_id, tags").order("name");
    if (filter === "no-description") query = query.or("description.is.null,description.eq.");
    else if (filter === "no-image") query = query.or("image_url.is.null,image_url.eq.");
    const { data } = await query.limit(500);
    setProducts((data as any) || []);
    setLoading(false);
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)));
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

  const generateForProduct = async (product: Product, targets: string[]) => {
    const headers = await getAuthHeaders();
    const tone = (settings as any)?.tone || "professional";
    const language = (settings as any)?.language || "ro";

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-product-content`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          brand: product.brand,
          language,
          tone,
          target_audience: "general",
        }),
      }
    );

    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 5000));
      throw new Error("rate-limit");
    }
    if (!res.ok) throw new Error("AI error");

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const calculateUniqueness = async (content: string): Promise<number> => {
    // Simple client-side uniqueness check via word overlap
    const { data: existing } = await supabase
      .from("products")
      .select("description")
      .not("description", "is", null)
      .limit(50);

    if (!existing || existing.length === 0) return 100;

    const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    let maxSimilarity = 0;

    for (const p of existing) {
      if (!p.description) continue;
      const existingWords = new Set(p.description.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
      const overlap = [...contentWords].filter(w => existingWords.has(w)).length;
      const similarity = overlap / Math.max(contentWords.size, 1);
      if (similarity > maxSimilarity) maxSimilarity = similarity;
    }

    return Math.round((1 - maxSimilarity) * 100);
  };

  const generateSingleField = async (product: Product, field: string) => {
    setGeneratingField(field);
    try {
      const result = await generateForProduct(product, [field]);
      const content = field === "tags"
        ? JSON.stringify(result.tags || [])
        : result[field] || result.description || "";

      const uniqueness = await calculateUniqueness(content);

      setPreviewResults(prev => ({ ...prev, [field]: content }));
      setPreviewUniqueness(prev => ({ ...prev, [field]: uniqueness }));

      // Log the generation
      await supabase.from("ai_generator_log").insert({
        product_id: product.id,
        action_type: field,
        generated_content: content,
        original_content: (product as any)[field] || null,
        status: (settings as any)?.manual_approval ? "pending" : "auto-saved",
        uniqueness_score: uniqueness,
        admin_user_id: user?.id || "",
      } as any);

      // If auto-save and uniqueness > 85%, save directly
      if (!(settings as any)?.manual_approval && uniqueness >= 85) {
        if (field === "tags") {
          await supabase.from("products").update({ tags: result.tags } as any).eq("id", product.id);
        } else {
          await supabase.from("products").update({ [field]: content } as any).eq("id", product.id);
        }
        toast.success(`${field} generat și salvat (${uniqueness}% unic)`);
      } else if (uniqueness < 85) {
        toast.warning(`Scor unicitate prea mic (${uniqueness}%). Regenerează cu alt unghi.`);
      } else {
        toast.info("Conținut generat — trimis pentru aprobare");
      }
    } catch (e: any) {
      toast.error(`Eroare la generare: ${e.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  const generateAllFields = async (product: Product) => {
    setGeneratingField("all");
    try {
      const result = await generateForProduct(product, selectedTargets);
      const results: Record<string, string> = {};
      const scores: Record<string, number> = {};

      if (result.description) results.description = result.description;
      if (result.short_description) results.short_description = result.short_description;
      if (result.meta_title) results.meta_title = result.meta_title;
      if (result.meta_description) results.meta_description = result.meta_description;
      if (result.tags) results.tags = JSON.stringify(result.tags);

      for (const [key, val] of Object.entries(results)) {
        scores[key] = await calculateUniqueness(val);
      }

      setPreviewResults(results);
      setPreviewUniqueness(scores);

      // Log each
      for (const [key, val] of Object.entries(results)) {
        await supabase.from("ai_generator_log").insert({
          product_id: product.id,
          action_type: key,
          generated_content: val,
          original_content: (product as any)[key] || null,
          status: (settings as any)?.manual_approval ? "pending" : "auto-saved",
          uniqueness_score: scores[key],
          admin_user_id: user?.id || "",
        } as any);

        if (!(settings as any)?.manual_approval && scores[key] >= 85) {
          if (key === "tags") {
            await supabase.from("products").update({ tags: result.tags } as any).eq("id", product.id);
          } else {
            await supabase.from("products").update({ [key]: val } as any).eq("id", product.id);
          }
        }
      }

      toast.success("Toate câmpurile generate!");
    } catch (e: any) {
      toast.error(`Eroare: ${e.message}`);
    } finally {
      setGeneratingField(null);
    }
  };

  // Bulk generate
  const generateBulk = async () => {
    const ids = Array.from(selected);
    if (!ids.length) { toast.error("Selectează cel puțin un produs"); return; }
    setGenerating(true);
    setProgress({ current: 0, total: ids.length, success: 0, errors: 0 });
    let success = 0, errors = 0;

    for (let i = 0; i < ids.length; i++) {
      const product = products.find(p => p.id === ids[i]);
      if (!product) continue;
      try {
        const result = await generateForProduct(product, selectedTargets);
        const updates: any = {};
        if (result.description) updates.description = result.description;
        if (result.short_description) updates.short_description = result.short_description;
        if (result.meta_title) updates.meta_title = result.meta_title;
        if (result.meta_description) updates.meta_description = result.meta_description;
        if (result.tags) updates.tags = result.tags;

        if (Object.keys(updates).length > 0) {
          await supabase.from("products").update(updates).eq("id", product.id);

          // Log
          for (const [key, val] of Object.entries(updates)) {
            await supabase.from("ai_generator_log").insert({
              product_id: product.id,
              action_type: key,
              generated_content: typeof val === "string" ? val : JSON.stringify(val),
              status: "auto-saved",
              uniqueness_score: null,
              admin_user_id: user?.id || "",
            } as any);
          }
          success++;
        } else {
          errors++;
        }
      } catch (e: any) {
        if (e.message === "rate-limit") { i--; continue; }
        errors++;
      }
      setProgress({ current: i + 1, total: ids.length, success, errors });
      if (i < ids.length - 1) await new Promise(r => setTimeout(r, 1200));
    }

    setGenerating(false);
    toast.success(`✅ ${success} produse generate, ${errors} erori`);
    setSelected(new Set());
    fetchProducts();
  };

  const noDescCount = products.filter(p => !p.description?.trim()).length;
  const noImgCount = products.filter(p => !p.image_url?.trim()).length;

  if (settings && !(settings as any).enabled) {
    return (
      <Card className="border-amber-500/30">
        <CardContent className="pt-8 pb-8 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-2">Generator AI Dezactivat</h3>
          <p className="text-sm text-muted-foreground">Activează generatorul AI din Setări → AI Generator pentru a folosi această funcție.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Generator AI Conținut Produse
          </h1>
          <p className="text-sm text-muted-foreground">Generează descrieri, meta-tag-uri, tag-uri și alt text pentru produse</p>
        </div>
        <Button onClick={generateBulk} disabled={generating || !selected.size}>
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se generează ({progress.current}/{progress.total})...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generează {selected.size} produse</>
          )}
        </Button>
      </div>

      {generating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progres generare</span>
              <span className="font-mono">{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} />
            <div className="flex gap-4 text-xs">
              <span className="text-green-600">✓ {progress.success} succese</span>
              {progress.errors > 0 && <span className="text-destructive">✗ {progress.errors} erori</span>}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Total produse</p><p className="text-2xl font-bold">{products.length}</p></div>
            {filter === "all" && <Badge>Activ</Badge>}
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => setFilter("no-description")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Fără descriere</p><p className="text-2xl font-bold text-amber-500">{noDescCount}</p></div>
            {filter === "no-description" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-destructive/50 transition-colors" onClick={() => setFilter("no-image")}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Fără imagine</p><p className="text-2xl font-bold text-destructive">{noImgCount}</p></div>
            {filter === "no-image" && <Badge variant="secondary">Filtrat</Badge>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Caută produse..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === filtered.length ? "Deselectează" : "Selectează tot"}
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
                <div key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors group">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <AlertCircle className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.brand || "—"} · {p.price} RON</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    {!p.description?.trim() && <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs">Fără desc</Badge>}
                    {!p.meta_title?.trim() && <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-xs">Fără SEO</Badge>}
                    {p.description?.trim() && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => { setPreviewProduct(p); setPreviewResults({}); setPreviewUniqueness({}); }}
                    >
                      <Wand2 className="w-4 h-4 mr-1" /> AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-product AI generation dialog */}
      <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generator AI — {previewProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Generate All button */}
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Generează toate câmpurile</p>
                <p className="text-xs text-muted-foreground">Descriere, SEO, tag-uri — totul dintr-un click</p>
              </div>
              <Button onClick={() => previewProduct && generateAllFields(previewProduct)} disabled={generatingField === "all"}>
                {generatingField === "all" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Generează Tot
              </Button>
            </div>

            {/* Per-field generation */}
            {GENERATION_TARGETS.map(target => {
              const currentValue = (previewProduct as any)?.[target.key] || "";
              const generated = previewResults[target.key];
              const uniqueness = previewUniqueness[target.key];
              const isFieldGenerating = generatingField === target.key;
              const Icon = target.icon;

              return (
                <Card key={target.key} className="border-border">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{target.label}</span>
                        {target.maxChars && (
                          <Badge variant="outline" className="text-xs">
                            {(generated || currentValue || "").length}/{target.maxChars}
                          </Badge>
                        )}
                        {uniqueness != null && (
                          <Badge variant={uniqueness >= 85 ? "default" : "destructive"} className="text-xs">
                            {uniqueness}% unic
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewProduct && generateSingleField(previewProduct, target.key)}
                        disabled={!!generatingField}
                      >
                        {isFieldGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                        Generează
                      </Button>
                    </div>

                    {generated && (
                      <div className="grid md:grid-cols-2 gap-2">
                        <div className="border rounded p-2 bg-muted/30 text-xs max-h-[150px] overflow-y-auto">
                          <p className="text-muted-foreground text-[10px] mb-1 uppercase">Curent</p>
                          {currentValue ? (
                            <div dangerouslySetInnerHTML={{ __html: typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue) }} />
                          ) : <span className="italic text-muted-foreground">Gol</span>}
                        </div>
                        <div className="border border-primary/30 rounded p-2 bg-primary/5 text-xs max-h-[150px] overflow-y-auto">
                          <p className="text-primary text-[10px] mb-1 uppercase flex items-center gap-1"><Sparkles className="w-2 h-2" /> Generat AI</p>
                          <div dangerouslySetInnerHTML={{ __html: generated }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
