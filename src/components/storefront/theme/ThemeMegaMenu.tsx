import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronRight, Menu } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
}

export default function ThemeMegaMenu() {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);

  const bannerImage = settings.megamenu_banner_image || "";
  const bannerUrl = settings.megamenu_banner_url || "/catalog";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id, image_url")
        .order("sort_order");
      if (data) setCategories(data);
    })();
  }, []);

  const parents = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  if (!categories.length) return null;

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="dept-trigger"
      >
        <Menu className="w-5 h-5" />
        <span>Categorii</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 bg-background border border-border rounded-lg shadow-xl flex min-w-[600px] max-w-[800px]">
          {/* Left sidebar */}
          <div className="w-56 border-r border-border py-2">
            {parents.map(cat => (
              <button
                key={cat.id}
                onMouseEnter={() => setActiveParent(cat.id)}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span>{cat.name}</span>
                {getChildren(cat.id).length > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
            ))}
          </div>

          {/* Right panel */}
          <div className="flex-1 p-4">
            {activeParent && getChildren(activeParent).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {getChildren(activeParent).map(child => (
                  <Link
                    key={child.id}
                    to={`/catalog?category=${child.slug}`}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 text-sm text-foreground hover:bg-muted rounded transition-colors"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Selectează o categorie
              </div>
            )}

            {bannerImage && (
              <Link to={bannerUrl} onClick={() => setOpen(false)} className="block mt-4">
                <img src={bannerImage} alt="Promoție" className="w-full rounded" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
