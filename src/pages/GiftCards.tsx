import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Sparkles, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";
import { usePageSeo } from "@/components/SeoHead";

const AMOUNTS = [50, 100, 150, 200, 300, 500];

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GC-";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function GiftCards() {
  const { user } = useAuth();
  const { format } = useCurrency();
  usePageSeo({
    title: "Carduri Cadou | MamaLucica",
    description: "Oferă un card cadou digital MamaLucica. Alege suma, adaugă un mesaj personal și trimite-l prin email.",
  });

  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedAmount = customAmount ? Number(customAmount) : amount;

  const handlePurchase = async () => {
    if (!recipientEmail.trim()) {
      toast.error("Introdu emailul destinatarului.");
      return;
    }
    if (selectedAmount < 10 || selectedAmount > 2000) {
      toast.error("Suma trebuie să fie între 10 și 2000 RON.");
      return;
    }

    setSubmitting(true);
    const code = generateCode();

    const { error } = await supabase.from("gift_cards").insert({
      code,
      initial_balance: selectedAmount,
      current_balance: selectedAmount,
      recipient_email: recipientEmail.trim(),
      recipient_name: recipientName.trim() || null,
      message: message.trim() || null,
      purchaser_user_id: user?.id || null,
      status: "active",
    } as any);

    if (error) {
      toast.error("Eroare la crearea cardului cadou.");
      setSubmitting(false);
      return;
    }

    // Send email notification via send-email edge function
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail.trim(),
          subject: `🎁 Ai primit un Card Cadou de ${selectedAmount} RON de la MamaLucica!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; text-align: center;">
              <h1 style="color: #b45309; margin-bottom: 10px;">🎁 Card Cadou MamaLucica</h1>
              ${recipientName ? `<p style="font-size: 18px;">Dragă ${recipientName},</p>` : ""}
              <p style="font-size: 16px; color: #444;">Ai primit un card cadou de <strong>${selectedAmount} RON</strong>!</p>
              ${message ? `<p style="font-style: italic; color: #666; padding: 15px; background: #fef3c7; border-radius: 8px;">"${message}"</p>` : ""}
              <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 5px; font-size: 14px; color: #92400e;">Codul tău:</p>
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #b45309; margin: 0; font-family: monospace;">${code}</p>
              </div>
              <p style="font-size: 14px; color: #666;">Folosește acest cod la checkout pe <a href="https://mamalucica.ro" style="color: #b45309;">mamalucica.ro</a></p>
            </div>
          `,
        },
      });
    } catch {
      // Email failure is non-critical
    }

    setSuccess(code);
    setSubmitting(false);
    toast.success("Card cadou creat cu succes!");
  };

  if (success) {
    return (
      <Layout>
        <div className="container py-12 px-4 max-w-lg mx-auto text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Card Cadou Trimis! 🎉</h1>
            <p className="text-muted-foreground mt-2">
              Am trimis codul pe email la <strong>{recipientEmail}</strong>
            </p>
          </div>
          <Card className="border-2 border-dashed border-primary/40">
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground mb-2">Cod Card Cadou</p>
              <p className="text-3xl font-bold font-mono tracking-wider text-primary">{success}</p>
              <p className="text-lg font-semibold mt-3 text-foreground">{format(selectedAmount)}</p>
            </CardContent>
          </Card>
          <Button className="mt-6" onClick={() => { setSuccess(null); setRecipientEmail(""); setRecipientName(""); setMessage(""); }}>
            Cumpără alt card cadou
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-foreground">Carduri Cadou Digitale</h1>
          <p className="text-muted-foreground mt-2">
            Cadoul perfect pentru orice ocazie — Crăciun, 8 Martie, Ziua Mamei sau pur și simplu „la mulți ani".
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Amount Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Alege suma</Label>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNTS.map((a) => (
                  <Button
                    key={a}
                    variant={amount === a && !customAmount ? "default" : "outline"}
                    className="text-lg font-bold py-6"
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                  >
                    {a} RON
                  </Button>
                ))}
              </div>
              <div className="mt-3">
                <Input
                  type="number"
                  placeholder="Sau introdu altă sumă (10-2000 RON)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min={10}
                  max={2000}
                />
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Detalii destinatar</Label>
              <Input
                placeholder="Numele destinatarului"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email destinatar *"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            {/* Personal Message */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Mesaj personal (opțional)</Label>
              <Textarea
                placeholder="Scrie un mesaj frumos pentru destinatar..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Summary & Purchase */}
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de plată</p>
                <p className="text-2xl font-bold text-primary">{format(selectedAmount)}</p>
              </div>
              <Sparkles className="w-8 h-8 text-primary/30" />
            </div>

            <Button
              size="lg"
              className="w-full text-lg gap-2"
              onClick={handlePurchase}
              disabled={submitting || !recipientEmail.trim()}
            >
              <Send className="w-5 h-5" />
              {submitting ? "Se procesează..." : "Cumpără Card Cadou"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cardul cadou va fi trimis instant pe email. Poate fi folosit la checkout pe mamalucica.ro.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
