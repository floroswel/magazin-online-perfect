import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Send, Power, PowerOff, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EVENT_TYPES = [
  { value: "order.created", label: "Order Created" },
  { value: "order.paid", label: "Order Paid" },
  { value: "order.shipped", label: "Order Shipped" },
  { value: "order.cancelled", label: "Order Cancelled" },
  { value: "product.updated", label: "Product Updated" },
  { value: "customer.created", label: "Customer Created" },
  { value: "newsletter.subscribed", label: "Newsletter Subscribed" },
  { value: "custom_event", label: "Custom Event" },
];

interface WebhookForm {
  name: string;
  event_type: string;
  url: string;
  secret_key: string;
  enabled: boolean;
  include_payload: boolean;
  custom_headers: string;
}

const emptyForm: WebhookForm = {
  name: "",
  event_type: "order.created",
  url: "",
  secret_key: "",
  enabled: true,
  include_payload: true,
  custom_headers: "{}",
};

export default function AdminExternalWebhooks() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookForm>(emptyForm);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["external-webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("external_webhooks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: WebhookForm & { id?: string }) => {
      let headers: Record<string, unknown> = {};
      try { headers = JSON.parse(f.custom_headers); } catch { headers = {}; }

      const row = {
        name: f.name,
        event_type: f.event_type,
        url: f.url,
        secret_key: f.secret_key || null,
        enabled: f.enabled,
        include_payload: f.include_payload,
        custom_headers: headers,
      };

      if (f.id) {
        const { error } = await supabase.from("external_webhooks").update(row).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("external_webhooks").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external-webhooks"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast.success("Webhook salvat!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("external_webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external-webhooks"] });
      toast.success("Webhook șters!");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("external_webhooks").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["external-webhooks"] }),
  });

  const [testing, setTesting] = useState<string | null>(null);

  const sendTest = async (wh: typeof webhooks[0]) => {
    setTesting(wh.id);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const session = (await supabase.auth.getSession()).data.session;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/dispatch-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            event_type: wh.event_type,
            payload: {
              test: true,
              webhook_name: wh.name,
              timestamp: new Date().toISOString(),
              sample_order: { id: "test-123", total: 99.99, currency: "RON" },
            },
          }),
        }
      );

      if (res.ok) {
        toast.success("Test webhook trimis cu succes!");
        qc.invalidateQueries({ queryKey: ["external-webhooks"] });
      } else {
        const body = await res.text();
        toast.error("Eroare la test: " + body);
      }
    } catch (err) {
      toast.error("Eroare: " + String(err));
    } finally {
      setTesting(null);
    }
  };

  const openEdit = (wh: typeof webhooks[0]) => {
    setEditId(wh.id);
    setForm({
      name: wh.name,
      event_type: wh.event_type,
      url: wh.url,
      secret_key: wh.secret_key || "",
      enabled: wh.enabled,
      include_payload: wh.include_payload,
      custom_headers: JSON.stringify(wh.custom_headers || {}, null, 2),
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks Externe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trimite notificări automate către Zapier, Make.com sau orice URL extern când apar evenimente în magazin.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Adaugă Webhook
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nume</TableHead>
              <TableHead>Eveniment</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ultimul Răspuns</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Se încarcă…</TableCell></TableRow>
            ) : webhooks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Niciun webhook configurat.</TableCell></TableRow>
            ) : webhooks.map((wh) => (
              <TableRow key={wh.id}>
                <TableCell className="font-medium">{wh.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{wh.event_type}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{wh.url}</TableCell>
                <TableCell>
                  <Switch
                    checked={wh.enabled}
                    onCheckedChange={(enabled) => toggleMutation.mutate({ id: wh.id, enabled })}
                  />
                </TableCell>
                <TableCell>
                  {wh.last_status ? (
                    <Badge variant={wh.last_status < 300 ? "default" : "destructive"} className="text-xs">
                      {wh.last_status}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => sendTest(wh)} disabled={testing === wh.id}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(wh)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Șterge webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Webhook-ul „{wh.name}" va fi eliminat permanent.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulează</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(wh.id)}>Șterge</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editează Webhook" : "Adaugă Webhook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nume</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Zapier Order Notification" />
            </div>
            <div>
              <Label>Eveniment</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((et) => (
                    <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://hooks.zapier.com/..." />
            </div>
            <div>
              <Label>Secret Key (HMAC)</Label>
              <Input value={form.secret_key} onChange={(e) => setForm({ ...form, secret_key: e.target.value })} placeholder="Opțional – pentru verificare HMAC-SHA256" type="password" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
                <Label>Activ</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.include_payload} onCheckedChange={(v) => setForm({ ...form, include_payload: v })} />
                <Label>Trimite payload</Label>
              </div>
            </div>
            <div>
              <Label>Custom Headers (JSON)</Label>
              <Textarea
                value={form.custom_headers}
                onChange={(e) => setForm({ ...form, custom_headers: e.target.value })}
                placeholder='{"X-Custom": "value"}'
                rows={3}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Anulează</Button>
            <Button
              onClick={() => saveMutation.mutate({ ...form, id: editId || undefined })}
              disabled={!form.name || !form.url || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Se salvează…" : "Salvează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
