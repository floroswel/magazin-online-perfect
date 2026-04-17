import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  size?: "thumbnail" | "card" | "detail" | "hero";
  eager?: boolean;
  blurPlaceholder?: boolean;
  /** Applied to the inner <img> (e.g. object-cover) */
  imgClassName?: string;
}

const SIZE_MAP: Record<string, number> = {
  thumbnail: 300,
  card: 600,
  detail: 1200,
  hero: 1920,
};

/**
 * Optimized image component with:
 * - LQIP blur placeholder
 * - Lazy/eager loading
 * - Width/height to prevent CLS
 * - Responsive srcset hint via sizes
 */
function OptimizedImageInner({
  src,
  alt,
  width,
  height,
  size = "card",
  eager = false,
  blurPlaceholder = true,
  className,
  imgClassName,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const targetWidth = SIZE_MAP[size] || 600;

  // If image is already cached, skip blur
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const imgSrc = src || "/placeholder.svg";

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {/* Blur placeholder */}
      {blurPlaceholder && !loaded && !error && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ filter: "blur(20px)", transform: "scale(1.1)" }}
        />
      )}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        width={width || targetWidth}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        fetchPriority={eager ? "high" : undefined}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true); }}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          !width && !height && !imgClassName && "w-full h-full object-contain",
          imgClassName
        )}
        {...rest}
      />
    </div>
  );
}

const OptimizedImage = memo(OptimizedImageInner);
export default OptimizedImage;
