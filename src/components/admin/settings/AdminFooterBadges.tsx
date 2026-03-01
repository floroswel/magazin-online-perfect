import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Trash2, Save, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface Badge {
  title: string;
  url: string;
  image: string;
}

export default function AdminFooterBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "footer_legal_badges")
      .single()
      .then(({ data }) => {
        if (data?.value_json && Array.isArray(data.value_json)) {
          setBadges(data.value_json as Badge[]);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from("app_settings").upsert(
      { key: "footer_legal_badges", value_json: badges as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setSaving(false);
    toast.success("Badge-uri salvate!");
  };

  const add = () => setBadges(prev => [...prev, { title: "", url: "", image: "" }]);

  const update = (i: number, field: keyof Badge, value: string) =>
    setBadges(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

  const remove = (i: number) => setBadges(prev => prev.filter((_, idx) => idx !== i));

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Badge-uri Legale Footer
          </h1>
          <p className="text-sm text-muted-foreground">ANPC, SOL/ODR și alte badge-uri afișate în subsolul site-ului</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={add}><Plus className="w-4 h-4 mr-2" /> Adaugă</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se salvează...</> : <><Save className="w-4 h-4 mr-2" /> Salvează</>}
          </Button>
        </div>
      </div>

      {badges.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Niciun badge configurat. Adaugă unul pentru a-l afișa în footer.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {badges.map((badge, i) => (
            <Card key={i} className="border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className="pt-2 text-muted-foreground"><GripVertical className="w-4 h-4" /></div>
                  {badge.image && (
                    <img src={badge.image} alt={badge.title} className="h-12 w-12 rounded object-contain bg-muted p-1 shrink-0" />
                  )}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Titlu</Label>
                      <Input value={badge.title} onChange={e => update(i, "title", e.target.value)} placeholder="ANPC – SAL" />
                    </div>
                    <div>
                      <Label className="text-xs">Link</Label>
                      <Input value={badge.url} onChange={e => update(i, "url", e.target.value)} placeholder="https://reclamatiisal.anpc.ro/" />
                    </div>
                    <div>
                      <Label className="text-xs">URL imagine</Label>
                      <Input value={badge.image} onChange={e => update(i, "image", e.target.value)} placeholder="/images/anpc-sal.png" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive shrink-0 mt-4">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
