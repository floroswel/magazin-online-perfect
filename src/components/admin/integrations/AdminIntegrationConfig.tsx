import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Plug, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Field {
  key: string;
  label: string;
  type?: "text" | "password" | "url";
  placeholder?: string;
}

interface Props {
  integrationKey: string;
  title: string;
  description: string;
  fields: Field[];
  docsUrl?: string;
}

export default function AdminIntegrationConfig({ integrationKey, title, description, fields, docsUrl }: Props) {
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("integrations").select("*").eq("provider", integrationKey).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEnabled(data.enabled);
          setConfig((data.config_json as any) || {});
        }
      });
  }, [integrationKey]);

  const save = async () => {
    setSaving(true);
    const existing = await supabase.from("integrations").select("id").eq("provider", integrationKey).maybeSingle();
    if (existing.data) {
      await supabase.from("integrations").update({ enabled, config_json: config as any, updated_at: new Date().toISOString() }).eq("id", existing.data.id);
    } else {
      await supabase.from("integrations").insert({ provider: integrationKey, display_name: title, enabled, config_json: config as any });
    }
    toast({ title: `${title} salvat` });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          {docsUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={docsUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Documentație</a>
            </Button>
          )}
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Salvează</Button>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Plug className="w-4 h-4" /> Configurare</CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Activ</Label>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <Badge variant={enabled ? "default" : "outline"}>{enabled ? "Activat" : "Dezactivat"}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Input
                type={f.type || "text"}
                placeholder={f.placeholder || ""}
                value={config[f.key] || ""}
                onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
