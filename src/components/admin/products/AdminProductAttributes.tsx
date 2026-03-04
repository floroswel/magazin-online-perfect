import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminProductAttributes() {
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [values, setValues] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrSlug, setNewAttrSlug] = useState("");
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");
  const [newValueSlug, setNewValueSlug] = useState("");
  const [newColorHex, setNewColorHex] = useState("");

  const load = async () => {
    const { data: attrs } = await supabase.from("product_attributes").select("*").order("display_order");
    setAttributes(attrs || []);
    if (attrs) {
      const { data: vals } = await supabase.from("attribute_values").select("*").order("display_order");
      const grouped: Record<string, any[]> = {};
      (vals || []).forEach((v) => { (grouped[v.attribute_id] = grouped[v.attribute_id] || []).push(v); });
      setValues(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addAttribute = async () => {
    if (!newAttrName.trim()) return;
    const slug = newAttrSlug || newAttrName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await supabase.from("product_attributes").insert({ name: newAttrName, slug, type: "select", is_filterable: true, is_visible: true });
    setNewAttrName(""); setNewAttrSlug("");
    toast({ title: "Atribut adăugat" });
    load();
  };

  const deleteAttribute = async (id: string) => {
    await supabase.from("attribute_values").delete().eq("attribute_id", id);
    await supabase.from("product_attributes").delete().eq("id", id);
    toast({ title: "Atribut șters" });
    load();
  };

  const addValue = async (attrId: string) => {
    if (!newValue.trim()) return;
    const slug = newValueSlug || newValue.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await supabase.from("attribute_values").insert({
      attribute_id: attrId, value: newValue, slug,
      color_hex: newColorHex || null,
    });
    setNewValue(""); setNewValueSlug(""); setNewColorHex(""); setAddingValueFor(null);
    toast({ title: "Valoare adăugată" });
    load();
  };

  const deleteValue = async (id: string) => {
    await supabase.from("attribute_values").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Atribute & Variante</h1>
          <p className="text-sm text-muted-foreground">Definire atribute dinamice (culoare, mărime, capacitate) și valorile lor.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Adaugă atribut nou</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Nume (ex: Culoare)" value={newAttrName} onChange={(e) => setNewAttrName(e.target.value)} className="max-w-xs" />
            <Input placeholder="Slug (auto)" value={newAttrSlug} onChange={(e) => setNewAttrSlug(e.target.value)} className="max-w-xs" />
            <Button onClick={addAttribute}><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : attributes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nu ai definit niciun atribut.</CardContent></Card>
      ) : (
        attributes.map((attr) => (
          <Card key={attr.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{attr.name}</CardTitle>
                  <Badge variant="outline">{attr.slug}</Badge>
                  {attr.is_filterable && <Badge className="bg-blue-100 text-blue-800 text-[10px]">Filtrabil</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setAddingValueFor(attr.id); setNewValue(""); }}>
                    <Plus className="w-3 h-3 mr-1" /> Valoare
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAttribute(attr.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {addingValueFor === attr.id && (
                <div className="flex gap-2 mb-3 p-2 bg-muted/50 rounded">
                  <Input placeholder="Valoare (ex: Roșu)" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="max-w-[200px]" />
                  <Input placeholder="Slug" value={newValueSlug} onChange={(e) => setNewValueSlug(e.target.value)} className="max-w-[150px]" />
                  <Input placeholder="#hex" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="max-w-[100px]" />
                  <Button size="sm" onClick={() => addValue(attr.id)}>Salvează</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingValueFor(null)}>Anulează</Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(values[attr.id] || []).map((v) => (
                  <div key={v.id} className="flex items-center gap-1 px-2 py-1 rounded-md border bg-background text-sm group">
                    {v.color_hex && <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: v.color_hex }} />}
                    <span>{v.value}</span>
                    <button onClick={() => deleteValue(v.id)} className="opacity-0 group-hover:opacity-100 text-destructive ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {(!values[attr.id] || values[attr.id].length === 0) && (
                  <span className="text-xs text-muted-foreground">Nicio valoare definită</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
