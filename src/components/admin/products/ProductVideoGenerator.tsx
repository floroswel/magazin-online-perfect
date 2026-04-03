import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateProductVideo } from "@/lib/productVideoGenerator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Loader2, CheckCircle2, Trash2 } from "lucide-react";
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
      toast.info("Se generează clipul video din pozele produsului...");

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
      toast.success("Clip video generat și salvat cu succes!");
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
      // Extract path from URL
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
          <Video className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Clip Video AI</span>
          {allImages.length < 2 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Min. 2 imagini
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating || allImages.length < 2}
        >
          {generating ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {progress}%
            </>
          ) : (
            <>
              <Video className="w-3 h-3 mr-1" />
              Generează Clip 6s
            </>
          )}
        </Button>
      </div>

      {generating && (
        <Progress value={progress} className="h-1.5" />
      )}

      {videos && videos.length > 0 && (
        <div className="space-y-2">
          {videos.map((videoUrl, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <video
                src={videoUrl}
                className="w-24 h-14 rounded object-cover bg-black"
                muted
                preload="metadata"
              />
              <span className="text-xs text-muted-foreground flex-1 truncate">
                Clip #{i + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
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
