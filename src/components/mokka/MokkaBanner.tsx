import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, CheckCircle, Zap } from "lucide-react";
import MokkaModal from "./MokkaModal";

export default function MokkaBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="bg-mokka/5 border-y border-mokka/20">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                <span className="text-mokka">Mokka</span> — Cumperi acum, plătești în rate
              </h2>
              <p className="text-muted-foreground mb-4">
                Rate fără dobândă, fără card de credit. Aprobare instant online.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                {[
                  { icon: CreditCard, text: "Fără card de credit" },
                  { icon: Clock, text: "3-24 rate lunare" },
                  { icon: CheckCircle, text: "Aprobare instant" },
                  { icon: Zap, text: "0% dobândă 3 rate" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <item.icon className="h-4 w-4 text-mokka" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="border-mokka text-mokka hover:bg-mokka hover:text-mokka-foreground"
                onClick={() => setModalOpen(true)}
              >
                Află cum funcționează
              </Button>
            </div>
          </div>
        </div>
      </section>
      <MokkaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
