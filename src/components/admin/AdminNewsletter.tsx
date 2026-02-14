import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Trash2, Users, Mail } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const queryClient = useQueryClient();
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const { data: subscribers = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [], isLoading: loadingCamps } = useQuery({
    queryKey: ["admin-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Abonat eliminat!");
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !content.trim()) throw new Error("Completează subiectul și conținutul");

      // Save campaign
      const { data: campaign, error: campError } = await supabase
        .from("newsletter_campaigns")
        .insert({ subject, content, status: "sending" })
        .select()
        .single();
      if (campError) throw campError;

      // Send via edge function
      const { error: sendError } = await supabase.functions.invoke("send-newsletter", {
        body: { campaignId: campaign.id, subject, content },
      });
      if (sendError) throw sendError;

      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      setCampaignOpen(false);
      setSubject("");
      setContent("");
      toast.success("Campania a fost trimisă!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeSubscribers = subscribers.filter((s: any) => s.is_active);

  return (
    <Tabs defaultValue="subscribers" className="space-y-4">
      <TabsList>
        <TabsTrigger value="subscribers" className="flex items-center gap-2">
          <Users className="w-4 h-4" /> Abonați ({activeSubscribers.length})
        </TabsTrigger>
        <TabsTrigger value="campaigns" className="flex items-center gap-2">
          <Mail className="w-4 h-4" /> Campanii ({campaigns.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="subscribers">
        <Card>
          <CardHeader>
            <CardTitle>Abonați Newsletter</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubs ? (
              <p className="text-center py-8 text-muted-foreground">Se încarcă...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Data abonării</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(s.subscribed_at), "dd MMM yyyy", { locale: ro })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "secondary"}>
                          {s.is_active ? "Activ" : "Dezabonat"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm("Sigur vrei să elimini acest abonat?")) deleteSub.mutate(s.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscribers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Niciun abonat încă.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="campaigns">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campanii Email</CardTitle>
              <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={activeSubscribers.length === 0}>
                    <Send className="w-4 h-4 mr-1" /> Campanie nouă
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Trimite Campanie Newsletter</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Se va trimite la <strong>{activeSubscribers.length}</strong> abonați activi.
                    </p>
                    <div className="space-y-2">
                      <Label>Subiect</Label>
                      <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Oferte speciale de weekend!" />
                    </div>
                    <div className="space-y-2">
                      <Label>Conținut (HTML sau text)</Label>
                      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Scrie conținutul emailului..." />
                    </div>
                    <Button onClick={() => sendCampaign.mutate()} className="w-full" disabled={sendCampaign.isPending}>
                      {sendCampaign.isPending ? "Se trimite..." : `Trimite la ${activeSubscribers.length} abonați`}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCamps ? (
              <p className="text-center py-8 text-muted-foreground">Se încarcă...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subiect</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Destinatari</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.subject}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(c.created_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                      </TableCell>
                      <TableCell>{c.recipient_count}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "sent" ? "default" : c.status === "sending" ? "secondary" : "outline"}>
                          {c.status === "sent" ? "Trimis" : c.status === "sending" ? "Se trimite" : "Ciornă"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nicio campanie trimisă.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
