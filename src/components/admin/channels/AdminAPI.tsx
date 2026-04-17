import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code, Copy, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function generateKey() {
  return "mk_live_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

export default function AdminAPI() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["api-external-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value_json")
        .eq("key", "external_api")
        .maybeSingle();
      return (data?.value_json as any) || { apiKey: generateKey() };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", "external_api").maybeSingle();
      if (existing) {
        const { error } = await supabase.from("app_settings").update({ value_json: updated as any }).eq("key", "external_api");
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_settings").insert({ key: "external_api", value_json: updated as any });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-external-settings"] }),
  });

  const apiKey = settings?.apiKey || "";

  const regenerate = () => {
    const newKey = generateKey();
    saveMutation.mutate({ ...settings, apiKey: newKey });
    toast({ title: "Cheie regenerată și salvată" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Code className="w-5 h-5" /> API Extern</h1>
        <p className="text-sm text-muted-foreground">Documentație API, chei de acces și playground.</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Cheie API</Label>
            <div className="flex gap-2 mt-1">
              <Input value={apiKey} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(apiKey); toast({ title: "Copiat!" }); }}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={regenerate}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded border text-center"><p className="text-lg font-bold">GET</p><p className="text-xs text-muted-foreground">/api/products</p></div>
            <div className="p-3 rounded border text-center"><p className="text-lg font-bold">GET</p><p className="text-xs text-muted-foreground">/api/orders</p></div>
            <div className="p-3 rounded border text-center"><p className="text-lg font-bold">GET</p><p className="text-xs text-muted-foreground">/api/categories</p></div>
            <div className="p-3 rounded border text-center"><p className="text-lg font-bold">POST</p><p className="text-xs text-muted-foreground">/api/webhooks</p></div>
          </div>
          <div className="p-4 rounded bg-muted/50 font-mono text-xs space-y-1">
            <p className="text-muted-foreground"># Exemplu: listare produse</p>
            <p>curl -H "Authorization: Bearer {apiKey.slice(0, 12)}..." \</p>
            <p>  {window.location.origin}/api/products</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
