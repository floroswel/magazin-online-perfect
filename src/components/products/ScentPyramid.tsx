interface ScentPyramidProps {
  topNotes?: string;
  midNotes?: string;
  baseNotes?: string;
}

export default function ScentPyramid({ topNotes, midNotes, baseNotes }: ScentPyramidProps) {
  if (!topNotes && !midNotes && !baseNotes) return null;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">🌸 Piramida Parfumului</h3>
      <div className="space-y-2">
        {topNotes && (
          <div className="group">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-full h-2 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
            </div>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Note de top (primele 30min)</p>
            <p className="text-sm text-foreground">{topNotes}</p>
          </div>
        )}
        {midNotes && (
          <div className="group">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3/4 mx-auto h-2 rounded-full bg-primary/30 group-hover:bg-primary/50 transition-colors" />
            </div>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Note de mijloc (1-3 ore)</p>
            <p className="text-sm text-foreground">{midNotes}</p>
          </div>
        )}
        {baseNotes && (
          <div className="group">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1/2 mx-auto h-2 rounded-full bg-primary/40 group-hover:bg-primary/60 transition-colors" />
            </div>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Note de bază (persistă)</p>
            <p className="text-sm text-foreground">{baseNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
