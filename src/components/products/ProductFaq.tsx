import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

interface Props {
  product: any;
}

const DEFAULT_FAQ = [
  { q: "Cât durează livrarea?", a: "Livrăm în 2-3 zile lucrătoare prin curier rapid." },
  { q: "Pot returna produsul?", a: "Da, acceptăm retururi în 14 zile pentru produsele nedeschise." },
  { q: "Lumânările sunt handmade?", a: "Da, fiecare lumânare este creată 100% manual de echipa Mama Lucica." },
  { q: "Ce ingrediente folosiți?", a: "Folosim ceară de soia naturală și uleiuri esențiale premium." },
];

export default function ProductFaq({ product }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const { settings } = useSettings();

  // Override from product-level FAQ if available
  const productFaq = (product as any)?.faq;
  const faqs = Array.isArray(productFaq) && productFaq.length > 0
    ? productFaq
    : DEFAULT_FAQ.map(f => ({
        q: f.q,
        a: f.q.includes("ingrediente") && product?.ingredients
          ? product.ingredients
          : f.a.replace("14 zile", `${settings.return_days || "14"} zile`),
      }));

  return (
    <div className="space-y-2">
      <h3 className="text-base font-bold mb-3">Întrebări frecvente</h3>
      {faqs.map((item: any, i: number) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors"
          >
            <span className="text-sm font-medium">{item.q}</span>
            {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {open === i && (
            <div className="px-3 pb-3 text-sm text-muted-foreground border-t border-border pt-2">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
