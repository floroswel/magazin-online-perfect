import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function InstagramFeed() {
  const { data: images } = useQuery({
    queryKey: ["instagram-feed"],
    queryFn: async () => {
      const { data } = await supabase.from("instagram_feed_images").select("*").order("sort_order").limit(6);
      return data || [];
    },
  });

  // Show section even with placeholder if no images uploaded
  const hasImages = images && images.length > 0;

  return (
    <section className="py-10 bg-card">
      <div className="ml-container">
        <h2 className="section-title">📸 Urmărește-ne pe Instagram @mamalucica</h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          {hasImages ? (
            images.map((img) => (
              <a
                key={img.id}
                href={img.link_url || "https://instagram.com/mamalucica"}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-secondary group"
              >
                <img
                  src={img.image_url}
                  alt={img.caption || "Instagram"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </a>
            ))
          ) : (
            // 6 placeholder slots
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-secondary flex items-center justify-center text-3xl text-muted-foreground/30">
                🕯️
              </div>
            ))
          )}
        </div>

        <div className="text-center">
          <a
            href="https://instagram.com/mamalucica"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            Vezi profilul nostru →
          </a>
        </div>
      </div>
    </section>
  );
}
