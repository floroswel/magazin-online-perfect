import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Layers, Play, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  queued: { label: "În așteptare", color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
  running: { label: "Se procesează", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  done: { label: "Finalizat", color: "bg-green-500/15 text-green-500 border-green-500/30" },
  error: { label: "Eroare", color: "bg-red-500/15 text-red-500 border-red-500/30" },
};

const TARGETS = [
  { key: "description", label: "Descriere lungă" },
  { key: "short_description", label: "Descriere scurtă" },
  { key: "meta_title", label: "Meta Title" },
  { key: "meta_description", label: "Meta Description" },
  { key: "tags", label: "Tag-uri" },
  { key: "alt_text", label: "Alt text imagini" },
];

export default function AdminAIBulkJobs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState<"all" | "category">("all");
  const [selectedTargets, setSelectedTargets] = useState<string[]>(["description", "short_description", "meta_title", "meta_description"]);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["ai-bulk-jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("ai_bulk_jobs").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
    refetchInterval: 5000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-for-bulk"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  const [selectedCategory, setSelectedCategory] = useState("");

  const createJobMutation = useMutation({
    mutationFn: async (params: { job_type: string; target_ids: any; total_products: number }) => {
      const { error } = await supabase.from("ai_bulk_jobs").insert({
        job_type: params.job_type,
        target_ids: params.target_ids,
        generation_targets: selectedTargets as any,
        total_products: params.total_products,
        started_by: user?.id || "",
        status: "queued",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-bulk-jobs"] });
      setShowConfirm(false);
      toast.success("Job de generare bulk creat! Procesarea va începe automat.");
    },
    onError: (e) => toast.error(e.message),
  });

  const startAllJob = async () => {
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
    createJobMutation.mutate({ job_type: "all", target_ids: [], total_products: count || 0 });
  };

  const startCategoryJob = async () => {
    if (!selectedCategory) { toast.error("Selectează o categorie"); return; }
    const { data, count } = await supabase.from("products").select("id", { count: "exact" }).eq("category_id", selectedCategory);
    createJobMutation.mutate({
      job_type: "category",
      target_ids: { category_id: selectedCategory },
      total_products: count || 0,
    });
  };

  const toggleTarget = (key: string) => {
    setSelectedTargets((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);
  };

  const runningJobs = jobs.filter((j: any) => j.status === "running");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Generare Bulk AI
          </h2>
          <p className="text-sm text-muted-foreground">Generează conținut AI pentru multiple produse simultan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setConfirmType("category"); setShowConfirm(true); }}>
            Per categorie
          </Button>
          <Button onClick={() => { setConfirmType("all"); setShowConfirm(true); }}>
            <Play className="w-4 h-4 mr-1" /> Generează tot catalogul
          </Button>
        </div>
      </div>

      {/* Running jobs progress */}
      {runningJobs.map((job: any) => (
        <Card key={job.id} className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Job #{job.id.slice(0, 8)} — {job.job_type}
              </span>
              <span className="font-mono">{job.completed}/{job.total_products}</span>
            </div>
            <Progress value={job.total_products > 0 ? (job.completed / job.total_products) * 100 : 0} />
            <div className="flex gap-4 text-xs">
              <span className="text-green-500">✓ {job.completed} completate</span>
              {job.failed > 0 && <span className="text-destructive">✗ {job.failed} eșuate</span>}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Jobs history */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Istoric Joburi</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Se încarcă...</p>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Niciun job de generare bulk.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead>Eșuate</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{job.job_type}</Badge></TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[job.status]?.color || ""}>
                        {STATUS_MAP[job.status]?.label || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.completed}/{job.total_products}</TableCell>
                    <TableCell>{job.failed > 0 ? <span className="text-destructive">{job.failed}</span> : "0"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmare Generare Bulk
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {confirmType === "all"
                ? "Vei genera conținut AI pentru TOATE produsele din catalog. Procesul rulează asincron în fundal."
                : "Selectează categoria pentru care vrei să generezi conținut AI."}
            </p>

            {confirmType === "category" && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="Selectează categorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div>
              <Label className="text-sm font-medium">Ce să generez:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TARGETS.map((t) => (
                  <div key={t.key} className="flex items-center gap-2">
                    <Checkbox checked={selectedTargets.includes(t.key)} onCheckedChange={() => toggleTarget(t.key)} />
                    <Label className="text-sm">{t.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Anulează</Button>
            <Button onClick={confirmType === "all" ? startAllJob : startCategoryJob} disabled={createJobMutation.isPending}>
              {createJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              Pornește Generarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
