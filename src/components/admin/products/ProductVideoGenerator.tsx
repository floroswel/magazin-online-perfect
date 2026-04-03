import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProductVideo } from "@/lib/productVideoGenerator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Loader2, CheckCircle2, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  productId: string;
  productName: string;
  images: string[];
  videos: string[] | null;
  onVideoGenerated: (videoUrl: string) => void;
  onVideoRemoved: (videoUrl: string) => void;
}

export default function ProductVideoGenerator({
  productId,
  productName,
  images,
  videos,
  onVideoGenerated,
  onVideoRemoved,
}: Props) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);

  const allImages = images.filter(Boolean);

  const handleGenerate = async () => {
    if (allImages.length < 2) {
      toast.error("Sunt necesare cel puțin 2 imagini pentru a genera un clip");
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      toast.info("Se generează clipul video cinematic din pozele produsului...");

      const videoBlob = await generateProductVideo({
        imageUrls: allImages,
        onProgress: setProgress,
      });

      // Upload to storage
      const fileName = `${productId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("product-videos")
        .upload(fileName, videoBlob, {
          contentType: "video/webm",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-videos")
        .getPublicUrl(fileName);

      const videoUrl = urlData.publicUrl;

      // Save to product videos array
      const currentVideos = videos || [];
      const updatedVideos = [...currentVideos, videoUrl];

      const { error: updateError } = await supabase
        .from("products")
        .update({ videos: updatedVideos } as any)
        .eq("id", productId);

      if (updateError) throw updateError;

      onVideoGenerated(videoUrl);
      toast.success("Clip video cinematic generat și salvat cu succes!");
    } catch (err: any) {
      console.error("Video generation error:", err);
      toast.error(`Eroare la generare: ${err.message}`);
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleRemoveVideo = async (videoUrl: string) => {
    setRemoving(videoUrl);
    try {
      const urlParts = videoUrl.split("/product-videos/");
      if (urlParts[1]) {
        await supabase.storage.from("product-videos").remove([urlParts[1]]);
      }

      const updatedVideos = (videos || []).filter((v) => v !== videoUrl);
      await supabase
        .from("products")
        .update({ videos: updatedVideos.length > 0 ? updatedVideos : null } as any)
        .eq("id", productId);

      onVideoRemoved(videoUrl);
      toast.success("Video șters");
    } catch (err: any) {
      toast.error(`Eroare: ${err.message}`);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Generate 6s Product Video</span>
          {allImages.length < 2 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Min. 2 imagini
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={generating || allImages.length < 2}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Generare {progress}%
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5 mr-1.5" />
              Generate 6s Product Video
            </>
          )}
        </Button>
      </div>

      {generating && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progress < 10 ? "Se încarcă imaginile..." :
             progress < 95 ? "Se renderizează clipul cinematic..." :
             "Se finalizează..."}
          </p>
        </div>
      )}

      {videos && videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((videoUrl, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <video
                src={videoUrl}
                className="w-28 h-16 rounded-md object-cover bg-black"
                muted
                preload="metadata"
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">
                Clip cinematic #{i + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => handleRemoveVideo(videoUrl)}
                disabled={removing === videoUrl}
              >
                {removing === videoUrl ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
