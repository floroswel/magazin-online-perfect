import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, RotateCcw, ZoomIn, ZoomOut, Move, Download, Image as ImageIcon, Flame } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface CandleOverlay {
  x: number;
  y: number;
  scale: number;
  product: Tables<"products">;
}

export default function VirtualTryOn() {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [products, setProducts] = useState<Tables<"products">[]>([]);
  const [overlays, setOverlays] = useState<CandleOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 600, h: 400 });

  usePageSeo({
    title: "Virtual Try-On — Vizualizează Lumânările în Camera Ta | MamaLucica",
    description: "Încarcă o poză cu camera ta și vezi cum arată lumânările noastre pe masă, raft sau birou. Experimentează înainte de a cumpăra!",
  });

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("visible", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setProducts(data || []));
  }, []);

  const handleRoomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRoomImage(ev.target?.result as string);
      setOverlays([]);
      setSelectedOverlay(null);
    };
    reader.readAsDataURL(file);
  };

  const addCandle = (product: Tables<"products">) => {
    const newOverlay: CandleOverlay = {
      x: containerSize.w / 2 - 40,
      y: containerSize.h / 2 - 50,
      scale: 1,
      product,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setSelectedOverlay(overlays.length);
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setDragging(index);
    setSelectedOverlay(index);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - overlays[index].x,
        y: e.clientY - rect.top - overlays[index].y,
      });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    setOverlays(prev => prev.map((o, i) => i === dragging ? { ...o, x, y } : o));
  }, [dragging, dragOffset]);

  const handleMouseUp = () => setDragging(null);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    e.preventDefault();
    setDragging(index);
    setSelectedOverlay(index);
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (rect) {
      setDragOffset({
        x: touch.clientX - rect.left - overlays[index].x,
        y: touch.clientY - rect.top - overlays[index].y,
      });
    }
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragging === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    const touch = e.touches[0];
    if (!rect) return;
    const x = touch.clientX - rect.left - dragOffset.x;
    const y = touch.clientY - rect.top - dragOffset.y;
    setOverlays(prev => prev.map((o, i) => i === dragging ? { ...o, x, y } : o));
  }, [dragging, dragOffset]);

  const handleScale = (value: number[]) => {
    if (selectedOverlay === null) return;
    setOverlays(prev => prev.map((o, i) => i === selectedOverlay ? { ...o, scale: value[0] } : o));
  };

  const removeOverlay = (index: number) => {
    setOverlays(prev => prev.filter((_, i) => i !== index));
    setSelectedOverlay(null);
  };

  const resetAll = () => {
    setOverlays([]);
    setSelectedOverlay(null);
  };

  const downloadResult = () => {
    const canvas = canvasRef.current;
    if (!canvas || !roomImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const scaleX = img.width / containerSize.w;
      const scaleY = img.height / containerSize.h;

      ctx.drawImage(img, 0, 0);

      let loaded = 0;
      if (overlays.length === 0) {
        const link = document.createElement("a");
        link.download = "mamalucica-tryOn.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        return;
      }

      overlays.forEach((overlay) => {
        const candleImg = new Image();
        candleImg.crossOrigin = "anonymous";
        candleImg.onload = () => {
          const w = 80 * overlay.scale * scaleX;
          const h = 100 * overlay.scale * scaleY;
          const x = overlay.x * scaleX;
          const y = overlay.y * scaleY;

          // Drop shadow
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 15 * overlay.scale;
          ctx.shadowOffsetY = 5 * overlay.scale;
          ctx.drawImage(candleImg, x, y, w, h);
          ctx.shadowColor = "transparent";

          loaded++;
          if (loaded === overlays.length) {
            const link = document.createElement("a");
            link.download = "mamalucica-tryOn.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };
        candleImg.src = overlay.product.image_url || "";
      });
    };
    img.src = roomImage;
  };

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [roomImage]);

  return (
    <Layout>
      <div className="container px-4 py-6 md:py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-3">
            <Flame className="w-4 h-4" /> Funcție exclusivă
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-2">
            Virtual Try-On Room
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Încarcă o poză cu camera ta și trage lumânările pe masă, raft sau birou pentru a vedea cum arată.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Canvas area */}
          <div className="space-y-4">
            {!roomImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">Încarcă o poză cu camera ta</p>
                <p className="text-sm text-muted-foreground">JPG, PNG — max 10MB</p>
              </div>
            ) : (
              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden bg-muted border border-border select-none"
                style={{ minHeight: 400 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setDragging(null)}
                onClick={() => setSelectedOverlay(null)}
              >
                <img
                  src={roomImage}
                  alt="Camera ta"
                  className="w-full h-auto block"
                  draggable={false}
                />

                {/* Candle overlays */}
                {overlays.map((overlay, i) => (
                  <div
                    key={i}
                    className={`absolute cursor-move transition-shadow ${
                      selectedOverlay === i ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""
                    }`}
                    style={{
                      left: overlay.x,
                      top: overlay.y,
                      width: 80 * overlay.scale,
                      height: 100 * overlay.scale,
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, i); }}
                    onTouchStart={(e) => handleTouchStart(e, i)}
                    onClick={(e) => { e.stopPropagation(); setSelectedOverlay(i); }}
                  >
                    <img
                      src={overlay.product.image_url || ""}
                      alt={overlay.product.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                    {selectedOverlay === i && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeOverlay(i); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center hover:scale-110 transition"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            {roomImage && (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1.5" /> Schimbă poza
                </Button>
                <Button variant="outline" size="sm" onClick={resetAll}>
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Resetează
                </Button>
                {overlays.length > 0 && (
                  <Button size="sm" onClick={downloadResult}>
                    <Download className="w-4 h-4 mr-1.5" /> Descarcă rezultat
                  </Button>
                )}

                {selectedOverlay !== null && (
                  <div className="flex items-center gap-2 ml-auto">
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                    <Slider
                      value={[overlays[selectedOverlay]?.scale || 1]}
                      onValueChange={handleScale}
                      min={0.3}
                      max={3}
                      step={0.1}
                      className="w-32"
                    />
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Product picker */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Alege lumânări
            </h3>
            <p className="text-xs text-muted-foreground">
              Click pe o lumânare pentru a o adăuga în poză. Trage pentru a o poziționa.
            </p>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => addCandle(p)}
                  className="group border border-border rounded-xl p-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  disabled={!roomImage}
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-1.5">
                    <img
                      src={p.image_url || "/placeholder.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-primary font-semibold">{p.price} lei</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-12 bg-muted/30 rounded-2xl p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 text-center">Cum funcționează?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Încarcă o poză", desc: "Fotografiază camera, masa sau raftul unde vrei să pui lumânarea." },
              { step: "2", title: "Alege și plasează", desc: "Selectează lumânări din catalog și trage-le pe poza ta. Ajustează mărimea." },
              { step: "3", title: "Salvează rezultatul", desc: "Descarcă imaginea finală sau partajează-o. Apoi cumpără lumânarea preferată!" },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRoomUpload}
      />
    </Layout>
  );
}
