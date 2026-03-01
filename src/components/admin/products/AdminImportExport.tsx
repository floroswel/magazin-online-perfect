import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Globe, Code, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Clock, Trash2, Play, Plus, ArrowRight, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  source: string;
  total_parsed: number;
  inserted: number;
  errors: number;
}

interface ScheduledImport {
  id: string;
  name: string;
  feed_url: string;
  interval_minutes: number;
  is_active: boolean;
  last_run_at: string | null;
  last_result: any;
  created_at: string;
}

const PRODUCT_FIELDS = [
  { key: "", label: "— Nu mapa —" },
  { key: "name", label: "Nume produs *" },
  { key: "price", label: "Preț *" },
  { key: "old_price", label: "Preț vechi" },
  { key: "stock", label: "Stoc" },
  { key: "description", label: "Descriere" },
  { key: "short_description", label: "Descriere scurtă" },
  { key: "image_url", label: "URL imagine principală" },
  { key: "images", label: "Galerie imagini (separate prin |)" },
  { key: "brand", label: "Brand / Producător" },
  { key: "slug", label: "Slug (URL)" },
  { key: "sku", label: "SKU / Cod produs" },
  { key: "category_id", label: "ID categorie (UUID)" },
  { key: "category_name", label: "Nume categorie" },
  { key: "featured", label: "Produs featured" },
  { key: "status", label: "Status (active/draft)" },
  { key: "meta_title", label: "Meta titlu (SEO)" },
  { key: "meta_description", label: "Meta descriere (SEO)" },
  { key: "canonical_url", label: "URL canonic (SEO)" },
  { key: "tags", label: "Taguri (separate prin |)" },
  { key: "warranty_months", label: "Garanție (luni)" },
];

function autoDetectMapping(header: string): string {
  const h = header.toLowerCase().trim().replace(/"/g, "").replace(/_/g, " ");
  const map: Record<string, string> = {
    name: "name", nume: "name", title: "name", titlu: "name", "product name": "name", denumire: "name", "nume produs": "name",
    price: "price", pret: "price", preț: "price", "pret vanzare": "price", "preț vânzare": "price",
    "old price": "old_price", "pret vechi": "old_price", "preț vechi": "old_price", "pret initial": "old_price",
    stock: "stock", stoc: "stock", cantitate: "stock", qty: "stock", quantity: "stock",
    description: "description", descriere: "description",
    "short description": "short_description", "descriere scurta": "short_description", "descriere scurtă": "short_description",
    "image url": "image_url", imagine: "image_url", image: "image_url", "image link": "image_url", poza: "image_url", foto: "image_url", "url imagine": "image_url",
    images: "images", imagini: "images", galerie: "images", "gallery images": "images",
    brand: "brand", marca: "brand", producator: "brand", producător: "brand", manufacturer: "brand",
    slug: "slug", url: "slug", permalink: "slug",
    sku: "sku", cod: "sku", "cod produs": "sku", "cod articol": "sku", barcode: "sku", ean: "sku",
    "category id": "category_id",
    category: "category_name", categorie: "category_name", "category name": "category_name", "nume categorie": "category_name",
    featured: "featured", promovat: "featured", recomandat: "featured",
    status: "status", stare: "status",
    "meta title": "meta_title", "titlu seo": "meta_title",
    "meta description": "meta_description", "descriere seo": "meta_description",
    "canonical url": "canonical_url",
    tags: "tags", taguri: "tags", etichete: "tags",
    "warranty months": "warranty_months", garantie: "warranty_months", garanție: "warranty_months", "luni garantie": "warranty_months",
  };
  return map[h] || "";
}

function parseCSVLocal(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += char; }
    }
    values.push(current.trim());
    return values;
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const INTERVAL_OPTIONS = [
  { value: "15", label: "La fiecare 15 minute" },
  { value: "30", label: "La fiecare 30 minute" },
  { value: "60", label: "La fiecare oră" },
  { value: "180", label: "La fiecare 3 ore" },
  { value: "360", label: "La fiecare 6 ore" },
  { value: "720", label: "La fiecare 12 ore" },
  { value: "1440", label: "Zilnic" },
];

