import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

interface AIGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  currentValues: {
    description?: string;
    short_description?: string;
    meta_title?: string;
    meta_description?: string;
    tags?: string[];
  };
  brand?: string;
  category?: string;
  specs?: Record<string, string>;
  onApply: (field: string, value: any) => void;
  onApplyAll: (values: {
    description: string;
    short_description: string;
    meta_title: string;
    meta_description: string;
    tags: string[];
  }) => void;
}

interface GeneratedContent {
  description: string;
  short_description: string;
  meta_title: string;
  meta_description: string;
  tags: string[];
}

export default function AIGeneratorModal({
  open, onClose, productName, currentValues, brand, category, specs, onApply, onApplyAll,
}: AIGeneratorModalProps) {
  const [keyFeatures, setKeyFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("general");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("ro");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [edited, setEdited] = useState<GeneratedContent | null>(null);

  const generate = async () => {
    if (!productName.trim()) { toast.error("Numele produsului este necesar"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-content", {
        body: { name: productName, brand, category, specs, key_features: keyFeatures, target_audience: targetAudience, tone, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      setEdited(data);
      toast.success("Conținut generat cu succes!");
    } catch (err: any) {
      toast.error(err.message || "Eroare la generare");
    }
    setGenerating(false);
  };

  const applyField = (field: string) => {
    if (!edited) return;
    onApply(field, (edited as any)[field]);
    toast.success(`${field === "description" ? "Descriere" : field === "short_description" ? "Descriere scurtă" : field === "meta_title" ? "Meta titlu" : field === "meta_description" ? "Meta descriere" : "Tag-uri"} aplicat(ă)!`);
  };

  const applyAll = () => {
    if (!edited) return;
    onApplyAll(edited);
    toast.success("Toate câmpurile aplicate!");
    onClose();
  };

  const updateEdited = (field: keyof GeneratedContent, value: any) => {
    if (!edited) return;
    setEdited({ ...edited, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generator AI Conținut Produs
          </DialogTitle>
          <DialogDescription>Generează automat descrieri, meta tag-uri și tag-uri folosind AI</DialogDescription>
        </DialogHeader>

        {/* Input Section */}
        <div className="space-y-4 border-b border-border pb-4">
          <div className="space-y-2">
            <Label>Produs</Label>
            <Input value={productName} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Caracteristici cheie (opțional)</Label>
            <Textarea
              value={keyFeatures}
              onChange={(e) => setKeyFeatures(e.target.value)}
              placeholder="ex: waterproof, 500ml, oțel inoxidabil, izolat termic..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Public țintă</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="men">Bărbați</SelectItem>
                  <SelectItem value="women">Femei</SelectItem>
                  <SelectItem value="children">Copii</SelectItem>
                  <SelectItem value="professionals">Profesioniști</SelectItem>
                  <SelectItem value="seniors">Seniori</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ton</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profesional</SelectItem>
                  <SelectItem value="friendly">Prietenos</SelectItem>
                  <SelectItem value="persuasive">Persuasiv</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Limbă</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={generating || !productName.trim()} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Se generează..." : result ? "Regenerează" : "Generează conținut"}
            </Button>
            {result && (
              <Button onClick={applyAll} variant="secondary" className="gap-2">
                <Check className="w-4 h-4" /> Aplică tot
              </Button>
            )}
          </div>
        </div>

        {/* Results Section */}
        {edited && (
          <div className="space-y-4">
            {/* Description */}
            <FieldResult
              label="Descriere completă"
              currentValue={currentValues.description ? currentValues.description.replace(/<[^>]*>/g, "").slice(0, 100) + "..." : "—"}
              value={edited.description}
              onChange={(v) => updateEdited("description", v)}
              onApply={() => applyField("description")}
              isHtml
            />

            {/* Short Description */}
            <FieldResult
              label="Descriere scurtă"
              currentValue={currentValues.short_description || "—"}
              value={edited.short_description}
              onChange={(v) => updateEdited("short_description", v)}
              onApply={() => applyField("short_description")}
              maxLen={160}
            />

            {/* Meta Title */}
            <FieldResult
              label="Meta titlu SEO"
              currentValue={currentValues.meta_title || "—"}
              value={edited.meta_title}
              onChange={(v) => updateEdited("meta_title", v)}
              onApply={() => applyField("meta_title")}
              maxLen={60}
            />

            {/* Meta Description */}
            <FieldResult
              label="Meta descriere SEO"
              currentValue={currentValues.meta_description || "—"}
              value={edited.meta_description}
              onChange={(v) => updateEdited("meta_description", v)}
              onApply={() => applyField("meta_description")}
              maxLen={160}
            />

            {/* Tags */}
            <div className="space-y-2 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Tag-uri sugerate</Label>
                <Button variant="outline" size="sm" onClick={() => applyField("tags")} className="gap-1 h-7 text-xs">
                  <Check className="w-3 h-3" /> Aplică
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {edited.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              {currentValues.tags && currentValues.tags.length > 0 && (
                <p className="text-xs text-muted-foreground">Tag-uri actuale: {currentValues.tags.join(", ")}</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldResult({ label, currentValue, value, onChange, onApply, maxLen, isHtml }: {
  label: string;
  currentValue: string;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  maxLen?: number;
  isHtml?: boolean;
}) {
  return (
    <div className="space-y-2 border border-border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <Label className="font-semibold">{label}</Label>
        <Button variant="outline" size="sm" onClick={onApply} className="gap-1 h-7 text-xs">
          <Check className="w-3 h-3" /> Aplică
        </Button>
      </div>
      {currentValue !== "—" && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
          <span className="font-medium">Actual:</span> {currentValue}
        </div>
      )}
      {isHtml ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="text-sm font-mono"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="text-sm"
        />
      )}
      {maxLen && (
        <p className="text-xs text-muted-foreground">{value.length}/{maxLen} caractere</p>
      )}
    </div>
  );
}
