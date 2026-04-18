import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, GitCompareArrows } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCompare } from "@/hooks/useCompare";
import { Button } from "@/components/ui/button";

interface Item {
  id: string;
  name: string;
  image_url: string | null;
}

export default function CompareBar() {
  const { ids, remove, clear, count } = useCompare();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (ids.length < 2) {
      setItems([]);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from("products")
        .select("id, name, image_url")
        .in("id", ids);
      if (data) {
        // preserve order
        const map = new Map(data.map((d: Item) => [d.id, d]));
        setItems(ids.map((id) => map.get(id)).filter(Boolean) as Item[]);
      }
    })();
  }, [ids]);

  if (count < 2) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg lg:bottom-0 bottom-20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-auto flex-wrap">
          <GitCompareArrows className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium hidden sm:inline">Comparație ({count}):</span>
          <div className="flex gap-2">
            {items.map((it) => (
              <div key={it.id} className="relative group">
                <div className="w-12 h-12 rounded-md border border-border bg-muted overflow-hidden">
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <button
                  onClick={() => remove(it.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                  aria-label="Elimină"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clear}>
          Golește
        </Button>
        <Button size="sm" asChild>
          <Link to="/compara">Compară acum</Link>
        </Button>
      </div>
    </div>
  );
}
