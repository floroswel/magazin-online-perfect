import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, ChevronLeft, ChevronRight, Play, Pause, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product360ViewerProps {
  productId: string;
  className?: string;
}

export default function Product360Viewer({ productId, className }: Product360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageCache = useRef<HTMLImageElement[]>([]);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["slider-360-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("slider_360_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: slider } = useQuery({
    queryKey: ["product-360-slider", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_360_sliders" as any)
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();
      return data as any;
    },
  });

  const { data: frames = [] } = useQuery({
    queryKey: ["product-360-frames", productId],
    enabled: !!slider,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_360_frames" as any)
        .select("*")
        .eq("product_id", productId)
        .order("frame_number");
      return (data as any[]) || [];
    },
  });

  const totalFrames = frames.length;
  const showControls = settings?.show_controls ?? true;
  const autoRotate = slider?.auto_rotate ?? settings?.auto_rotate_default ?? false;
  const speed = slider?.rotation_speed ?? settings?.rotation_speed_default ?? 5;

  // Preload images
  useEffect(() => {
    if (frames.length === 0) return;
    setLoadedCount(0);
    setImagesLoaded(false);
    const imgs: HTMLImageElement[] = [];

    frames.forEach((frame: any, i: number) => {
      const img = new Image();
      img.onload = () => {
        setLoadedCount((c) => {
          const next = c + 1;
          if (next >= frames.length) setImagesLoaded(true);
          return next;
        });
      };
      img.onerror = () => setLoadedCount((c) => c + 1);
      img.src = frame.public_url;
      imgs[i] = img;
    });

    imageCache.current = imgs;
  }, [frames]);

  // Auto rotate
  useEffect(() => {
    if (isPlaying && totalFrames > 1 && imagesLoaded) {
      const interval = Math.max(30, 200 - speed * 18);
      autoRotateRef.current = setInterval(() => {
        setCurrentFrame((f) => (f + 1) % totalFrames);
      }, interval);
    }
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [isPlaying, totalFrames, speed, imagesLoaded]);

  // Start auto-rotate on load if configured
  useEffect(() => {
    if (autoRotate && imagesLoaded && totalFrames > 1) {
      setIsPlaying(true);
    }
  }, [autoRotate, imagesLoaded, totalFrames]);

  const pauseAutoRotate = useCallback(() => {
    setIsPlaying(false);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    if (autoRotate) {
      pauseTimeoutRef.current = setTimeout(() => setIsPlaying(true), 2000);
    }
  }, [autoRotate]);

  // Mouse handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (totalFrames <= 1) return;
    setIsDragging(true);
    setStartX(e.clientX);
    pauseAutoRotate();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [totalFrames, pauseAutoRotate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || totalFrames <= 1) return;
    const deltaX = e.clientX - startX;
    const sensitivity = Math.max(2, Math.floor(300 / totalFrames));
    if (Math.abs(deltaX) >= sensitivity) {
      const direction = deltaX > 0 ? 1 : -1;
      setCurrentFrame((f) => (f + direction + totalFrames) % totalFrames);
      setStartX(e.clientX);
    }
  }, [isDragging, startX, totalFrames]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch with minimum delta for mobile scroll
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || totalFrames <= 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    if (Math.abs(deltaX) >= 3) {
      e.preventDefault();
    }
  }, [isDragging, startX, totalFrames]);

  const rotateLeft = () => {
    setCurrentFrame((f) => (f - 1 + totalFrames) % totalFrames);
    pauseAutoRotate();
  };

  const rotateRight = () => {
    setCurrentFrame((f) => (f + 1) % totalFrames);
    pauseAutoRotate();
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  if (!settings?.enabled || !slider || frames.length === 0) return null;

  const loadProgress = totalFrames > 0 ? Math.round((loadedCount / totalFrames) * 100) : 0;
  const currentUrl = frames[currentFrame]?.public_url;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative select-none bg-muted/30 rounded-lg overflow-hidden",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "pan-y" }}
    >
      {/* Loading overlay */}
      {!imagesLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Încărcare 360°... {loadProgress}%</p>
          <div className="w-32 h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Current frame */}
      {currentUrl && (
        <img
          src={currentUrl}
          alt={`Cadru 360° ${currentFrame + 1}/${totalFrames}`}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      )}

      {/* 360° badge */}
      <div className="absolute top-3 left-3 z-20">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-md">
          <RotateCw className="h-3 w-3" /> 360°
        </span>
      </div>

      {/* Frame counter */}
      <div className="absolute bottom-3 left-3 z-20">
        <span className="text-xs text-muted-foreground bg-background/70 px-2 py-0.5 rounded">
          {currentFrame + 1} / {totalFrames}
        </span>
      </div>

      {/* Controls */}
      {showControls && imagesLoaded && totalFrames > 1 && (
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={rotateLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={rotateRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8 shadow" onClick={toggleFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Single frame warning */}
      {totalFrames === 1 && imagesLoaded && (
        <div className="absolute bottom-3 left-3 z-20">
          <span className="text-xs text-accent bg-accent/10 px-2 py-1 rounded">
            Minim 2 cadre necesare pentru rotație
          </span>
        </div>
      )}
    </div>
  );
}
