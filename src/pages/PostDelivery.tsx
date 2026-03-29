import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Star, Gift, MessageSquare, Share2, Flame } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { usePageSeo } from "@/components/SeoHead";
import { supabase } from "@/integrations/supabase/client";

export default function PostDelivery() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  usePageSeo({
    title: "Mulțumim pentru Comanda Ta! — MamaLucica",
    description: "Pagina personalizată post-livrare. Ghid de îngrijire, recenzie și recomandări.",
  });

  useEffect(() => {
    if (!token) return;
    // Try to find order by the short token (first 8 chars of order id)
    supabase
      .from("orders")
      .select("*")
      .ilike("id", `${token}%`)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-20 text-center text-muted-foreground">Se încarcă...</div>
      </Layout>
    );
  }

  const customerName = order?.shipping_address
    ? (typeof order.shipping_address === "object" ? (order.shipping_address as any)?.fullName : "")
    : "";

  return (
    <Layout>
      <div className="container px-4 py-8 md:py-12 max-w-2xl mx-auto">
        {/* Welcome card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
            {customerName ? `Mulțumim, ${customerName}! 🎉` : "Mulțumim pentru comandă! 🎉"}
          </h1>
          <p className="text-muted-foreground">
            Sperăm că te bucuri de lumânările tale artizanale.
          </p>
        </div>

        {/* Candle Care Guide */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Ghid de Îngrijire</h2>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="text-lg">🕯️</span>
              <div>
                <p className="font-medium text-foreground">Prima ardere</p>
                <p>Lasă lumânarea să ardă 2-3 ore la prima utilizare până se topește uniform pe toată suprafața.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">✂️</span>
              <div>
                <p className="font-medium text-foreground">Fitilul</p>
                <p>Taie fitilul la 5mm înainte de fiecare aprindere pentru o ardere uniformă și fără fum.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">⏰</span>
              <div>
                <p className="font-medium text-foreground">Durata arderii</p>
                <p>Nu lăsa lumânarea să ardă mai mult de 4 ore consecutiv. Stinge-o și lasă-o să se răcească.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">🏠</span>
              <div>
                <p className="font-medium text-foreground">Plasare</p>
                <p>Ține lumânarea departe de curenți de aer, pe o suprafață plană și rezistentă la căldură.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <Link to="/recenzii">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Lasă o recenzie</span>
              <span className="text-xs text-muted-foreground">Spune-ne cum ți se par lumânările</span>
            </Button>
          </Link>
          <Link to="/card-cadou">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-1">
              <Gift className="w-5 h-5 text-primary" />
              <span className="font-medium">Oferă un card cadou</span>
              <span className="text-xs text-muted-foreground">Perfect pentru cei dragi</span>
            </Button>
          </Link>
        </div>

        {/* Social sharing */}
        <div className="bg-muted/30 rounded-2xl p-5 text-center mb-5">
          <Share2 className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Împărtășește experiența ta</p>
          <p className="text-xs text-muted-foreground mb-3">
            Postează o poză cu lumânarea ta pe Instagram cu hashtag-ul #MamaLucica
          </p>
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://www.instagram.com/`, "_blank")}
            >
              📸 Instagram
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank")}
            >
              📘 Facebook
            </Button>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center text-sm text-muted-foreground">
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Ai o întrebare? <Link to="/faq" className="text-primary hover:underline">Verifică FAQ</Link> sau
          contactează-ne pe <a href="https://wa.me/40700000000" className="text-primary hover:underline">WhatsApp</a>.
        </div>
      </div>
    </Layout>
  );
}
