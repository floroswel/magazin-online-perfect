import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Înapoi sus"
      className="fixed bottom-24 lg:bottom-6 right-4 z-40 w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-black hover:scale-110 transition-transform"
      style={{ background: "hsl(var(--footer-accent))" }}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
