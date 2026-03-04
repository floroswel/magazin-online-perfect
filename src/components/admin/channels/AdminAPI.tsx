import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, RefreshCw, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminAPI() {
  const [apiKey] = useState("mk_live_" + Math.random().toString(36).substring(2, 18));

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
              <Button variant="outline" size="icon" onClick={() => toast({ title: "Cheie regenerată" })}>
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
