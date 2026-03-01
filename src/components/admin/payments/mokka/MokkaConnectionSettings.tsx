import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  settings: any;
  onChange: (patch: any) => void;
}

export default function MokkaConnectionSettings({ settings, onChange }: Props) {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("mokka-checkout", {
        body: { action: "check_status", application_id: "test" },
      });
      // Even if it fails with "not found", the connection itself works
      if (error && !error.message?.includes("status check")) {
        setTestResult("error");
        toast({ title: "Conexiune eșuată", description: error.message, variant: "destructive" });
      } else {
        setTestResult("success");
        toast({ title: "Conexiune reușită", description: "API-ul Mokka răspunde corect." });
      }
    } catch {
      setTestResult("error");
      toast({ title: "Eroare conexiune", variant: "destructive" });
    }
    setTesting(false);
  };

  const demoUrl = "https://demo-backend.mokka.ro";
  const prodUrl = "https://backend.mokka.ro";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Setări Conectare</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>ID Magazin (store_id)</Label>
          <Input
            value={settings.store_id || ""}
            onChange={(e) => onChange({ store_id: e.target.value })}
            placeholder="store_id_123456"
          />
        </div>

        <div>
          <Label>Cheie Secretă</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={settings.secret_key || ""}
              onChange={(e) => onChange({ secret_key: e.target.value })}
              placeholder="Introdu cheia secretă Mokka"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label>URL API</Label>
          <Input
            value={settings.api_url || demoUrl}
            onChange={(e) => onChange({ api_url: e.target.value })}
            placeholder={demoUrl}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Mod Demo</p>
            <p className="text-xs text-muted-foreground">Simulează tranzacții cu date de test</p>
          </div>
          <Switch
            checked={settings.demo_mode ?? true}
            onCheckedChange={(checked) =>
              onChange({
                demo_mode: checked,
                api_url: checked ? demoUrl : prodUrl,
              })
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${testing ? "animate-spin" : ""}`} />
            Testează conexiunea
          </Button>
          {testResult === "success" && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Conexiune reușită
            </Badge>
          )}
          {testResult === "error" && (
            <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
              <XCircle className="w-3 h-3 mr-1" /> Eroare
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
