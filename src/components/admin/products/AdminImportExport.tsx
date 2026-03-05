import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Globe, Code, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2, Clock, Trash2, Play, Plus, ArrowRight, Eye, RotateCcw, History, Rss, FileDown, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImportResult {
  success: boolean;
  source: string;
  total_parsed: number;
  inserted: number;
  updated?: number;
  skipped?: number;
  errors: number;
  error_details?: { row: number; message: string }[];
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
  price_mode: string;
  price_multiplier: number;
  price_margin: number;
  stock_only_sync: boolean;
}

interface ImportHistoryRow {
  id: string;
  created_at: string;
  source: string;
  file_name: string | null;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  errors: any;
  import_mode: string;
}

const PRODUCT_FIELDS = [
  { key: "", label: "— Nu mapa —" },
  { key: "name", label: "Nume produs *" },
  { key: "price", label: "Preț *" },
  { key: "old_price", label: "Preț vechi (compare-at)" },
  { key: "cost_price", label: "Preț cost" },
  { key: "stock", label: "Stoc" },
  { key: "low_stock_threshold", label: "Prag stoc mic" },
  { key: "description", label: "Descriere" },
  { key: "short_description", label: "Descriere scurtă" },
  { key: "image_url", label: "URL imagine principală" },
  { key: "images", label: "Galerie imagini (separate prin |)" },
  { key: "brand", label: "Brand / Producător" },
  { key: "slug", label: "Slug (URL)" },
  { key: "sku", label: "SKU / Cod produs" },
  { key: "ean", label: "EAN / GTIN" },
  { key: "weight_kg", label: "Greutate (kg)" },
  { key: "category_id", label: "ID categorie (UUID)" },
  { key: "category_name", label: "Nume categorie" },
  { key: "featured", label: "Produs featured" },
  { key: "visible", label: "Vizibil" },
  { key: "status", label: "Status (active/draft)" },
  { key: "meta_title", label: "Meta titlu (SEO)" },
  { key: "meta_description", label: "Meta descriere (SEO)" },
  { key: "canonical_url", label: "URL canonic (SEO)" },
  { key: "tags", label: "Taguri (separate prin , sau |)" },
  { key: "warranty_months", label: "Garanție (luni)" },
];

const EXPORT_COLUMNS = [
  { key: "name", label: "Nume" },
  { key: "slug", label: "Slug" },
  { key: "sku", label: "SKU" },
  { key: "ean", label: "EAN" },
  { key: "price", label: "Preț" },
  { key: "old_price", label: "Preț vechi" },
  { key: "cost_price", label: "Preț cost" },
  { key: "stock", label: "Stoc" },
  { key: "description", label: "Descriere" },
  { key: "short_description", label: "Descriere scurtă" },
  { key: "image_url", label: "Imagine" },
  { key: "brand", label: "Brand" },
  { key: "featured", label: "Featured" },
  { key: "category_id", label: "Categorie ID" },
  { key: "meta_title", label: "Meta title" },
  { key: "meta_description", label: "Meta description" },
  { key: "tags", label: "Taguri" },
  { key: "weight_kg", label: "Greutate" },
  { key: "warranty_months", label: "Garanție" },
  { key: "status", label: "Status" },
];

