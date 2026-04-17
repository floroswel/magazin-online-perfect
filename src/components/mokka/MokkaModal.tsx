import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface MokkaModalProps {
  isOpen: boolean;
  onClose: () => void;
  iframeUrl?: string;
}

const steps = [
  { title: "Alegi produsul", desc: "Adaugi în coș și selectezi Mokka la plată." },
  { title: "Completezi cererea", desc: "Completezi un formular scurt, direct pe site." },
  { title: "Primești aprobarea", desc: "Decizia vine instant, fără acte la bancă." },
  { title: "Plătești în rate", desc: "Rate fixe, fără dobândă pentru 3 luni." },
];

export default function MokkaModal({ isOpen, onClose, iframeUrl }: MokkaModalProps) {
  if (iframeUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[620px] p-0 overflow-hidden">
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0 rounded-lg"
            title="Mokka Payment"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-mokka font-bold">Mokka</span> — Plată în rate
          </DialogTitle>
          <DialogDescription>
            Cumperi acum, plătești în rate fără dobândă. Fără card de credit, fără birocrație.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-mokka/10 text-mokka flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-mokka/5 border border-mokka/20 p-4 space-y-2">
          <h4 className="font-semibold text-sm text-foreground">Beneficii</h4>
          {["0% dobândă pentru 3 rate", "Aprobare instant online", "Fără card de credit", "Banii ajung la magazin imediat"].map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-mokka flex-shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
