import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  mainImage: string;
  images?: string[] | null;
  videos?: string[] | null;
  alt: string;
}

type GalleryItem = { type: "image"; url: string } | { type: "video"; url: string };

export default function ProductImageGallery({ mainImage, images, videos, alt }: Props) {
  const allItems: GalleryItem[] = [
    { type: "image", url: mainImage },
    ...(images || []).filter(img => img !== mainImage).map(url => ({ type: "image" as const, url })),
    ...(videos || []).map(url => ({ type: "video" as const, url })),
  ];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const currentItem = allItems[selectedIndex] || { type: "image" as const, url: "/placeholder.svg" };
  const isVideo = currentItem.type === "video";

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  const handleMouseEnter = () => !isVideo && setZoomActive(true);
  const handleMouseLeave = () => setZoomActive(false);

  const goTo = (index: number) => {
    const newIndex = (index + allItems.length) % allItems.length;
    setSelectedIndex(newIndex);
    setZoomActive(false);
    if (thumbnailsRef.current) {
      const thumb = thumbnailsRef.current.children[newIndex] as HTMLElement;
      thumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goTo(selectedIndex - 1);
    if (e.key === "ArrowRight") goTo(selectedIndex + 1);
    if (e.key === "Escape") setShowFullscreen(false);
  }, [selectedIndex]);

  return (
    <>
      <div className="space-y-3" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Galerie imagini produs">
        {/* Main display */}
        <div
          ref={imageContainerRef}
          className={`relative bg-white rounded-lg border overflow-hidden group ${isVideo ? "cursor-default" : "cursor-crosshair"}`}
          style={{ aspectRatio: "1/1" }}
          onMouseMove={!isVideo ? handleMouseMove : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => !isVideo && setShowFullscreen(true)}
        >
          {isVideo ? (
            <video
              src={currentItem.url}
              className="w-full h-full object-contain p-2 bg-black"
              controls
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <>
              <img
                src={currentItem.url}
                alt={alt}
                className="w-full h-full object-contain p-6 transition-opacity duration-200"
                style={{ opacity: zoomActive ? 0 : 1 }}
                draggable={false}
              />
              {zoomActive && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${currentItem.url})`,
                    backgroundSize: "250%",
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 text-white rounded-full p-1.5">
                  <ZoomIn className="h-4 w-4" />
                </div>
                <div className="bg-black/50 text-white rounded-full p-1.5">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </div>
            </>
          )}

          {/* Navigation arrows */}
          {allItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}
              >
                <ChevronRight className="h-4 w-4 text-foreground" />
              </Button>
            </>
          )}

          {/* Counter */}
          {allItems.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {selectedIndex + 1} / {allItems.length}
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {allItems.length > 1 && (
          <div className="relative">
            <div
              ref={thumbnailsRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
              style={{ scrollbarWidth: "thin" }}
            >
              {allItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden transition-all duration-200 relative ${
                    i === selectedIndex
                      ? "border-primary ring-1 ring-primary/30 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={`${alt} - ${i + 1}`}
                      className="w-full h-full object-contain p-1 bg-white"
                      draggable={false}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen lightbox (images only) */}
      {showFullscreen && !isVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setShowFullscreen(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-label="Imagine mărită"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-10"
            onClick={() => setShowFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <img
            src={currentItem.url}
            alt={alt}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {allItems.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                onClick={(e) => { e.stopPropagation(); goTo(selectedIndex - 1); }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
                onClick={(e) => { e.stopPropagation(); goTo(selectedIndex + 1); }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {allItems.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-lg p-2 max-w-[80vw] overflow-x-auto">
              {allItems.map((item, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); goTo(i); }}
                  className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all ${
                    i === selectedIndex ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-black/80 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-contain bg-white p-0.5" draggable={false} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
