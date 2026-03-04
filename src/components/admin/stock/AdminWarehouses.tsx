import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Warehouse, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminWarehouses() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const load = async () => {
    const { data } = await supabase.from("warehouses").select("*").order("name");
    setWarehouses(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("warehouses").insert({ name, address: address || null });
    toast({ title: "Depozit adăugat" });
    setName(""); setAddress("");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("warehouses").delete().eq("id", id);
    toast({ title: "Depozit șters" });
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Depozite</h1>
        <p className="text-sm text-muted-foreground">Gestionare depozite și locații de stoc.</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 mb-4">
            <Input placeholder="Nume depozit" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
            <Input placeholder="Adresă (opțional)" value={address} onChange={(e) => setAddress(e.target.value)} className="max-w-xs" />
            <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Warehouse className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Niciun depozit definit.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Adresă</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>{w.address || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">Activ</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(w.id)}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
