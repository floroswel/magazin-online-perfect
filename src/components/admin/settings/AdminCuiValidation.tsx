import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Search, CheckCircle2, XCircle, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface AnafResult {
  cui: string;
  denumire: string;
  adresa: string;
  nrRegCom: string;
  telefon: string;
  codPostal: string;
  statusRO_e_Factura: boolean;
  scpTVA: boolean;
  data_inceput_ScpTVA: string | null;
  statusInactivi: boolean;
  statusSplitTVA: boolean;
}

export default function AdminCuiValidation() {
  const queryClient = useQueryClient();
  const [testCui, setTestCui] = useState("");
  const [testResult, setTestResult] = useState<AnafResult | null>(null);
  const [testError, setTestError] = useState("");
  const [testing, setTesting] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["cui-validation-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value_json").eq("key", "cui_validation").maybeSingle();
      return (data?.value_json as any) || { enabled: false, auto_fill: true, validate_on_checkout: true, validate_on_account: true };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const { error } = await supabase.from("app_settings").upsert({
        key: "cui_validation",
        value_json: newSettings,
        description: "CUI/CIF ANAF validation settings",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cui-validation-settings"] });
      toast.success("Setări salvate!");
    },
  });

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    saveMutation.mutate(updated);
  };

  const handleTest = async () => {
    const cui = testCui.replace(/\s/g, "").replace(/^RO/i, "");
    if (!cui || isNaN(Number(cui))) {
      toast.error("Introduceți un CUI valid (doar cifre)");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestError("");

    try {
      // Call ANAF public API (no auth needed)
      const today = new Date().toISOString().slice(0, 10);
      const response = await fetch("https://webservicesp.anaf.ro/PlatitorTvaRest/api/v8/ws/tva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ cui: Number(cui), data: today }]),
      });

      if (!response.ok) {
        throw new Error(`ANAF API returned ${response.status}`);
      }

      const data = await response.json();
      const found = data?.found?.[0];

      if (found) {
        setTestResult({
          cui: found.date_generale?.cui?.toString() || cui,
          denumire: found.date_generale?.denumire || "",
          adresa: found.date_generale?.adresa || "",
          nrRegCom: found.date_generale?.nrRegCom || "",
          telefon: found.date_generale?.telefon || "",
          codPostal: found.date_generale?.codPostal || "",
          statusRO_e_Factura: found.date_generale?.statusRO_e_Factura || false,
          scpTVA: found.inregistrare_scop_Tva?.scpTVA || false,
          data_inceput_ScpTVA: found.inregistrare_scop_Tva?.data_inceput_ScpTVA || null,
          statusInactivi: found.date_generale?.statusInactivi || false,
          statusSplitTVA: found.inregistrare_RTVAI?.statusSplitTVA || false,
        });
        toast.success("Firmă găsită în baza ANAF!");
      } else if (data?.notfound?.length > 0) {
        setTestError("CUI-ul nu a fost găsit în baza de date ANAF.");
        toast.error("CUI negăsit");
      } else {
        setTestError("Răspuns neașteptat de la ANAF.");
      }
    } catch (err: any) {
      setTestError(`Eroare la interogarea ANAF: ${err.message}. Notă: API-ul ANAF poate bloca cereri cross-origin. Integrarea completă necesită un proxy backend.`);
      // Show demo data for testing
      setTestResult({
        cui: cui,
        denumire: "S.C. EXEMPLU DEMO S.R.L.",
        adresa: "Str. Demonstrației Nr. 1, București",
        nrRegCom: "J40/1234/2020",
        telefon: "021-123-4567",
        codPostal: "010101",
        statusRO_e_Factura: true,
        scpTVA: true,
        data_inceput_ScpTVA: "2020-01-15",
        statusInactivi: false,
        statusSplitTVA: false,
      });
      toast.info("Se afișează date demo (ANAF CORS). Pentru producție, se va folosi un proxy backend.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Validare CUI/CIF (ANAF)
        </h2>
        <p className="text-sm text-muted-foreground">Verificare automată a datelor de firmă prin API-ul ANAF</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Settings */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="w-4 h-4" /> Setări</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><Label className="font-medium">Activează validarea CUI</Label><p className="text-xs text-muted-foreground">Permite verificarea automată a firmelor</p></div>
              <Switch checked={settings?.enabled || false} onCheckedChange={v => updateSetting("enabled", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="font-medium">Auto-completare date firmă</Label><p className="text-xs text-muted-foreground">Completează automat denumire, adresă, nr. reg. com.</p></div>
              <Switch checked={settings?.auto_fill !== false} onCheckedChange={v => updateSetting("auto_fill", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="font-medium">Validare la checkout</Label><p className="text-xs text-muted-foreground">Verifică CUI-ul la plasarea comenzii B2B</p></div>
              <Switch checked={settings?.validate_on_checkout !== false} onCheckedChange={v => updateSetting("validate_on_checkout", v)} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><Label className="font-medium">Validare la crearea contului</Label><p className="text-xs text-muted-foreground">Verifică CUI la înregistrarea ca persoană juridică</p></div>
              <Switch checked={settings?.validate_on_account !== false} onCheckedChange={v => updateSetting("validate_on_account", v)} />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">ℹ️ Informații API ANAF:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Folosește API-ul public ANAF v8 (gratuit, fără cheie)</li>
                <li>Verifică: platitor TVA, e-Factura, Split TVA, status inactiv</li>
                <li>Auto-completează: denumire, adresă, nr. reg. com., cod poștal</li>
                <li>Limită: max 500 interogări/minut</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Test */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4" /> Testare Verificare CUI</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={testCui} onChange={e => setTestCui(e.target.value)} placeholder="Introduceți CUI (ex: 12345678)" className="flex-1" onKeyDown={e => e.key === "Enter" && handleTest()} />
              <Button onClick={handleTest} disabled={testing}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                Verifică
              </Button>
            </div>

            {testError && !testResult && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm text-destructive flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            {testResult && (
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-foreground">{testResult.denumire}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">CUI:</span> <span className="font-medium">RO{testResult.cui}</span></div>
                  <div><span className="text-muted-foreground">Nr. Reg. Com:</span> <span className="font-medium">{testResult.nrRegCom || "—"}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Adresă:</span> <span className="font-medium">{testResult.adresa || "—"}</span></div>
                  <div><span className="text-muted-foreground">Cod poștal:</span> <span className="font-medium">{testResult.codPostal || "—"}</span></div>
                  <div><span className="text-muted-foreground">Telefon:</span> <span className="font-medium">{testResult.telefon || "—"}</span></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant={testResult.scpTVA ? "default" : "secondary"}>
                    {testResult.scpTVA ? "✅ Plătitor TVA" : "❌ Neplătitor TVA"}
                  </Badge>
                  <Badge variant={testResult.statusRO_e_Factura ? "default" : "secondary"}>
                    {testResult.statusRO_e_Factura ? "✅ e-Factura" : "❌ e-Factura"}
                  </Badge>
                  <Badge variant={testResult.statusInactivi ? "destructive" : "secondary"}>
                    {testResult.statusInactivi ? "⚠️ Inactiv" : "✅ Activ"}
                  </Badge>
                  <Badge variant={testResult.statusSplitTVA ? "outline" : "secondary"}>
                    {testResult.statusSplitTVA ? "Split TVA" : "Fără Split TVA"}
                  </Badge>
                </div>
                {testError && (
                  <p className="text-xs text-amber-500 mt-2">⚠️ Date demo afișate — {testError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
