import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface AttributeExtractorModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  description: string;
  currentSpecs: Record<string, string>;
  onApply: (specs: Record<string, string>) => void;
}

interface ExtractedAttr {
  key: string;
  value: string;
  selected: boolean;
}

export default function AttributeExtractorModal({
  open, onClose, productName, description, currentSpecs, onApply,
}: AttributeExtractorModalProps) {
  const [extracting, setExtracting] = useState(false);
  const [attributes, setAttributes] = useState<ExtractedAttr[]>([]);

  const extract = async () => {
    if (!description?.trim()) { toast.error("Produsul nu are descriere"); return; }
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-attributes", {
        body: { name: productName, description: description.replace(/<[^>]*>/g, "") },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const attrs = (data.attributes || []).map((a: any) => ({
        key: a.key,
        value: a.value,
        selected: !currentSpecs[a.key], // auto-select only new ones
      }));
      setAttributes(attrs);
      toast.success(`${attrs.length} atribute extrase!`);
    } catch (err: any) {
      toast.error(err.message || "Eroare la extragere");
    }
    setExtracting(false);
  };

  const toggleAttr = (idx: number) => {
    setAttributes((prev) => prev.map((a, i) => i === idx ? { ...a, selected: !a.selected } : a));
  };

  const updateAttr = (idx: number, field: "key" | "value", val: string) => {
    setAttributes((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
  };

  const applySelected = () => {
    const selected = attributes.filter((a) => a.selected);
    if (!selected.length) { toast.error("Selectează cel puțin un atribut"); return; }
    const newSpecs = { ...currentSpecs };
    selected.forEach((a) => { newSpecs[a.key] = a.value; });
    onApply(newSpecs);
    toast.success(`${selected.length} atribute aplicate!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Extrage atribute din descriere
          </DialogTitle>
          <DialogDescription>AI va analiza descrierea și va sugera atribute tehnice</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {attributes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                {description?.trim() ? "Apasă butonul pentru a extrage atributele din descriere." : "Produsul nu are descriere din care să se extragă atribute."}
              </p>
              <Button onClick={extract} disabled={extracting || !description?.trim()} className="gap-2">
                {extracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {extracting ? "Se extrage..." : "Extrage atribute"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
                    <Checkbox checked={attr.selected} onCheckedChange={() => toggleAttr(idx)} />
                    <Input
                      value={attr.key}
                      onChange={(e) => updateAttr(idx, "key", e.target.value)}
                      className="flex-1 h-8 text-sm font-medium"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      value={attr.value}
                      onChange={(e) => updateAttr(idx, "value", e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    {currentSpecs[attr.key] && (
                      <span className="text-xs text-yellow-500" title={`Existent: ${currentSpecs[attr.key]}`}>⚠️</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={extract} disabled={extracting} className="gap-1">
                  <Sparkles className="w-3 h-3" /> Regenerează
                </Button>
                <Button onClick={applySelected} className="gap-1">
                  <Check className="w-4 h-4" /> Aplică {attributes.filter((a) => a.selected).length} atribute
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
