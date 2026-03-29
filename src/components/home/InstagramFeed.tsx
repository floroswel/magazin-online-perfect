import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Instagram } from "lucide-react";

const images = [
  "https://images.unsplash.com/photo-1602607753498-2e513137e061?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1543248939-4296e1fea89b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1608181831718-2501840ddf8c?w=400&h=400&fit=crop",
];

export default function InstagramFeed() {
  const ref = useScrollReveal();

  return (
    <section ref={ref}>
      <div className="text-center py-8 reveal stagger-1">
        <p className="font-sans text-[11px] font-medium tracking-[3px] uppercase text-muted-foreground">
          @mamalucica
        </p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 reveal stagger-2">
        {images.map((img, i) => (
          <a
            key={i}
            href="https://instagram.com/mamalucica"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden"
          >
            <img src={img} alt="Instagram" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300 flex items-center justify-center">
              <Instagram className="h-6 w-6 text-background opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