function autoDetectMapping(header: string): string {
  const h = header.toLowerCase().trim().replace(/"/g, "").replace(/_/g, " ");
  const map: Record<string, string> = {
    name: "name", nume: "name", title: "name", titlu: "name", "product name": "name", denumire: "name", "nume produs": "name",
    price: "price", pret: "price", preț: "price", "pret vanzare": "price", "preț vânzare": "price",
    "old price": "old_price", "pret vechi": "old_price", "preț vechi": "old_price", "compare at price": "old_price",
    "cost price": "cost_price", "pret cost": "cost_price",
    stock: "stock", stoc: "stock", cantitate: "stock", qty: "stock", quantity: "stock",
    "low stock threshold": "low_stock_threshold",
    description: "description", descriere: "description",
    "short description": "short_description", "descriere scurta": "short_description",
    "image url": "image_url", imagine: "image_url", image: "image_url", "image link": "image_url",
    images: "images", imagini: "images", galerie: "images",
    brand: "brand", marca: "brand", producator: "brand", producător: "brand", manufacturer: "brand",
    slug: "slug", url: "slug", permalink: "slug",
    sku: "sku", cod: "sku", "cod produs": "sku", "cod articol": "sku",
    ean: "ean", gtin: "ean", barcode: "ean",
    "weight kg": "weight_kg", weight: "weight_kg", greutate: "weight_kg",
    "category id": "category_id",
    category: "category_name", categorie: "category_name", "category name": "category_name",
    featured: "featured", promovat: "featured", recomandat: "featured",
    visible: "visible", vizibil: "visible",
    status: "status", stare: "status",
    "meta title": "meta_title", "titlu seo": "meta_title",
    "meta description": "meta_description", "descriere seo": "meta_description",
    "canonical url": "canonical_url",
    tags: "tags", taguri: "tags", etichete: "tags",
    "warranty months": "warranty_months", garantie: "warranty_months", garanție: "warranty_months",
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
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim());
    return values;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const INTERVAL_OPTIONS = [
  { value: "60", label: "La fiecare oră" },
  { value: "360", label: "La fiecare 6 ore" },
  { value: "1440", label: "Zilnic" },
];

const CSV_TEMPLATE = `name,slug,description,short_description,price,compare_at_price,cost_price,sku,ean,stock,low_stock_threshold,weight_kg,brand,categories,tags,status,featured,visible,meta_title,meta_description
"Produs Exemplu 1","produs-exemplu-1","Descriere detaliata","Descriere scurta",199.99,249.99,100,SKU001,5901234123457,50,5,1.5,"Samsung","electronice,telefoane","tag1,tag2",active,true,true,"Produs Exemplu 1 | Magazin","Descriere SEO pentru produs exemplu"
"Produs Exemplu 2","produs-exemplu-2","Alt produs","Scurt",99.99,,60,SKU002,,100,10,0.5,"Apple","accesorii","tag3",active,false,true,"Produs Exemplu 2","Alt produs SEO"`;

export default function AdminImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [feedUrl, setFeedUrl] = useState("");
  const [apiJson, setApiJson] = useState("");
  const [exporting, setExporting] = useState(false);
  const [schedules, setSchedules] = useState<ScheduledImport[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [newSchedule, setNewSchedule] = useState({ name: "", feed_url: "", interval_minutes: "60", price_mode: "as_is", price_multiplier: "1.3", price_margin: "0", stock_only_sync: false });
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  // CSV mapping
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({});
  const [mappingStep, setMappingStep] = useState<"idle" | "mapping" | "preview">("idle");
  const [csvFileName, setCsvFileName] = useState("");
  const [importMode, setImportMode] = useState("create_and_update");
  const [dragOver, setDragOver] = useState(false);

  // Export
  const [exportCols, setExportCols] = useState<string[]>(EXPORT_COLUMNS.map(c => c.key));
  const [exportFormat, setExportFormat] = useState<"csv" | "xml">("csv");

  // History
  const [history, setHistory] = useState<ImportHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<ImportHistoryRow | null>(null);

  useEffect(() => {
    fetchSchedules();
    fetchHistory();
    supabase.from("categories").select("id, name, slug").order("name").then(({ data }) => setCategories(data || []));
  }, []);

  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    const { data } = await supabase.from("scheduled_imports").select("*").order("created_at", { ascending: false });
    setSchedules((data as any[]) || []);
    setLoadingSchedules(false);
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase.from("import_history").select("*").order("created_at", { ascending: false }).limit(50);
    setHistory((data as any[]) || []);
    setLoadingHistory(false);
  };

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { "Authorization": `Bearer ${session?.access_token}`, "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
  };

  // Download CSV template
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-produse.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template CSV descărcat!");
  };

  // Drag & drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processCSVFile(file);
  }, []);

  const processCSVFile = (file: File) => {
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
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCSVFile(file);
    e.target.value = "";
  };

  const updateMapping = (colIndex: number, field: string) => {
    setColumnMapping((prev) => {
      const next = { ...prev };
      if (!field || field === "none") delete next[colIndex];
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
      if (["price", "old_price", "cost_price", "warranty_months", "weight_kg", "low_stock_threshold"].includes(field)) product[field] = parseFloat(val) || null;
      else if (field === "stock") product[field] = parseInt(val) || 0;
      else if (field === "featured" || field === "visible") product[field] = val === "true" || val === "1" || val.toLowerCase() === "da";
      else if (field === "images") product[field] = val.split("|").map((s: string) => s.trim()).filter(Boolean);
      else if (field === "tags") product[field] = val.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean);
      else if (field === "category_name") {
        const catId = resolveCategory(val);
        if (catId) product.category_id = catId;
        product._category_name = val;
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
      delete product._category_name;
      return product;
    }).filter(Boolean);

    if (allProducts.length === 0) { toast.error("Niciun produs valid de importat"); return; }
    setImporting(true);
    setResult(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ products: allProducts, import_mode: importMode, file_name: csvFileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");
      setResult(data);
      setMappingStep("idle");
      setCsvHeaders([]);
      setCsvRows([]);
      setColumnMapping({});
      fetchHistory();
      toast.success(`Import finalizat! ${data.inserted || 0} create, ${data.updated || 0} actualizate`);
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ feed_url: feedUrl.trim(), import_mode: importMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");
      setResult(data);
      fetchHistory();
      toast.success(`Import finalizat!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setImporting(false); }
  };

  const handleAPIImport = async () => {
    if (!apiJson.trim()) { toast.error("Introdu JSON-ul cu produse"); return; }
    let parsed;
    try { parsed = JSON.parse(apiJson); } catch { toast.error("JSON invalid"); return; }
    setImporting(true);
    setResult(null);
    try {
      const headers = await getAuthHeaders();
      const body = Array.isArray(parsed) ? { products: parsed } : parsed;
      body.import_mode = importMode;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");
      setResult(data);
      fetchHistory();
      toast.success(`Import finalizat!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setImporting(false); }
  };

  // Export with column selection
  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("name, slug, sku, ean, price, old_price, cost_price, stock, description, short_description, image_url, brand, featured, category_id, meta_title, meta_description, tags, warranty_months, weight_kg, status, created_at")
        .order("name");

      if (error) throw error;
      const items = data || [];

      if (exportFormat === "xml") {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<products>\n`;
        for (const p of items) {
          xml += `  <product>\n`;
          for (const col of exportCols) {
            const val = (p as any)[col];
            const v = Array.isArray(val) ? val.join(",") : String(val ?? "");
            xml += `    <${col}><![CDATA[${v}]]></${col}>\n`;
          }
          xml += `  </product>\n`;
        }
        xml += `</products>`;
        const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `produse-export-${new Date().toISOString().split("T")[0]}.xml`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
        const header = exportCols.join(",") + "\n";
        const rows = items.map((p: any) =>
          exportCols.map(col => {
            const val = p[col];
            return Array.isArray(val) ? esc(val.join(",")) : esc(val);
          }).join(",")
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `produse-export-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success(`${items.length} produse exportate ca ${exportFormat.toUpperCase()}!`);
    } catch (err: any) { toast.error(err.message); }
    finally { setExporting(false); }
  };

  // Schedules
  const handleAddSchedule = async () => {
    if (!newSchedule.name.trim() || !newSchedule.feed_url.trim()) { toast.error("Completează numele și URL-ul feed-ului"); return; }
    setAddingSchedule(true);
    const { error } = await supabase.from("scheduled_imports").insert({
      name: newSchedule.name.trim(),
      feed_url: newSchedule.feed_url.trim(),
      interval_minutes: parseInt(newSchedule.interval_minutes),
      price_mode: newSchedule.price_mode,
      price_multiplier: parseFloat(newSchedule.price_multiplier) || 1.0,
      price_margin: parseFloat(newSchedule.price_margin) || 0,
      stock_only_sync: newSchedule.stock_only_sync,
    });
    if (error) toast.error(error.message);
    else { toast.success("Import programat adăugat!"); setNewSchedule({ name: "", feed_url: "", interval_minutes: "60", price_mode: "as_is", price_multiplier: "1.3", price_margin: "0", stock_only_sync: false }); fetchSchedules(); }
    setAddingSchedule(false);
  };

  const toggleSchedule = async (id: string, is_active: boolean) => {
    await supabase.from("scheduled_imports").update({ is_active }).eq("id", id);
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, is_active } : s)));
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
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          feed_url: schedule.feed_url,
          import_mode: "create_and_update",
          price_mode: schedule.price_mode,
          price_multiplier: schedule.price_multiplier,
          price_margin: schedule.price_margin,
          stock_only_sync: schedule.stock_only_sync,
          scheduled_import_id: schedule.id,
        }),
      });
      const data = await res.json();
      if (data.success) toast.success(`Import finalizat: ${data.inserted} create, ${data.updated || 0} actualizate`);
      else toast.error(data.error || "Eroare");
      await supabase.from("scheduled_imports").update({ last_run_at: new Date().toISOString(), last_result: data }).eq("id", schedule.id);
      fetchSchedules();
      fetchHistory();
    } catch (err: any) { toast.error(err.message); }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const googleFeedUrl = `https://${projectId}.supabase.co/functions/v1/google-shopping-feed`;
  const facebookFeedUrl = `https://${projectId}.supabase.co/functions/v1/facebook-feed`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import / Export Produse</h1>
          <p className="text-sm text-muted-foreground">Importă, exportă și generează feed-uri pentru catalogul de produse</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <FileDown className="w-4 h-4 mr-2" /> Template CSV
          </Button>
        </div>
      </div>

      {result && (
        <Card className={`border-border ${result.errors > 0 ? "border-yellow-500/30 bg-yellow-500/5" : "border-green-500/30 bg-green-500/5"}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              {result.errors > 0 ? <AlertCircle className="w-5 h-5 text-yellow-400" /> : <CheckCircle2 className="w-5 h-5 text-green-400" />}
              <span className="font-medium text-foreground">Import finalizat</span>
              <Badge variant="outline">{result.source}</Badge>
            </div>
            <div className="flex gap-6 text-sm flex-wrap">
              <span className="text-muted-foreground">Total: <span className="font-mono text-foreground">{result.total_parsed}</span></span>
              <span className="text-muted-foreground">Create: <span className="font-mono text-green-400">{result.inserted}</span></span>
              {(result.updated || 0) > 0 && <span className="text-muted-foreground">Actualizate: <span className="font-mono text-blue-400">{result.updated}</span></span>}
              {(result.skipped || 0) > 0 && <span className="text-muted-foreground">Sărite: <span className="font-mono text-muted-foreground">{result.skipped}</span></span>}
              {result.errors > 0 && <span className="text-muted-foreground">Erori: <span className="font-mono text-red-400">{result.errors}</span></span>}
            </div>
            {result.error_details && result.error_details.length > 0 && (
              <div className="mt-3 text-xs space-y-1 max-h-40 overflow-y-auto">
                {result.error_details.map((e, i) => (
                  <div key={i} className="text-red-400">Rând {e.row}: {e.message}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Mode Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <Label className="text-sm font-medium">Mod import:</Label>
        <Select value={importMode} onValueChange={setImportMode}>
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="create_and_update">Creează și actualizează</SelectItem>
            <SelectItem value="create_only">Doar produse noi</SelectItem>
            <SelectItem value="update_only">Doar actualizare (după SKU)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="csv">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="csv" className="gap-2"><Upload className="w-4 h-4" /> CSV</TabsTrigger>
          <TabsTrigger value="feed" className="gap-2"><Globe className="w-4 h-4" /> Feed URL</TabsTrigger>
          <TabsTrigger value="api" className="gap-2"><Code className="w-4 h-4" /> API</TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2"><Clock className="w-4 h-4" /> Programare</TabsTrigger>
          <TabsTrigger value="export" className="gap-2"><Download className="w-4 h-4" /> Export</TabsTrigger>
          <TabsTrigger value="feeds" className="gap-2"><Rss className="w-4 h-4" /> Feed-uri</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" /> Istoric</TabsTrigger>
        </TabsList>

        {/* CSV Tab */}
        <TabsContent value="csv">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import din fișier CSV
                {mappingStep !== "idle" && <Badge variant="outline" className="ml-2">{csvFileName}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mappingStep === "idle" && (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-foreground mb-1">Trage fișierul CSV aici</p>
                  <p className="text-sm text-muted-foreground mb-3">sau</p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                      <FileSpreadsheet className="w-4 h-4" /> Selectează fișier
                    </span>
                    <Input type="file" accept=".csv,.txt" onChange={handleCSVSelect} disabled={importing} className="hidden" />
                  </label>
                </div>
              )}

              {mappingStep === "mapping" && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Pasul 1: Mapare coloane</p>
                    <p>Câmpurile <span className="text-destructive font-medium">Nume</span> și <span className="text-destructive font-medium">Preț</span> sunt obligatorii. {csvRows.length} rânduri detectate.</p>
                  </div>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Coloană CSV</TableHead>
                          <TableHead className="w-[200px]">Exemplu</TableHead>
                          <TableHead><ArrowRight className="w-4 h-4 inline mr-1" />Câmp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvHeaders.map((header, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-sm">{header}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{csvRows[0]?.[i] || "—"}</TableCell>
                            <TableCell>
                              <Select value={columnMapping[i] || ""} onValueChange={(v) => updateMapping(i, v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Nu mapa" /></SelectTrigger>
                                <SelectContent>
                                  {PRODUCT_FIELDS.map((f) => <SelectItem key={f.key} value={f.key || "none"}>{f.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={resetMapping}><RotateCcw className="w-4 h-4 mr-2" /> Anulează</Button>
                    <Button onClick={() => setMappingStep("preview")} disabled={!mappingValid}><Eye className="w-4 h-4 mr-2" /> Previzualizare</Button>
                    {!mappingValid && <span className="text-xs text-destructive">Mapează cel puțin Nume și Preț</span>}
                  </div>
                </>
              )}

              {mappingStep === "preview" && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Pasul 2: Previzualizare (primele 5 produse din {csvRows.length})</p>
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
                    <Button variant="outline" onClick={() => setMappingStep("mapping")}><RotateCcw className="w-4 h-4 mr-2" /> Înapoi</Button>
                    <Button onClick={handleMappedImport} disabled={importing}>
                      {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă...</> : <><Upload className="w-4 h-4 mr-2" /> Importă {csvRows.length} produse</>}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feed URL Tab */}
        <TabsContent value="feed">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Import din Feed URL</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>URL feed produse</Label>
                <Input placeholder="https://furnizor.ro/feed/products.json" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} disabled={importing} />
              </div>
              <Button onClick={handleFeedImport} disabled={importing || !feedUrl.trim()}>
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă...</> : <><Globe className="w-4 h-4 mr-2" /> Importă din feed</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Code className="w-5 h-5 text-primary" /> Import via API / JSON</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>JSON cu produse</Label>
                <Textarea rows={8} placeholder={`[{"name": "Produs", "price": 199.99, "stock": 50}]`} value={apiJson} onChange={(e) => setApiJson(e.target.value)} disabled={importing} className="font-mono text-xs" />
              </div>
              <Button onClick={handleAPIImport} disabled={importing || !apiJson.trim()}>
                {importing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se importă...</> : <><Code className="w-4 h-4 mr-2" /> Importă JSON</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Import Programat</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-border rounded-lg p-4 space-y-4">
                <p className="font-medium text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă import programat</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Nume</Label>
                    <Input placeholder="Feed furnizor" value={newSchedule.name} onChange={(e) => setNewSchedule((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>URL Feed</Label>
                    <Input placeholder="https://furnizor.ro/feed.json" value={newSchedule.feed_url} onChange={(e) => setNewSchedule((p) => ({ ...p, feed_url: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Interval</Label>
                    <Select value={newSchedule.interval_minutes} onValueChange={(v) => setNewSchedule((p) => ({ ...p, interval_minutes: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTERVAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>Calcul preț la import</Label>
                    <Select value={newSchedule.price_mode} onValueChange={(v) => setNewSchedule((p) => ({ ...p, price_mode: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="as_is">Folosește ca atare</SelectItem>
                        <SelectItem value="multiply">Înmulțește cu X (adaos %)</SelectItem>
                        <SelectItem value="add_margin">Adaugă X lei (marjă fixă)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newSchedule.price_mode === "multiply" && (
                    <div>
                      <Label>Multiplicator (ex: 1.3 = +30%)</Label>
                      <Input type="number" step="0.01" value={newSchedule.price_multiplier} onChange={(e) => setNewSchedule((p) => ({ ...p, price_multiplier: e.target.value }))} />
                    </div>
                  )}
                  {newSchedule.price_mode === "add_margin" && (
                    <div>
                      <Label>Marjă fixă (lei)</Label>
                      <Input type="number" step="1" value={newSchedule.price_margin} onChange={(e) => setNewSchedule((p) => ({ ...p, price_margin: e.target.value }))} />
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={newSchedule.stock_only_sync} onCheckedChange={(v) => setNewSchedule((p) => ({ ...p, stock_only_sync: v }))} />
                      <Label className="text-sm">Doar sincronizare stoc</Label>
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddSchedule} disabled={addingSchedule || !newSchedule.name.trim() || !newSchedule.feed_url.trim()}>
                  {addingSchedule ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se adaugă...</> : <><Plus className="w-4 h-4 mr-2" /> Adaugă</>}
                </Button>
              </div>

              {loadingSchedules ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...</div>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Niciun import programat.</p>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div key={s.id} className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{s.name}</span>
                          <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Activ" : "Inactiv"}</Badge>
                          {s.stock_only_sync && <Badge variant="outline">Doar stoc</Badge>}
                          {s.price_mode !== "as_is" && <Badge variant="outline">{s.price_mode === "multiply" ? `×${s.price_multiplier}` : `+${s.price_margin} lei`}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.feed_url}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Interval: {INTERVAL_OPTIONS.find((o) => o.value === String(s.interval_minutes))?.label || `${s.interval_minutes} min`}</span>
                          {s.last_run_at && <span>Ultima: {new Date(s.last_run_at).toLocaleString("ro-RO")}</span>}
                          {s.last_result && (
                            <span>{s.last_result.success ? <span className="text-green-500">✓ {s.last_result.inserted} create</span> : <span className="text-destructive">✗ {s.last_result.error}</span>}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={s.is_active} onCheckedChange={(v) => toggleSchedule(s.id, v)} />
                        <Button variant="outline" size="sm" onClick={() => runNow(s)}><Play className="w-3 h-3 mr-1" /> Sync</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSchedule(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Export Catalog</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Format export</Label>
                <Select value={exportFormat} onValueChange={(v: "csv" | "xml") => setExportFormat(v)}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Coloane incluse</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {EXPORT_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={exportCols.includes(col.key)}
                        onCheckedChange={(checked) => {
                          setExportCols(prev => checked ? [...prev, col.key] : prev.filter(c => c !== col.key));
                        }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleExport} disabled={exporting || exportCols.length === 0}>
                {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se exportă...</> : <><Download className="w-4 h-4 mr-2" /> Export {exportFormat.toUpperCase()}</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feeds Tab */}
        <TabsContent value="feeds">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Rss className="w-5 h-5 text-primary" /> Feed-uri Produse</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Google Shopping Feed</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={googleFeedUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(googleFeedUrl); toast.success("URL copiat!"); }}>Copiază</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Include: id, title, description, price, availability, image_link, brand, gtin, product_type</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Facebook Catalog Feed</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={facebookFeedUrl} className="font-mono text-xs" />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(facebookFeedUrl); toast.success("URL copiat!"); }}>Copiază</Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Format compatibil Facebook/Instagram Catalog</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Istoric Importuri
                <Button variant="ghost" size="sm" onClick={fetchHistory}><RotateCcw className="w-3 h-3" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Se încarcă...</div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Niciun import în istoric.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Sursă</TableHead>
                      <TableHead>Mod</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Create</TableHead>
                      <TableHead>Actualizate</TableHead>
                      <TableHead>Sărite</TableHead>
                      <TableHead>Erori</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs">{new Date(h.created_at).toLocaleString("ro-RO")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{h.source}</Badge>
                          {h.file_name && <span className="text-xs text-muted-foreground ml-1">{h.file_name}</span>}
                        </TableCell>
                        <TableCell className="text-xs">{h.import_mode === "create_only" ? "Doar noi" : h.import_mode === "update_only" ? "Doar update" : "Create+Update"}</TableCell>
                        <TableCell className="font-mono text-xs">{h.total_rows}</TableCell>
                        <TableCell className="font-mono text-xs text-green-500">{h.created_count}</TableCell>
                        <TableCell className="font-mono text-xs text-blue-400">{h.updated_count}</TableCell>
                        <TableCell className="font-mono text-xs">{h.skipped_count}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {h.error_count > 0 ? <span className="text-red-400">{h.error_count}</span> : "0"}
                        </TableCell>
                        <TableCell>
                          {h.error_count > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedHistory(h)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error details dialog */}
      <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalii erori import</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2 text-sm">
            {selectedHistory?.errors && Array.isArray(selectedHistory.errors) && selectedHistory.errors.length > 0 ? (
              selectedHistory.errors.map((e: any, i: number) => (
                <div key={i} className="bg-destructive/10 rounded p-2 text-xs">
                  <span className="font-mono font-medium">Rând {e.row}:</span> {e.message}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nu sunt detalii disponibile.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
