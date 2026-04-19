import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props { title: string; children: ReactNode; defaultOpen?: boolean }

/** Coloană cu accordion pe mobil (<768px), expandată pe desktop. */
export default function FooterColumn({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 md:py-0 md:pointer-events-none"
        aria-expanded={open}
      >
        <h4 className="footer-col-title !mb-0 md:!mb-4">{title}</h4>
        <ChevronDown className={`h-5 w-5 text-white/60 md:hidden transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`${open ? "block" : "hidden"} md:block pb-4 md:pb-0`}>
        {children}
      </div>
    </div>
  );
}
