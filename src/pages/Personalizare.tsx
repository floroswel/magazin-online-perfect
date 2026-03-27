import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

const baseProducts = [
  { id: "simpla", name: "Lumânare Simplă", price: 35, image: "🕯️" },
  { id: "recipient", name: "Lumânare în Recipient", price: 45, image: "🫙" },
  { id: "set", name: "Set Cadou", price: 89, image: "🎁" },
];

const scents = [
  { id: "vanilie", name: "Vanilie ☁️", color: "#F5E6D3", intensity: 2, top: "Bergamot", mid: "Vanilie", base: "Mosc" },
  { id: "lavanda", name: "Lavandă 💜", color: "#D4B8E0", intensity: 2, top: "Lavandă", mid: "Eucalipt", base: "Cedru" },
  { id: "trandafir", name: "Trandafir 🌹", color: "#F5C3C2", intensity: 3, top: "Bergamot, Lămâie", mid: "Trandafir, Iasomie", base: "Mosc, Santal" },
  { id: "scortisoara", name: "Scorțișoară 🍂", color: "#D4A574", intensity: 3, top: "Portocală", mid: "Scorțișoară", base: "Vanilie" },
  { id: "ocean", name: "Briză Marină 🌊", color: "#A8D5E2", intensity: 1, top: "Sare de mare", mid: "Iasomie", base: "Mosc alb" },
  { id: "padure", name: "Pădure 🌲", color: "#8FBC8F", intensity: 2, top: "Pin", mid: "Cedru", base: "Patchouli" },
  { id: "caramel", name: "Caramel 🍮", color: "#C68E5B", intensity: 3, top: "Zahăr ars", mid: "Caramel", base: "Vanilie" },
  { id: "cafea", name: "Cafea ☕", color: "#6F4E37", intensity: 3, top: "Espresso", mid: "Ciocolată", base: "Lemn" },
];

const colors = [
  "#FFFFFF", "#F5F5DC", "#FFF0F5", "#F5C3C2", "#FFB6C1", "#FF69B4",
  "#DDA0DD", "#D4B8E0", "#E6E6FA", "#B0E0E6", "#A8D5E2", "#87CEEB",
  "#98FB98", "#8FBC8F", "#F0E68C", "#FFD700", "#FFA07A", "#FF6347",
  "#D2691E", "#C68E5B", "#DEB887", "#F5DEB3", "#D3D3D3", "#A9A9A9",
  "#808080", "#2F4F4F", "#000000", "#8B0000", "#4B0082", "#191970",
];

const packagingOptions = [
  { id: "standard", name: "Standard VENTUZA", price: 0 },
  { id: "kraft", name: "Cutie Kraft", price: 10 },
  { id: "alba", name: "Cutie Albă", price: 15 },
  { id: "lux", name: "Cutie Lux Neagră", price: 25 },
];

const fonts = [
  { id: "serif", name: "Elegant Serif", class: "font-serif" },
  { id: "sans", name: "Modern Sans", class: "font-sans" },
  { id: "script", name: "Script Cursiv", class: "italic" },
];

