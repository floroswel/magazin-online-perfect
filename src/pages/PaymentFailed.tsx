import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { usePageSeo } from "@/components/SeoHead";
import { XCircle, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailed() {
  const [params] = useSearchParams();
  const reason = params.get("reason") || "Plata nu a putut fi procesată.";
  const orderId = params.get("orderId");

  usePageSeo({ title: "Plata eșuată | Mama Lucica", noindex: true });

  return (
    <Layout>
      <div className="ml-container py-12 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Plata nu a putut fi procesată</h1>
        <p className="text-sm text-muted-foreground mb-6">{reason}</p>

        <div className="bg-card rounded-xl border border-border p-5 text-left space-y-3 mb-6">
          <h3 className="text-sm font-bold">Ce poți face?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Verifică datele cardului și încearcă din nou</li>
            <li>• Asigură-te că ai suficiente fonduri</li>
            <li>• Contactează banca pentru detalii</li>
            <li>• Alege plata ramburs ca alternativă</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/checkout">
            <Button className="gap-2 w-full sm:w-auto">
              <RefreshCw className="w-4 h-4" /> Încearcă din nou
            </Button>
          </Link>
          <Link to="/checkout?method=ramburs">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Truck className="w-4 h-4" /> Plătește ramburs
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Comanda ta nu a fost pierdută. Contactează-ne la{" "}
          <a href="mailto:contact@mamalucica.ro" className="text-primary hover:underline">contact@mamalucica.ro</a>{" "}
          dacă ai nevoie de ajutor.
        </p>
      </div>
    </Layout>
  );
}
