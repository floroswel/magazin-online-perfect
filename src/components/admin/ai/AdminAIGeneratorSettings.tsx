import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings2, Save, Sparkles, Languages, Palette, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const TONES = [
  { value: "professional", label: "Profesional" },
  { value: "friendly", label: "Prietenos" },
  { value: "persuasive", label: "Persuasiv" },
  { value: "minimal", label: "Minimalist" },
  { value: "technical", label: "Tehnic" },
  { value: "luxury", label: "Luxury / Premium" },
  { value: "urgency", label: "Cu urgență" },
];

const LENGTHS = [
  { value: "short", label: "Scurt (50-100 cuvinte)" },
  { value: "medium", label: "Mediu (100-250 cuvinte)" },
  { value: "long", label: "Lung (250-500 cuvinte)" },
  { value: "custom", label: "Personalizat" },
];

interface AISettings {
  id: string;
  enabled: boolean;
  tone: string;
  format_diacritics: boolean;
  format_bullets: boolean;
  format_emojis: boolean;
  format_html: boolean;
  format_plain_text: boolean;
  language: string;
  content_length: string;
  content_length_min: number | null;
  content_length_max: number | null;
  manual_approval: boolean;
}

export default function AdminAIGeneratorSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["ai-generator-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generator_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AISettings | null;
    },
  });

  const [form, setForm] = useState<Partial<AISettings>>({});

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<AISettings>) => {
      if (!settings?.id) throw new Error("No settings found");
      const { error } = await supabase
        .from("ai_generator_settings")
        .update({ ...data, updated_at: new Date().toISOString() } as any)
        .eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-generator-settings"] });
      toast.success("Setări AI salvate!");
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => saveMutation.mutate(form);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Setări Generator AI
          </h2>
          <p className="text-sm text-muted-foreground">Configurare globală pentru generarea de conținut AI</p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-1" /> Salvează
        </Button>
      </div>

      {/* Global Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Generator AI Activ</Label>
              <p className="text-sm text-muted-foreground">Activează/dezactivează toate funcțiile AI din platformă</p>
            </div>
            <Switch checked={form.enabled || false} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          {form.enabled && (
            <Badge className="mt-3 bg-green-500/15 text-green-500 border-green-500/30">✅ AI Generator activ global</Badge>
          )}
          {!form.enabled && (
            <Badge variant="secondary" className="mt-3">⏸️ AI Generator dezactivat — toate butoanele AI sunt ascunse</Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Tone & Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Ton & Limbă</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ton implicit</Label>
              <Select value={form.tone || "professional"} onValueChange={(v) => set("tone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Limba</Label>
              <Select value={form.language || "ro"} onValueChange={(v) => set("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">🇷🇴 Română</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="auto">🌍 Auto-detect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Length */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Lungime Conținut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Lungime descriere</Label>
              <Select value={form.content_length || "medium"} onValueChange={(v) => set("content_length", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.content_length === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min cuvinte</Label>
                  <Input type="number" value={form.content_length_min || ""} onChange={(e) => set("content_length_min", Number(e.target.value) || null)} placeholder="50" />
                </div>
                <div>
                  <Label>Max cuvinte</Label>
                  <Input type="number" value={form.content_length_max || ""} onChange={(e) => set("content_length_max", Number(e.target.value) || null)} placeholder="300" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Format Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Languages className="w-4 h-4" /> Opțiuni Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["format_diacritics", "Folosește diacritice (ă, î, â, ș, ț)"],
              ["format_bullets", "Folosește bullet points"],
              ["format_emojis", "Folosește emojis"],
              ["format_html", "Folosește HTML (bold, liste, headings)"],
              ["format_plain_text", "Doar text simplu (override HTML)"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <Switch checked={(form as any)[key] || false} onCheckedChange={(v) => set(key, v)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Approval Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Flux de Aprobare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Aprobare manuală înainte de publicare</Label>
              <p className="text-xs text-muted-foreground">Conținutul generat merge în coada de aprobare în loc să se salveze direct</p>
            </div>
            <Switch checked={form.manual_approval || false} onCheckedChange={(v) => set("manual_approval", v)} />
          </div>
          {form.manual_approval && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-600">
              ⚠️ Cu aprobarea manuală activă, conținutul generat va apărea în <strong>AI Generator → Aprobări în așteptare</strong> și va necesita acțiune din partea unui admin.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
