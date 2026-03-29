import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScentGuideTeaser() {
  const ref = useScrollReveal();

  return (
    <section className="py-14 md:py-20" ref={ref}>
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/catalog?category=barbati" className="group relative overflow-hidden aspect-[4/5] reveal stagger-1">
            <img
              src="https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=800&h=1000&fit=crop"
              alt="Lumânări pentru el"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-sans text-[12px] font-medium tracking-[2px] uppercase text-white bg-foreground px-6 py-3 inline-block hover:opacity-90 transition-opacity">
                Lumânări pentru El
              </span>
            </div>
          </Link>
          <Link to="/catalog?category=femei" className="group relative overflow-hidden aspect-[4/5] reveal stagger-2">
            <img
              src="https://images.unsplash.com/photo-1608181831718-2501840ddf8c?w=800&h=1000&fit=crop"
              alt="Lumânări pentru ea"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-sans text-[12px] font-medium tracking-[2px] uppercase text-white bg-foreground px-6 py-3 inline-block hover:opacity-90 transition-opacity">
                Lumânări pentru Ea
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
