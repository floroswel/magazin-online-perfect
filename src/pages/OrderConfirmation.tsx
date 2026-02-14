import { useParams, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

export default function OrderConfirmation() {
  const { orderId } = useParams();

  return (
    <Layout>
      <div className="container py-16 text-center max-w-lg mx-auto">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-3">Comanda a fost plasată!</h1>
        <p className="text-muted-foreground mb-2">Mulțumim pentru comandă. Vei primi un email de confirmare.</p>
        <p className="text-sm text-muted-foreground mb-6">ID Comandă: <span className="font-mono">{orderId}</span></p>
        <div className="flex gap-3 justify-center">
          <Link to="/account"><Button variant="outline">Comenzile mele</Button></Link>
          <Link to="/"><Button>Continuă cumpărăturile</Button></Link>
        </div>
      </div>
    </Layout>
  );
}
