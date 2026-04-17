// Stub minim — componenta de vizualizare 360° este folosită în panoul de admin.
// Va fi reconstruită complet când se ajunge la pagina de produs (etapa 3).
interface Product360ViewerProps {
  images?: string[];
  autoRotate?: boolean;
  className?: string;
}

export default function Product360Viewer({ images = [], className = "" }: Product360ViewerProps) {
  if (!images.length) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 text-sm text-muted-foreground ${className}`}>
        Nicio imagine 360° încărcată
      </div>
    );
  }
  return (
    <div className={`relative bg-muted rounded-lg overflow-hidden ${className}`}>
      <img src={images[0]} alt="360° preview" className="w-full h-auto" />
      <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
        🔄 360° preview ({images.length} cadre)
      </div>
    </div>
  );
}
