import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2, Loader2, Palette, Droplets } from "lucide-react";
import { toast } from "sonner";

interface Scent {
  id: string;
  name: string;
  color: string;
  intensity: number;
  top: string;
  mid: string;
  base: string;
}

export default function AdminPersonalizationOptions() {
  const [scents, setScents] = useState<Scent[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newColor, setNewColor] = useState("#FFFFFF");

  useEffect(() => {
    Promise.all([
      supabase.from("app_settings").select("value_json").eq("key", "personalization_scents").maybeSingle(),
      supabase.from("app_settings").select("value_json").eq("key", "personalization_colors").maybeSingle(),
    ]).then(([scentsRes, colorsRes]) => {
      if (scentsRes.data?.value_json && Array.isArray(scentsRes.data.value_json)) {
        setScents(scentsRes.data.value_json as unknown as Scent[]);
      }
      if (colorsRes.data?.value_json && Array.isArray(colorsRes.data.value_json)) {
        setColors(colorsRes.data.value_json as unknown as string[]);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from("app_settings").upsert({ key: "personalization_scents", value_json: scents as any, description: "Personalization scents" }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: "personalization_colors", value_json: colors as any, description: "Personalization colors" }, { onConflict: "key" }),
    ]);
    if (r1.error || r2.error) toast.error("Eroare la salvare");
    else toast.success("Opțiuni personalizare salvate!");
    setSaving(false);
  };

  const addScent = () => {
    setScents(s => [...s, { id: crypto.randomUUID(), name: "Aromă Nouă", color: "#FFFFFF", intensity: 2, top: "", mid: "", base: "" }]);
  };

  const updateScent = (id: string, field: keyof Scent, val: any) => {
    setScents(s => s.map(sc => sc.id === id ? { ...sc, [field]: val } : sc));
  };

  const removeScent = (id: string) => setScents(s => s.filter(sc => sc.id !== id));

  const addColor = () => {
    if (!colors.includes(newColor)) {
      setColors(c => [...c, newColor]);
    }
  };

  const removeColor = (idx: number) => setColors(c => c.filter((_, i) => i !== idx));

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" /> Opțiuni Personalizare
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează aromele și culorile disponibile pentru personalizare</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează
        </Button>
      </div>

      <Tabs defaultValue="scents">
        <TabsList>
          <TabsTrigger value="scents"><Droplets className="w-4 h-4 mr-1" />Arome ({scents.length})</TabsTrigger>
          <TabsTrigger value="colors"><Palette className="w-4 h-4 mr-1" />Culori ({colors.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scents" className="space-y-4">
          <Button variant="outline" onClick={addScent}><Plus className="w-4 h-4 mr-2" />Adaugă Aromă</Button>
          {scents.map(scent => (
            <Card key={scent.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Nume</Label><Input value={scent.name} onChange={e => updateScent(scent.id, "name", e.target.value)} /></div>
                  <div><Label>Culoare</Label><div className="flex gap-2"><Input type="color" value={scent.color} onChange={e => updateScent(scent.id, "color", e.target.value)} className="w-12 h-9 p-1" /><Input value={scent.color} onChange={e => updateScent(scent.id, "color", e.target.value)} /></div></div>
                  <div><Label>Intensitate (1-3)</Label><Input type="number" min={1} max={3} value={scent.intensity} onChange={e => updateScent(scent.id, "intensity", +e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Note de vârf</Label><Input value={scent.top} onChange={e => updateScent(scent.id, "top", e.target.value)} /></div>
                  <div><Label>Note de mijloc</Label><Input value={scent.mid} onChange={e => updateScent(scent.id, "mid", e.target.value)} /></div>
                  <div><Label>Note de bază</Label><Input value={scent.base} onChange={e => updateScent(scent.id, "base", e.target.value)} /></div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeScent(scent.id)}><Trash2 className="w-3 h-3 mr-1" />Șterge</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div className="flex gap-2 items-end">
            <div><Label>Culoare nouă</Label><div className="flex gap-2"><Input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-12 h-9 p-1" /><Input value={newColor} onChange={e => setNewColor(e.target.value)} className="w-28" /></div></div>
            <Button variant="outline" onClick={addColor}><Plus className="w-4 h-4 mr-1" />Adaugă</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="relative group">
                <div className="w-10 h-10 rounded-md border border-border cursor-pointer" style={{ backgroundColor: c }} title={c} />
                <button onClick={() => removeColor(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
          {colors.length === 0 && <p className="text-sm text-muted-foreground">Nicio culoare adăugată. Se vor folosi culorile implicite.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
