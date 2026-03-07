import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Send, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Campaign = {
  id: string;
  name: string;
  message: string;
  recipient_count: number;
  sent_count: number;
  cost: number;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export default function AdminSMS() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", message: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalSent = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "sent").length;
  const totalCost = campaigns.reduce((s, c) => s + Number(c.cost), 0);

  const handleCreate = async () => {
    if (!form.name || !form.message) return;
    const { error } = await supabase.from("sms_campaigns").insert({ name: form.name, message: form.message } as any);
    if (error) { toast({ title: "Eroare", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Campanie creată" });
    setDialogOpen(false);
    setForm({ name: "", message: "" });
    load();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { draft: "bg-muted text-muted-foreground", sent: "bg-primary/10 text-primary", scheduled: "bg-accent text-accent-foreground" };
    return <Badge className={`${colors[s] || ""} text-[10px]`}>{s}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Campanii SMS</h1>
          <p className="text-sm text-muted-foreground">Notificări și promoții prin SMS.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Campanie nouă</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalSent}</p><p className="text-xs text-muted-foreground">SMS-uri trimise</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{activeCampaigns}</p><p className="text-xs text-muted-foreground">Campanii trimise</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalCost.toFixed(2)} RON</p><p className="text-xs text-muted-foreground">Cost total</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Campanie</TableHead><TableHead>Destinatari</TableHead><TableHead>Trimise</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nu au fost create campanii SMS.</TableCell></TableRow>
                ) : campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell>{c.recipient_count}</TableCell>
                    <TableCell>{c.sent_count}</TableCell>
                    <TableCell className="text-xs">{format(new Date(c.created_at), "dd.MM.yyyy")}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Campanie SMS nouă</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nume campanie</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Promoție weekend" />
            </div>
            <div>
              <Label className="text-xs">Mesaj SMS (max 160 caractere)</Label>
              <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={160} placeholder="Scrie mesajul SMS..." rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{form.message.length}/160 caractere</p>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Creează campanie</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
