import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScentGuideTeaser() {
  const ref = useScrollReveal();

  return (
    <section className="relative bg-foreground py-20 md:py-28 overflow-hidden" ref={ref}>
      <div className="container px-4 relative z-10 text-center">
        <div className="max-w-lg mx-auto reveal stagger-1">
          <h2 className="font-serif text-background text-3xl md:text-5xl leading-tight mb-5">
            Nu știi ce parfum să alegi?
          </h2>
          <p className="font-sans font-light text-background/55 text-base mb-10 leading-relaxed">
            Răspunde la 5 întrebări și îți recomandăm lumânarea perfectă
          </p>
          <Link
            to="/quiz-parfum"
            className="btn-cta inline-flex items-center gap-2 font-sans text-sm font-medium border border-primary text-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            Începe quizul →
          </Link>
        </div>
      </div>
    </section>
  );
}
