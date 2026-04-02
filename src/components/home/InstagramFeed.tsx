import { useEffect, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Camera, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SocialPhoto {
  url: string;
  caption?: string;
}

const FALLBACK_PHOTOS: SocialPhoto[] = [
  { url: "https://images.unsplash.com/photo-1602607167093-5ac4af65e1cd?w=300&h=300&fit=crop", caption: "Lumânări parfumate" },
  { url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&h=300&fit=crop", caption: "Colecția de sezon" },
  { url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=300&fit=crop", caption: "Seturi cadou" },
  { url: "https://images.unsplash.com/photo-1545231027-637d2f6210f8?w=300&h=300&fit=crop", caption: "Lumânări decorative" },
  { url: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=300&h=300&fit=crop", caption: "Aromaterapie" },
  { url: "https://images.unsplash.com/photo-1608181831718-3b43e628bba2?w=300&h=300&fit=crop", caption: "Handmade" },
];

export default function InstagramFeed() {
  const ref = useScrollReveal();
  const [photos, setPhotos] = useState<SocialPhoto[]>(FALLBACK_PHOTOS);
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/mamalucica.ro");

  useEffect(() => {
    // Try loading admin-managed social feed photos from app_settings
    Promise.all([
      supabase.from("app_settings").select("value_json").eq("key", "social_feed_photos").maybeSingle(),
      supabase.from("app_settings").select("value_json").eq("key", "footer_social_links").maybeSingle(),
    ]).then(([photosRes, socialRes]) => {
      if (photosRes.data?.value_json && Array.isArray(photosRes.data.value_json) && photosRes.data.value_json.length > 0) {
        setPhotos(photosRes.data.value_json as unknown as SocialPhoto[]);
      }
      // Extract Instagram link
      if (socialRes.data?.value_json && Array.isArray(socialRes.data.value_json)) {
        const ig = (socialRes.data.value_json as any[]).find((l: any) => l.platform === "instagram" || l.icon === "instagram");
        if (ig?.url && ig.url !== "#") setInstagramUrl(ig.url);
      }
    });
  }, []);

  return (
    <section className="container py-8 md:py-12 px-4" ref={ref}>
      <div className="flex items-center justify-between mb-5 reveal stagger-1">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground">@mamalucica.ro</h2>
        </div>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
        >
          Urmărește-ne <ChevronRight className="w-4 h-4" />
        </a>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 reveal stagger-2">
        {photos.slice(0, 6).map((photo, i) => (
          <a
            key={i}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square rounded-xl overflow-hidden group"
          >
            <img
              src={photo.url}
              alt={photo.caption || `Fotografie ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