export default function AdminImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [feedUrl, setFeedUrl] = useState("");
  const [apiJson, setApiJson] = useState("");
  const [exporting, setExporting] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledImport[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [newSchedule, setNewSchedule] = useState({ name: "", feed_url: "", interval_minutes: "60" });
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // CSV mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [mappingStep, setMappingStep] = useState<"idle" | "mapping" | "preview">("idle");
  const [csvFileName, setCsvFileName] = useState("");

  useEffect(() => {
    fetchSchedules();
    supabase.from("categories").select("id, name, slug").order("name").then(({ data }) => setCategories(data || []));
  }, []);

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    const { data, error } = await supabase.from("scheduled_imports").select("*").order("created_at", { ascending: false });
    if (!error) setSchedules(data || []);
    setLoadingSchedules(false);
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.name.trim() || !newSchedule.feed_url.trim()) { toast.error("Completează numele și URL-ul feed-ului"); return; }
    setAddingSchedule(true);
    const { error } = await supabase.from("scheduled_imports").insert({ name: newSchedule.name.trim(), feed_url: newSchedule.feed_url.trim(), interval_minutes: parseInt(newSchedule.interval_minutes) });
    if (error) { toast.error(error.message); } else { toast.success("Import programat adăugat!"); setNewSchedule({ name: "", feed_url: "", interval_minutes: "60" }); fetchSchedules(); }
    setAddingSchedule(false);
  };

  const toggleSchedule = async (id: string, is_active: boolean) => {
    await supabase.from("scheduled_imports").update({ is_active }).eq("id", id);
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, is_active } : s)));
    toast.success(is_active ? "Import activat" : "Import dezactivat");
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("scheduled_imports").delete().eq("id", id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    toast.success("Import programat șters");
  };

  const runNow = async (schedule: ScheduledImport) => {
    toast.info(`Se rulează importul "${schedule.name}"...`);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ feed_url: schedule.feed_url }) });
      const data = await res.json();
      if (data.success) { toast.success(`${data.inserted} produse importate din "${schedule.name}"!`); } else { toast.error(data.error || "Eroare la import"); }
      await supabase.from("scheduled_imports").update({ last_run_at: new Date().toISOString(), last_result: data }).eq("id", schedule.id);
      fetchSchedules();
    } catch (err: any) { toast.error(err.message); }
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
  };

  // CSV Step 1: Parse and show mapping
  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSVLocal(text);
      if (headers.length === 0) { toast.error("Fișierul CSV este gol sau invalid"); return; }
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMap: Record<number, string> = {};
      headers.forEach((h, i) => { const detected = autoDetectMapping(h); if (detected) autoMap[i] = detected; });
      setColumnMapping(autoMap);
      setMappingStep("mapping");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateMapping = (colIndex: number, field: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!field || field === "none") { delete next[colIndex]; }
      else {
        Object.keys(next).forEach((k) => { if (next[Number(k)] === field && Number(k) !== colIndex) delete next[Number(k)]; });
        next[colIndex] = field;
      }
      return next;
    });
  };

  const mappingValid = useMemo(() => {
    const mapped = Object.values(columnMapping);
    return mapped.includes("name") && mapped.includes("price");
  }, [columnMapping]);

  const resolveCategory = (name: string): string | null => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    const cat = categories.find(c => c.name.toLowerCase() === lower || c.slug === lower);
    return cat?.id || null;
  };

  const transformRow = (row: string[]): Record<string, any> | null => {
    const product: Record<string, any> = {};
    Object.entries(columnMapping).forEach(([colIdx, field]) => {
      const val = row[Number(colIdx)] || "";
      if (!val) return;
      if (field === "price" || field === "old_price" || field === "warranty_months") product[field] = parseFloat(val) || null;
      else if (field === "stock") product[field] = parseInt(val) || 0;
      else if (field === "featured") product[field] = val === "true" || val === "1" || val.toLowerCase() === "da";
      else if (field === "images" || field === "tags") product[field] = val.split("|").map((s: string) => s.trim()).filter(Boolean);
      else if (field === "category_name") {
        const catId = resolveCategory(val);
        if (catId) product.category_id = catId;
        product._category_name = val; // keep for preview
      }
      else product[field] = val;
    });
    if (!product.name || !product.price) return null;
    return product;
  };

  const previewProducts = useMemo(() => {
    if (!mappingValid) return [];
    return csvRows.slice(0, 5).map((row) => transformRow(row)).filter(Boolean);
  }, [csvRows, columnMapping, mappingValid, categories]);

  const handleMappedImport = async () => {
    const allProducts = csvRows.map((row) => {
      const product = transformRow(row);
      if (!product) return null;
      if (!product.slug) product.slug = slugify(product.name);
      delete product._category_name; // cleanup preview field
      return product;
    }).filter(Boolean);
      return product;
    }).filter(Boolean);

    if (allProducts.length === 0) { toast.error("Niciun produs valid de importat"); return; }
    setImporting(true);
    setResult(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ products: allProducts }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");
      setResult(data);
      setMappingStep("idle");
      setCsvHeaders([]);
      setCsvRows([]);
      setColumnMapping({});
      toast.success(`${data.inserted} produse importate din CSV!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setImporting(false); }
  };

  const resetMapping = () => { setMappingStep("idle"); setCsvHeaders([]); setCsvRows([]); setColumnMapping({}); setCsvFileName(""); };

  const handleFeedImport = async () => {
    if (!feedUrl.trim()) { toast.error("Introdu URL-ul feed-ului"); return; }
    setImporting(true);
    setResult(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ feed_url: feedUrl.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");

      setResult(data);
      toast.success(`${data.inserted} produse importate din feed!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleAPIImport = async () => {
    if (!apiJson.trim()) { toast.error("Introdu JSON-ul cu produse"); return; }

    let parsed;
    try {
      parsed = JSON.parse(apiJson);
    } catch {
      toast.error("JSON invalid"); return;
    }

    setImporting(true);
    setResult(null);

    try {
      const headers = await getAuthHeaders();
      const body = Array.isArray(parsed) ? { products: parsed } : parsed;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");

      setResult(data);
      toast.success(`${data.inserted} produse importate via API!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("name, slug, sku, price, old_price, stock, description, short_description, image_url, brand, featured, category_id, meta_title, meta_description, tags, warranty_months, status, created_at")
        .order("name");

      if (error) throw error;

      const header = "name,slug,sku,price,old_price,stock,description,short_description,image_url,brand,featured,category_id,meta_title,meta_description,tags,warranty_months,status\n";
      const esc = (v: any) => `"${String(v || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      const rows = (data || []).map((p: any) =>
        `${esc(p.name)},${esc(p.slug)},${esc(p.sku)},${p.price},${p.old_price || ""},${p.stock},${esc(p.description)},${esc(p.short_description)},${esc(p.image_url)},${esc(p.brand)},${p.featured},${p.category_id || ""},${esc(p.meta_title)},${esc(p.meta_description)},${esc((p.tags || []).join("|"))},${p.warranty_months || ""},${p.status || "active"}`
      ).join("\n");

      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produse-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data?.length || 0} produse exportate!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import / Export Produse</h1>
          <p className="text-sm text-muted-foreground">Importă produse din CSV, feed URL sau API, sau exportă catalogul</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Se exportă..." : "Export CSV"}
        </Button>
      </div>

      {result && (
        <Card className={`border-border ${result.errors > 0 ? "border-yellow-500/30 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              {result.errors > 0 ? (
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
              <span className="font-medium text-foreground">Import finalizat</span>
              <Badge variant="outline">{result.source}</Badge>
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-muted-foreground">Parsate: <span className="font-mono text-foreground">{result.total_parsed}</span></span>
              <span className="text-muted-foreground">Inserate: <span className="font-mono text-green-400">{result.inserted}</span></span>
              {result.errors > 0 && (
                <span className="text-muted-foreground">Erori: <span className="font-mono text-red-400">{result.errors}</span></span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="csv">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="csv" className="gap-2"><Upload className="w-4 h-4" /> CSV Upload</TabsTrigger>
          <TabsTrigger value="feed" className="gap-2"><Globe className="w-4 h-4" /> Feed URL</TabsTrigger>
          <TabsTrigger value="api" className="gap-2"><Code className="w-4 h-4" /> API / JSON</TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2"><Clock className="w-4 h-4" /> Programare</TabsTrigger>
        </TabsList>

        <TabsContent value="csv">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import din fișier CSV
                {mappingStep !== "idle" && (
                  <Badge variant="outline" className="ml-2">{csvFileName}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mappingStep === "idle" && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">Încarcă un fișier CSV cu produse</p>
                    <p>Prima linie trebuie să conțină header-ul cu numele coloanelor. După încărcare vei putea mapa fiecare coloană la câmpul corespunzător.</p>
                  </div>
                  <div>
                    <Label>Selectează fișier CSV</Label>
                    <Input type="file" accept=".csv,.txt" onChange={handleCSVSelect} disabled={importing} className="cursor-pointer" />
                  </div>
                </>
              )}

              {mappingStep === "mapping" && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Pasul 1: Mapare coloane</p>
                    <p>Asociază coloanele din CSV cu câmpurile produselor. Câmpurile <span className="text-destructive font-medium">Nume</span> și <span className="text-destructive font-medium">Preț</span> sunt obligatorii.</p>
                    <p className="text-xs">{csvRows.length} rânduri detectate în fișier.</p>
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Coloană CSV</TableHead>
                          <TableHead className="w-[200px]">Exemplu valoare</TableHead>
                          <TableHead><ArrowRight className="w-4 h-4 inline mr-1" />Câmp produs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvHeaders.map((header, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-sm">{header}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {csvRows[0]?.[i] || "—"}
                            </TableCell>
                            <TableCell>
                              <Select value={columnMapping[i] || ""} onValueChange={(v) => updateMapping(i, v)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Nu mapa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRODUCT_FIELDS.map((f) => (
                                    <SelectItem key={f.key} value={f.key || "none"}>{f.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={resetMapping}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Anulează
                    </Button>
                    <Button onClick={() => setMappingStep("preview")} disabled={!mappingValid}>
                      <Eye className="w-4 h-4 mr-2" /> Previzualizare
                    </Button>
                    {!mappingValid && (
                      <span className="text-xs text-destructive">Mapează cel puțin Nume și Preț</span>
                    )}
                  </div>
                </>
              )}

              {mappingStep === "preview" && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Pasul 2: Previzualizare (primele 5 produse)</p>
                    <p>{csvRows.length} produse totale vor fi importate/actualizate.</p>
                  </div>

                  <div className="border border-border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.values(columnMapping).map((field) => (
                            <TableHead key={field} className="whitespace-nowrap text-xs">
                              {PRODUCT_FIELDS.find((f) => f.key === field)?.label || field}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewProducts.map((product: any, i: number) => (
                          <TableRow key={i}>
                            {Object.values(columnMapping).map((field) => (
                              <TableCell key={field} className="text-xs max-w-[200px] truncate">
                                {Array.isArray(product[field]) ? product[field].join(", ") : String(product[field] ?? "—")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setMappingStep("mapping")}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Înapoi la mapare
                    </Button>
                    <Button onClick={handleMappedImport} disabled={importing}>
                      {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă {csvRows.length} produse...</> : <><Upload className="w-4 h-4 mr-2" /> Importă {csvRows.length} produse</>}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feed">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Import din Feed URL
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Formate acceptate:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>JSON</strong> — array de produse sau obiect cu cheie <code className="text-xs">products</code>/<code className="text-xs">items</code>/<code className="text-xs">data</code></li>
                  <li><strong>XML</strong> — taguri <code className="text-xs">&lt;product&gt;</code> sau <code className="text-xs">&lt;item&gt;</code></li>
                  <li><strong>CSV</strong> — detectare automată</li>
                </ul>
              </div>

              <div>
                <Label>URL feed produse</Label>
                <Input
                  placeholder="https://furnizor.ro/feed/products.json"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  disabled={importing}
                />
              </div>

              <Button onClick={handleFeedImport} disabled={importing || !feedUrl.trim()}>
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă...</> : <><Globe className="w-4 h-4 mr-2" /> Importă din feed</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Import via API / JSON direct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Endpoint API extern:</p>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  POST {import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products
                </code>
                <p>Body JSON: <code className="text-xs">{`{"products": [{"name": "...", "price": 99.99, "stock": 10}]}`}</code></p>
                <p>Header: <code className="text-xs">Authorization: Bearer YOUR_TOKEN</code></p>
              </div>

              <div>
                <Label>JSON cu produse (test manual)</Label>
                <Textarea
                  rows={8}
                  placeholder={`[
  {"name": "Produs Test 1", "price": 199.99, "stock": 50, "brand": "Samsung"},
  {"name": "Produs Test 2", "price": 299.99, "stock": 25}
]`}
                  value={apiJson}
                  onChange={(e) => setApiJson(e.target.value)}
                  disabled={importing}
                  className="font-mono text-xs"
                />
              </div>

              <Button onClick={handleAPIImport} disabled={importing || !apiJson.trim()}>
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă...</> : <><Code className="w-4 h-4 mr-2" /> Importă JSON</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Import Programat (Cron)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Cum funcționează?</p>
                <p>Configurează un feed URL care va fi importat automat la intervale regulate. Sistemul verifică periodic feed-urile active și importă produse noi.</p>
              </div>

              {/* Add new schedule */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="font-medium text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă import programat</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Nume</Label>
                    <Input
                      placeholder="ex: Feed furnizor principal"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>URL Feed</Label>
                    <Input
                      placeholder="https://furnizor.ro/feed.json"
                      value={newSchedule.feed_url}
                      onChange={(e) => setNewSchedule((p) => ({ ...p, feed_url: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Interval</Label>
                    <Select value={newSchedule.interval_minutes} onValueChange={(v) => setNewSchedule((p) => ({ ...p, interval_minutes: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTERVAL_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddSchedule} disabled={addingSchedule || !newSchedule.name.trim() || !newSchedule.feed_url.trim()}>
                  {addingSchedule ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se adaugă...</> : <><Plus className="w-4 h-4 mr-2" /> Adaugă</>}
                </Button>
              </div>

              {/* List of schedules */}
              {loadingSchedules ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...
                </div>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Niciun import programat configurat.</p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div key={s.id} className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{s.name}</span>
                          <Badge variant={s.is_active ? "default" : "secondary"}>
                            {s.is_active ? "Activ" : "Inactiv"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.feed_url}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Interval: {INTERVAL_OPTIONS.find((o) => o.value === String(s.interval_minutes))?.label || `${s.interval_minutes} min`}</span>
                          {s.last_run_at && (
                            <span>Ultima rulare: {new Date(s.last_run_at).toLocaleString("ro-RO")}</span>
                          )}
                          {s.last_result && (
                            <span>
                              {s.last_result.success
                                ? <span className="text-green-500">✓ {s.last_result.inserted} importate</span>
                                : <span className="text-destructive">✗ {s.last_result.error}</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={s.is_active} onCheckedChange={(v) => toggleSchedule(s.id, v)} />
                        <Button variant="outline" size="sm" onClick={() => runNow(s)}>
                          <Play className="w-3 h-3 mr-1" /> Rulează acum
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSchedule(s.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