export default function Personalizare() {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const [step, setStep] = useState(1);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [selectedScent, setSelectedScent] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("#FFFFFF");
  const [customText, setCustomText] = useState("");
  const [selectedFont, setSelectedFont] = useState("sans");
  const [selectedPackaging, setSelectedPackaging] = useState("standard");
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftMessage, setShowGiftMessage] = useState(false);
  const [hoveredScent, setHoveredScent] = useState<string | null>(null);

  const base = baseProducts.find(b => b.id === selectedBase);
  const scent = scents.find(s => s.id === selectedScent);
  const packaging = packagingOptions.find(p => p.id === selectedPackaging);

  const basePrice = base?.price || 0;
  const textPrice = customText.trim() ? 10 : 0;
  const packagingPrice = packaging?.price || 0;
  const totalPrice = basePrice + textPrice + packagingPrice;

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedBase;
      case 2: return !!selectedScent;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleAddToCart = () => {
    toast.success("Lumânare personalizată adăugată în coș! 🕯️");
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">✨ Creează Lumânarea Ta — Unică, Personală, Specială</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            De la text gravat la parfumul ales de tine — totul realizat manual cu dragoste de echipa VENTUZA
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span className={step >= 1 ? "text-primary font-semibold" : ""}>1. Baza</span>
            <span className={step >= 2 ? "text-primary font-semibold" : ""}>2. Parfum</span>
            <span className={step >= 3 ? "text-primary font-semibold" : ""}>3. Culoare</span>
            <span className={step >= 4 ? "text-primary font-semibold" : ""}>4. Text</span>
            <span className={step >= 5 ? "text-primary font-semibold" : ""}>5. Ambalaj</span>
          </div>
          <Progress value={(step / 5) * 100} className="h-2" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main builder area */}
          <div className="md:col-span-2 space-y-6">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Pasul 1 — Alege baza</h2>
                <div className="grid grid-cols-3 gap-4">
                  {baseProducts.map(bp => (
                    <Card
                      key={bp.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${selectedBase === bp.id ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setSelectedBase(bp.id)}
                    >
                      <CardContent className="p-6 text-center">
                        <span className="text-4xl">{bp.image}</span>
                        <h3 className="font-semibold text-foreground mt-3">{bp.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">De la {format(bp.price)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Pasul 2 — Alege parfumul</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scents.map(s => (
                    <div
                      key={s.id}
                      className={`relative cursor-pointer rounded-lg border p-4 text-center transition-all hover:shadow-md ${selectedScent === s.id ? "ring-2 ring-primary border-primary" : "border-border"}`}
                      onClick={() => setSelectedScent(s.id)}
                      onMouseEnter={() => setHoveredScent(s.id)}
                      onMouseLeave={() => setHoveredScent(null)}
                    >
                      <div className="w-10 h-10 rounded-full mx-auto mb-2 border" style={{ backgroundColor: s.color }} />
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < s.intensity ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      {hoveredScent === s.id && (
                        <div className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 bg-popover border rounded-lg p-3 shadow-lg w-48 text-left">
                          <p className="text-[10px] font-semibold text-primary uppercase">Note de top</p>
                          <p className="text-xs text-foreground mb-1">{s.top}</p>
                          <p className="text-[10px] font-semibold text-primary uppercase">Note de mijloc</p>
                          <p className="text-xs text-foreground mb-1">{s.mid}</p>
                          <p className="text-[10px] font-semibold text-primary uppercase">Note de bază</p>
                          <p className="text-xs text-foreground">{s.base}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Pasul 3 — Alege culoarea</h2>
                <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === c ? "ring-2 ring-primary ring-offset-2" : "border-border hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
                {/* Preview */}
                <div className="mt-6 flex justify-center">
                  <div className="w-32 h-40 rounded-lg border-2 border-border flex items-center justify-center" style={{ backgroundColor: selectedColor }}>
                    <span className="text-4xl">🕯️</span>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Pasul 4 — Personalizare text</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Mesajul tău (max 60 caractere)</Label>
                    <Input
                      value={customText}
                      onChange={e => setCustomText(e.target.value.slice(0, 60))}
                      placeholder="Scrie mesajul tău..."
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{customText.length}/60</p>
                  </div>
                  <div>
                    <Label>Stil font</Label>
                    <div className="flex gap-2 mt-2">
                      {fonts.map(f => (
                        <Button
                          key={f.id}
                          variant={selectedFont === f.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFont(f.id)}
                          className={f.class}
                        >
                          {f.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {customText && (
                    <div className="border rounded-lg p-6 text-center bg-card">
                      <p className={`text-lg ${fonts.find(f => f.id === selectedFont)?.class}`}>
                        {customText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Previzualizare text (+10 RON)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Pasul 5 — Ambalaj</h2>
                <div className="grid grid-cols-2 gap-4">
                  {packagingOptions.map(p => (
                    <Card
                      key={p.id}
                      className={`cursor-pointer transition-all ${selectedPackaging === p.id ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setSelectedPackaging(p.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {p.price === 0 ? "Inclus" : `+${p.price} RON`}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showGiftMessage} onChange={e => setShowGiftMessage(e.target.checked)} className="rounded" />
                    <span className="text-sm text-foreground">Adaugă mesaj card cadou</span>
                  </label>
                  {showGiftMessage && (
                    <Textarea
                      value={giftMessage}
                      onChange={e => setGiftMessage(e.target.value)}
                      placeholder="Mesaj pentru cardul cadou..."
                      className="mt-2"
                      rows={3}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                ← Înapoi
              </Button>
              {step < 5 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Continuă →
                </Button>
              ) : (
                <Button onClick={handleAddToCart} className="font-semibold">
                  Adaugă în Coș 🛒
                </Button>
              )}
            </div>
          </div>

          {/* Sticky sidebar - price calculator */}
          <div className="md:sticky md:top-24 h-fit">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Rezumatul comenzii tale</h3>
                {base && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{base.name}</span>
                    <span className="text-foreground">{format(base.price)}</span>
                  </div>
                )}
                {scent && (
                  <div className="text-sm text-muted-foreground">✓ Parfum: {scent.name}</div>
                )}
                {selectedColor !== "#FFFFFF" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    ✓ Culoare: <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedColor }} />
                  </div>
                )}
                {customText && (
                  <>
                    <div className="text-sm text-muted-foreground">✓ Text: "{customText}"</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Personalizare text</span>
                      <span className="text-foreground">{format(10)}</span>
                    </div>
                  </>
                )}
                {packaging && packaging.price > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{packaging.name}</span>
                    <span className="text-foreground">{format(packaging.price)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span className="text-primary">{format(totalPrice)}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>⏱ Preparare: 3-5 zile</p>
                  <p>📦 Livrare estimată: {new Date(Date.now() + 7 * 86400000).toLocaleDateString("ro-RO")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inspiration gallery */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Inspirație — Personalizări realizate de noi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { text: "Botez Sofia", scent: "Vanilie", color: "Alb" },
              { text: "Nuntă Elena & Mihai", scent: "Trandafir", color: "Crem" },
              { text: "Pentru mama ❤️", scent: "Lavandă", color: "Mov deschis" },
              { text: "Crăciun fericit!", scent: "Scorțișoară", color: "Roșu" },
            ].map((item, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-2xl mb-3">🕯️</div>
                  <p className="text-sm font-medium text-foreground">"{item.text}"</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.scent} • {item.color}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
