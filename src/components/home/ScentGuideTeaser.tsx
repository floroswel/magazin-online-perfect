import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScentGuideTeaser() {
  const ref = useScrollReveal();

  return (
    <section className="relative bg-ventuza-dark py-20 md:py-28 overflow-hidden noise-bg" ref={ref}>
      {/* Subtle flame glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container px-4 relative z-10 text-center">
        <div className="max-w-lg mx-auto reveal stagger-1">
          <h2 className="font-serif italic text-[#FAF6F0] text-3xl md:text-5xl leading-tight mb-5">
            Nu știi ce parfum să alegi?
          </h2>
          <p className="font-sans font-light text-[#FAF6F0]/55 text-base mb-10 leading-relaxed">
            Răspunde la 5 întrebări și îți recomandăm lumânarea perfectă
          </p>
          <Link
            to="/quiz-parfum"
            className="btn-cta inline-flex items-center gap-2 font-sans text-sm font-medium border border-primary text-primary px-8 py-3 rounded-full hover:bg-primary hover:text-accent-foreground transition-all"
          >
            Începe quizul →
          </Link>
        </div>
      </div>
    </section>
  );
}
