import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Code, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Script {
  id: string;
  name: string;
  script_type: string;
  content: string;
  location: string;
  is_active: boolean;
  created_at: string;
}

const LOCATIONS = [
  { value: "header", label: "Header (<head>)" },
  { value: "body_start", label: "Body (început)" },
  { value: "body_end", label: "Body (sfârșit / footer)" },
  { value: "checkout", label: "Pagină checkout" },
  { value: "after_checkout", label: "După checkout (confirmare)" },
  { value: "all_pages", label: "Toate paginile" },
];

const TYPES = [
  { value: "javascript", label: "JavaScript" },
  { value: "html", label: "HTML inline" },
  { value: "external", label: "Script extern (src)" },
  { value: "css", label: "CSS" },
];

export default function AdminCustomScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", script_type: "javascript", content: "", location: "header" });

  useEffect(() => { fetchScripts(); }, []);

  const fetchScripts = async () => {
    setLoading(true);
    const { data } = await supabase.from("custom_scripts").select("*").order("created_at", { ascending: false });
    setScripts(data || []);
    setLoading(false);
  };

  const add = async () => {
    if (!form.name.trim() || !form.content.trim()) { toast.error("Completează numele și conținutul"); return; }
    setAdding(true);
    const { error } = await supabase.from("custom_scripts").insert(form);
    if (error) toast.error(error.message);
    else { toast.success("Script adăugat!"); setForm({ name: "", script_type: "javascript", content: "", location: "header" }); fetchScripts(); }
    setAdding(false);
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("custom_scripts").update({ is_active }).eq("id", id);
    setScripts(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
    toast.success(is_active ? "Script activat" : "Script dezactivat");
  };

  const remove = async (id: string) => {
    await supabase.from("custom_scripts").delete().eq("id", id);
    setScripts(prev => prev.filter(s => s.id !== id));
    toast.success("Script șters");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Code className="w-6 h-6 text-primary" /> Scripturi Custom</h1>
        <p className="text-sm text-muted-foreground">Adaugă scripturi JavaScript, HTML sau CSS în paginile magazinului</p>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Adaugă script</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nume</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Google Analytics" /></div>
            <div>
              <Label>Tip</Label>
              <Select value={form.script_type} onValueChange={v => setForm(f => ({ ...f, script_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Locație</Label>
              <Select value={form.location} onValueChange={v => setForm(f => ({ ...f, location: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LOCATIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Conținut script</Label><Textarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="<script>...</script>" className="font-mono text-xs" /></div>
          <Button onClick={add} disabled={adding}>
            {adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se adaugă...</> : <><Plus className="w-4 h-4 mr-2" /> Adaugă script</>}
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /> Se încarcă...</div>
      ) : scripts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Niciun script configurat.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {scripts.map(s => (
            <Card key={s.id} className="border-border">
              <CardContent className="pt-4 pb-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="outline">{TYPES.find(t => t.value === s.script_type)?.label}</Badge>
                    <Badge variant="secondary">{LOCATIONS.find(l => l.value === s.location)?.label}</Badge>
                  </div>
                  <pre className="text-xs text-muted-foreground truncate max-w-md">{s.content.substring(0, 80)}...</pre>
                </div>
                <Switch checked={s.is_active} onCheckedChange={v => toggle(s.id, v)} />
                <Button variant="ghost" size="sm" onClick={() => remove(s.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
