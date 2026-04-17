import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Gift, Plus, Copy, Search } from "lucide-react";
import { toast } from "sonner";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GC-";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function AdminGiftCards() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ initial_balance: 100, recipient_email: "", recipient_name: "", message: "" });

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["admin-gift-cards"],
    queryFn: async () => {
      const { data } = await supabase.from("gift_cards").select("*").order("created_at", { ascending: false });
      return (data as any[]) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = generateCode();
      await supabase.from("gift_cards").insert({
        code,
        initial_balance: form.initial_balance,
        current_balance: form.initial_balance,
        recipient_email: form.recipient_email || null,
        recipient_name: form.recipient_name || null,
        message: form.message || null,
      } as any);
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      toast.success(`Card cadou creat: ${code}`);
      setOpen(false);
      setForm({ initial_balance: 100, recipient_email: "", recipient_name: "", message: "" });
    },
  });

  const filtered = cards.filter((c: any) =>
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.recipient_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Carduri Cadou</h1>
          <p className="text-sm text-muted-foreground">Creează și gestionează carduri cadou digitale.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" /> Card nou</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Card cadou nou</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Valoare (RON)</Label><Input type="number" value={form.initial_balance} onChange={e => setForm(f => ({ ...f, initial_balance: +e.target.value }))} /></div>
              <div><Label>Email destinatar (opțional)</Label><Input value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} /></div>
              <div><Label>Nume destinatar (opțional)</Label><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} /></div>
              <div><Label>Mesaj personal (opțional)</Label><Input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Generează</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Caută cod sau email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cod</TableHead>
                <TableHead>Valoare</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Destinatar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Se încarcă...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Niciun card cadou.</TableCell></TableRow>
              ) : filtered.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm">{c.code}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Cod copiat!"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{c.initial_balance} RON</TableCell>
                  <TableCell className="font-semibold">{c.current_balance} RON</TableCell>
                  <TableCell className="text-sm">{c.recipient_email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : c.status === "used" ? "secondary" : "outline"}>
                      {c.status === "active" ? "Activ" : c.status === "used" ? "Utilizat" : c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ro-RO")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
