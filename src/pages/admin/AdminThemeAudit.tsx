import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw, AlertTriangle, CheckCircle2, Database, Code2, Archive,
  Search, Trash2, RotateCcw,
} from "lucide-react";

type AuditReport = {
  generated_at: string;
  db_keys: string[];
  registry_keys: string[];
  orphan_db_keys: string[];
  missing_in_db: string[];
  deprecated: { key: string; reason: string | null; replaced_by: string | null }[];
  totals: {
    db: number;
    registry: number;
    orphan: number;
    missing: number;
    deprecated: number;
  };
};

export default function AdminThemeAudit() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("theme_audit_report");
    if (error) {
      toast({ title: "Eroare audit", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setReport(data as unknown as AuditReport);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deprecate = async (key: string) => {
    setActioning(key);
    const { error } = await supabase.rpc("deprecate_setting", {
      p_key: key,
      p_reason: "Marked from audit page (Val 1)",
      p_replaced_by: null,
    });
    setActioning(null);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cheie marcată ca deprecated", description: key });
    load();
  };

  const restore = async (key: string) => {
    setActioning(key);
    const { error } = await supabase.rpc("undeprecate_setting", { p_key: key });
    setActioning(null);
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cheie restaurată", description: key });
    load();
  };

  const saveSnapshot = async () => {
    if (!report) return;
    const { error } = await supabase.from("theme_audit_snapshots").insert({
      total_db_keys: report.totals.db,
      total_registry_keys: report.totals.registry,
      synced_count: report.totals.db - report.totals.orphan,
      orphan_db_count: report.totals.orphan,
      missing_in_db_count: report.totals.missing,
      deprecated_count: report.totals.deprecated,
      report_json: report as unknown as Record<string, unknown>,
    });
    if (error) {
      toast({ title: "Eroare", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Snapshot salvat", description: "Raportul a fost salvat în istoric." });
  };

  const matches = (k: string) => !filter || k.toLowerCase().includes(filter.toLowerCase());

  if (loading || !report) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const synced = report.totals.db - report.totals.orphan;
  const healthScore = report.totals.db
    ? Math.round((synced / report.totals.db) * 100)
    : 100;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Theme Audit</h1>
          <p className="text-sm text-muted-foreground">
            Sincronizare Admin ↔ Storefront · generat la{" "}
            {new Date(report.generated_at).toLocaleString("ro-RO")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveSnapshot}>
            <Archive className="w-4 h-4 mr-2" /> Salvează snapshot
          </Button>
          <Button onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" /> Re-rulează audit
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" /> Chei active DB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.totals.db}</div>
            <p className="text-xs text-muted-foreground">app_settings (non-deprecated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Registry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.totals.registry}</div>
            <p className="text-xs text-muted-foreground">theme_settings_registry</p>
          </CardContent>
        </Card>
        <Card className={report.totals.orphan > 0 ? "border-amber-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Orphan în DB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{report.totals.orphan}</div>
            <p className="text-xs text-muted-foreground">DB are, registry nu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Health score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                healthScore >= 80
                  ? "text-green-600"
                  : healthScore >= 50
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {healthScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              {synced} sincronizate / {report.totals.db}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filtrează chei..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs cu detalii */}
      <Tabs defaultValue="orphan" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="orphan">
            Orphan DB <Badge variant="secondary" className="ml-2">{report.totals.orphan}</Badge>
          </TabsTrigger>
          <TabsTrigger value="missing">
            Lipsă DB <Badge variant="secondary" className="ml-2">{report.totals.missing}</Badge>
          </TabsTrigger>
          <TabsTrigger value="deprecated">
            Deprecated <Badge variant="secondary" className="ml-2">{report.totals.deprecated}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">
            Toate DB <Badge variant="secondary" className="ml-2">{report.totals.db}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orphan">
          <Card>
            <CardHeader>
              <CardTitle>Chei orfane în DB</CardTitle>
              <CardDescription>
                Există în <code>app_settings</code> dar nu sunt înregistrate în <code>theme_settings_registry</code>.
                Pot fi marcate ca deprecated (conservator — NU se șterge nimic).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {report.orphan_db_keys.filter(matches).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {filter ? "Nicio cheie după filtru." : "✅ Zero chei orfane."}
                  </p>
                ) : (
                  report.orphan_db_keys.filter(matches).map((key) => (
                    <div key={key} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 border">
                      <code className="text-sm">{key}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actioning === key}
                        onClick={() => deprecate(key)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Deprecate
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle>Lipsă din DB</CardTitle>
              <CardDescription>
                Înregistrate în registry, dar nu există ca rând activ în <code>app_settings</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {report.missing_in_db.filter(matches).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {filter ? "Nicio cheie după filtru." : "✅ Toate cheile registry există în DB."}
                  </p>
                ) : (
                  report.missing_in_db.filter(matches).map((key) => (
                    <div key={key} className="py-2 px-3 rounded border">
                      <code className="text-sm">{key}</code>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deprecated">
          <Card>
            <CardHeader>
              <CardTitle>Chei deprecated (arhivate)</CardTitle>
              <CardDescription>
                Marcate ca neutilizate. Nu se mai citesc din storefront. Pot fi restaurate oricând.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {report.deprecated.filter((d) => matches(d.key)).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nicio cheie deprecated încă.
                  </p>
                ) : (
                  report.deprecated
                    .filter((d) => matches(d.key))
                    .map((d) => (
                      <div key={d.key} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50 border">
                        <div>
                          <code className="text-sm">{d.key}</code>
                          {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                          {d.replaced_by && (
                            <p className="text-xs text-muted-foreground">
                              → înlocuit de <code>{d.replaced_by}</code>
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actioning === d.key}
                          onClick={() => restore(d.key)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Restaurează
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Toate cheile active din DB</CardTitle>
              <CardDescription>
                {report.totals.db} chei (excluzând deprecated). Folosește filtrul de mai sus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 max-h-[60vh] overflow-y-auto">
                {report.db_keys.filter(matches).map((key) => {
                  const inRegistry = report.registry_keys.includes(key);
                  return (
                    <div
                      key={key}
                      className={`text-xs px-2 py-1 rounded border ${
                        inRegistry ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
                      }`}
                    >
                      <code>{key}</code>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Despre acest audit</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Mod conservator:</strong> nicio cheie nu este ștearsă din baza de date.
            "Deprecate" doar le marchează — pot fi restaurate oricând.
          </p>
          <p>
            <strong>Următorul val:</strong> populez <code>theme_settings_registry</code> cu cheile temei
            noi, refac frontend-ul (Header/Footer/Hero) să citească exclusiv din registry, șterg cele 5 componente
            <code className="ml-1">Theme*</code> deja confirmate ca cod mort.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
