import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Edit, RefreshCw, Clock, Sparkles, Eye } from "lucide-react";
import { toast } from "sonner";

const ACTION_LABELS: Record<string, string> = {
  description: "Descriere lungă",
  short_description: "Descriere scurtă",
  meta_title: "Meta Title",
  meta_description: "Meta Description",
  tags: "Tag-uri",
  attributes: "Atribute",
  alt_text: "Alt text imagini",
  all: "Toate câmpurile",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "În așteptare", color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  approved: { label: "Aprobat", color: "bg-green-500/15 text-green-500 border-green-500/30" },
  rejected: { label: "Respins", color: "bg-red-500/15 text-red-500 border-red-500/30" },
  "auto-saved": { label: "Auto-salvat", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
};

export default function AdminAIPendingApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [previewLog, setPreviewLog] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [editMode, setEditMode] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["ai-generator-logs", tab],
    queryFn: async () => {
      let query = supabase
        .from("ai_generator_log")
        .select("*, products(name, image_url)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (tab !== "all") query = query.eq("status", tab);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, content }: { id: string; status: string; content?: string }) => {
      const updates: any = { status, approved_by: user?.id, approved_at: new Date().toISOString() };
      if (content !== undefined) updates.generated_content = content;
      const { error } = await supabase.from("ai_generator_log").update(updates).eq("id", id);
      if (error) throw error;

      // If approving, also update the product field
      if (status === "approved" && previewLog?.product_id) {
        const finalContent = content || previewLog.generated_content;
        const fieldMap: Record<string, string> = {
          description: "description",
          short_description: "short_description",
          meta_title: "meta_title",
          meta_description: "meta_description",
        };
        const field = fieldMap[previewLog.action_type];
        if (field) {
          await supabase.from("products").update({ [field]: finalContent } as any).eq("id", previewLog.product_id);
        }
        if (previewLog.action_type === "tags") {
          try {
            const tags = JSON.parse(finalContent);
            if (Array.isArray(tags)) {
              await supabase.from("products").update({ tags } as any).eq("id", previewLog.product_id);
            }
          } catch {}
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-generator-logs"] });
      setPreviewLog(null);
      setEditMode(false);
      toast.success("Acțiune efectuată!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleApprove = () => {
    if (!previewLog) return;
    updateMutation.mutate({ id: previewLog.id, status: "approved", content: editMode ? editContent : undefined });
  };

  const handleReject = () => {
    if (!previewLog) return;
    updateMutation.mutate({ id: previewLog.id, status: "rejected" });
  };

  const handleEditThenApprove = () => {
    if (!previewLog) return;
    if (!editMode) {
      setEditContent(previewLog.generated_content);
      setEditMode(true);
    } else {
      updateMutation.mutate({ id: previewLog.id, status: "approved", content: editContent });
    }
  };

  const pendingCount = logs.filter((l: any) => l.status === "pending").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Aprobări AI în Așteptare
        </h2>
        <p className="text-sm text-muted-foreground">Revizuiește și aprobă conținutul generat de AI</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            În așteptare {pendingCount > 0 && <Badge className="ml-1 bg-yellow-500/20 text-yellow-500">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprobate</TabsTrigger>
          <TabsTrigger value="rejected">Respinse</TabsTrigger>
          <TabsTrigger value="auto-saved">Auto-salvate</TabsTrigger>
          <TabsTrigger value="all">Toate</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Se încarcă...</p>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nicio înregistrare {tab !== "all" ? `cu status "${STATUS_CONFIG[tab]?.label}"` : ""}.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produs</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Unicitate</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acțiuni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.products?.image_url && <img src={log.products.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                            <span className="font-medium text-sm truncate max-w-[200px]">{log.products?.name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{ACTION_LABELS[log.action_type] || log.action_type}</Badge></TableCell>
                        <TableCell>
                          <Badge className={STATUS_CONFIG[log.status]?.color || ""}>
                            {STATUS_CONFIG[log.status]?.label || log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.uniqueness_score != null ? (
                            <Badge variant={log.uniqueness_score >= 85 ? "default" : "destructive"}>
                              {log.uniqueness_score.toFixed(0)}% unic
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setPreviewLog(log); setEditMode(false); }}>
                            <Eye className="w-4 h-4 mr-1" /> Vezi
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview / Approval Dialog */}
      <Dialog open={!!previewLog} onOpenChange={() => { setPreviewLog(null); setEditMode(false); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {previewLog?.products?.name} — {ACTION_LABELS[previewLog?.action_type] || ""}
            </DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Original */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Conținut curent (original)</Label>
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/30 text-sm">
                {previewLog?.original_content ? (
                  <div dangerouslySetInnerHTML={{ __html: previewLog.original_content }} />
                ) : (
                  <p className="text-muted-foreground italic">Niciun conținut existent</p>
                )}
              </div>
            </div>

            {/* Generated */}
            <div>
              <Label className="text-sm font-medium text-primary mb-2 block flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Conținut generat AI
                {previewLog?.uniqueness_score != null && (
                  <Badge variant="outline" className="ml-2 text-xs">{previewLog.uniqueness_score.toFixed(0)}% unic</Badge>
                )}
              </Label>
              {editMode ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[200px]"
                />
              ) : (
                <div className="border border-primary/30 rounded-lg p-4 min-h-[200px] bg-primary/5 text-sm">
                  <div dangerouslySetInnerHTML={{ __html: previewLog?.generated_content || "" }} />
                </div>
              )}
            </div>
          </div>

          {previewLog?.status === "pending" && (
            <DialogFooter className="flex-wrap gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={updateMutation.isPending}>
                <XCircle className="w-4 h-4 mr-1" /> Respinge
              </Button>
              <Button variant="outline" onClick={handleEditThenApprove} disabled={updateMutation.isPending}>
                <Edit className="w-4 h-4 mr-1" /> {editMode ? "Aprobă cu modificări" : "Editează & Aprobă"}
              </Button>
              <Button onClick={handleApprove} disabled={updateMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Aprobă & Publică
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
