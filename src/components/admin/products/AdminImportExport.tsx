import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Globe, Code, Download, CheckCircle2, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  source: string;
  total_parsed: number;
  inserted: number;
  errors: number;
}

export default function AdminImportExport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [feedUrl, setFeedUrl] = useState("");
  const [apiJson, setApiJson] = useState("");
  const [exporting, setExporting] = useState(false);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Authorization": `Bearer ${session?.access_token}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const headers = await getAuthHeaders();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products`,
        { method: "POST", headers, body: formData }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la import");

      setResult(data);
      toast.success(`${data.inserted} produse importate din CSV!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

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
        .select("name, slug, price, old_price, stock, description, image_url, brand, featured, created_at")
        .order("name");

      if (error) throw error;

      const header = "name,slug,price,old_price,stock,description,image_url,brand,featured\n";
      const rows = (data || []).map((p) =>
        `"${(p.name || "").replace(/"/g, '""')}","${p.slug}",${p.price},${p.old_price || ""},${p.stock},"${(p.description || "").replace(/"/g, '""').replace(/\n/g, " ")}","${p.image_url || ""}","${p.brand || ""}",${p.featured}`
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
        </TabsList>

        <TabsContent value="csv">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import din fișier CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Format CSV acceptat:</p>
                <p>Prima linie = header cu numele coloanelor. Coloane acceptate:</p>
                <code className="block bg-muted p-2 rounded text-xs">
                  name, price, old_price, stock, description, image_url, brand, slug, category_id, featured
                </code>
                <p>Sau în română: <code className="text-xs">nume, pret, pret_vechi, stoc, descriere, imagine, marca</code></p>
              </div>

              <div>
                <Label>Selectează fișier CSV</Label>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  disabled={importing}
                  className="cursor-pointer"
                />
              </div>

              {importing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Se importă...
                </div>
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
      </Tabs>
    </div>
  );
}
