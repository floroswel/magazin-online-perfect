import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload, Trash2, Loader2, RotateCw, Eye, AlertTriangle, X, GripVertical
} from "lucide-react";
import Product360Viewer from "@/components/products/Product360Viewer";

interface Admin360SliderManagerProps {
  productId: string;
  productName?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Admin360SliderManager({ productId, productName }: Admin360SliderManagerProps) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [overrideAutoRotate, setOverrideAutoRotate] = useState<boolean | null>(null);
  const [overrideSpeed, setOverrideSpeed] = useState<number | null>(null);

  const { data: slider } = useQuery({
    queryKey: ["product-360-slider", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_360_sliders" as any)
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      if (data) {
        setOverrideAutoRotate((data as any).auto_rotate);
        setOverrideSpeed((data as any).rotation_speed);
      }
      return data as any;
    },
  });

  const { data: frames = [], isLoading: framesLoading } = useQuery({
    queryKey: ["product-360-frames", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_360_frames" as any)
        .select("*")
        .eq("product_id", productId)
        .order("frame_number");
      return (data as any[]) || [];
    },
  });

  const ensureSlider = async (): Promise<string> => {
    if (slider?.id) return slider.id;
    const { data, error } = await supabase
      .from("product_360_sliders" as any)
      .insert({ product_id: productId, frame_count: 0 } as any)
      .select("id")
      .single();
    if (error) throw error;
    return (data as any).id;
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const invalid = fileArr.filter((f) => !ACCEPTED_TYPES.includes(f.type));
    if (invalid.length) {
      toast.error(`Doar JPG, PNG și WebP sunt acceptate (${invalid.map((f) => f.name).join(", ")})`);
      return;
    }
    const tooLarge = fileArr.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge.length) {
      toast.error(`Fișiere prea mari (>5MB): ${tooLarge.map((f) => f.name).join(", ")}`);
      return;
    }

    setUploading(true);
    try {
      const sliderId = await ensureSlider();
      const sorted = [...fileArr].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const startNum = frames.length + 1;

      for (let i = 0; i < sorted.length; i++) {
        const file = sorted[i];
        const ext = file.name.split(".").pop() || "jpg";
        const frameNum = startNum + i;
        const path = `${productId}/frame_${String(frameNum).padStart(3, "0")}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("360-sliders")
          .upload(path, file, { upsert: true });
        if (upErr) {
          toast.error(`Eroare upload ${file.name}: ${upErr.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("360-sliders")
          .getPublicUrl(path);

        await supabase.from("product_360_frames" as any).insert({
          slider_id: sliderId,
          product_id: productId,
          frame_number: frameNum,
          storage_path: path,
          public_url: urlData.publicUrl,
          file_size: file.size,
          original_filename: file.name,
        } as any);
      }

      // Update frame count
      await supabase
        .from("product_360_sliders" as any)
        .update({ frame_count: frames.length + sorted.length, updated_at: new Date().toISOString() } as any)
        .eq("id", sliderId);

      qc.invalidateQueries({ queryKey: ["product-360-frames", productId] });
      qc.invalidateQueries({ queryKey: ["product-360-slider", productId] });
      toast.success(`${sorted.length} cadre încărcate cu succes!`);
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  }, [frames, productId, slider]);

  const deleteFrame = useMutation({
    mutationFn: async (frame: any) => {
      await supabase.storage.from("360-sliders").remove([frame.storage_path]);
      await supabase.from("product_360_frames" as any).delete().eq("id", frame.id);
      // Renumber remaining frames
      const remaining = frames.filter((f: any) => f.id !== frame.id);
      for (let i = 0; i < remaining.length; i++) {
        await supabase
          .from("product_360_frames" as any)
          .update({ frame_number: i + 1 } as any)
          .eq("id", remaining[i].id);
      }
      if (slider?.id) {
        await supabase
          .from("product_360_sliders" as any)
          .update({ frame_count: remaining.length, updated_at: new Date().toISOString() } as any)
          .eq("id", slider.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-360-frames", productId] });
      qc.invalidateQueries({ queryKey: ["product-360-slider", productId] });
      toast.success("Cadru șters");
    },
  });

  const deleteAll = useMutation({
    mutationFn: async () => {
      const paths = frames.map((f: any) => f.storage_path);
      if (paths.length) await supabase.storage.from("360-sliders").remove(paths);
      for (const f of frames) {
        await supabase.from("product_360_frames" as any).delete().eq("id", f.id);
      }
      if (slider?.id) {
        await supabase
          .from("product_360_sliders" as any)
          .update({ frame_count: 0, updated_at: new Date().toISOString() } as any)
          .eq("id", slider.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-360-frames", productId] });
      qc.invalidateQueries({ queryKey: ["product-360-slider", productId] });
      toast.success("Toate cadrele au fost șterse");
    },
  });

  const saveOverrides = useMutation({
    mutationFn: async () => {
      if (!slider?.id) return;
      await supabase
        .from("product_360_sliders" as any)
        .update({
          auto_rotate: overrideAutoRotate,
          rotation_speed: overrideSpeed,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", slider.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-360-slider", productId] });
      toast.success("Setări produs salvate");
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5 text-primary" /> 360° Slider
              {productName && <span className="text-muted-foreground font-normal text-sm">— {productName}</span>}
            </CardTitle>
            <CardDescription>{frames.length} cadre încărcate</CardDescription>
          </div>
          {frames.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" /> Previzualizare 360°
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Ești sigur că vrei să ștergi toate cadrele?")) deleteAll.mutate();
                }}
                disabled={deleteAll.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Șterge toate
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Se încarcă cadrele...</p>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium text-foreground">Trage imaginile aici sau apasă pentru a selecta</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP • Max 5MB per fișier • Recomandat: 24-72 cadre</p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ position: "relative", marginTop: 8 }}
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </>
          )}
        </div>

        {/* Frame grid */}
        {frames.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {frames.map((frame: any) => (
              <div key={frame.id} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted/30">
                <img
                  src={frame.public_url}
                  alt={`Cadru ${frame.frame_number}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold bg-background/70 text-foreground py-0.5">
                  {frame.frame_number}
                </span>
                <button
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteFrame.mutate(frame)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {frames.length === 1 && (
          <Alert className="border-accent bg-accent/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">Minim 2 cadre necesare pentru rotație. Încarcă mai multe imagini.</AlertDescription>
          </Alert>
        )}

        {/* Per-product overrides */}
        {slider && frames.length > 0 && (
          <>
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Setări per produs (suprascrie global)</p>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-rotație</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {overrideAutoRotate === null ? "Global" : overrideAutoRotate ? "DA" : "NU"}
                  </Badge>
                  <Switch
                    checked={overrideAutoRotate ?? false}
                    onCheckedChange={(v) => setOverrideAutoRotate(v)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Viteză rotație</Label>
                  <span className="text-xs font-medium text-primary">{overrideSpeed ?? "Global"}</span>
                </div>
                <Slider
                  value={[overrideSpeed ?? 5]}
                  onValueChange={([v]) => setOverrideSpeed(v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => saveOverrides.mutate()} disabled={saveOverrides.isPending}>
                Salvează setările produsului
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Previzualizare 360° — {productName || "Produs"}</DialogTitle>
          </DialogHeader>
          <div className="aspect-square">
            <Product360Viewer productId={productId} className="w-full h-full" />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
