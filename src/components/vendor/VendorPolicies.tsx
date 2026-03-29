import { Truck, Package, Shield } from "lucide-react";

export default function VendorPolicies() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-lg p-6">
        <Truck className="w-8 h-8 text-primary mb-3" />
        <h4 className="font-bold mb-2">Livrare</h4>
        <p className="text-sm text-muted-foreground">
          Livrare gratuită pentru comenzi peste 150 lei. Livrare standard: 2-4 zile lucrătoare. Ambalaj premium inclus.
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <Package className="w-8 h-8 text-primary mb-3" />
        <h4 className="font-bold mb-2">Retururi</h4>
        <p className="text-sm text-muted-foreground">
          Retur gratuit în 14 zile. Lumânările personalizate nu pot fi returnate.
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg p-6">
        <Shield className="w-8 h-8 text-primary mb-3" />
        <h4 className="font-bold mb-2">Garanție</h4>
        <p className="text-sm text-muted-foreground">
          Garantăm calitatea ingredientelor. Dacă nu ești mulțumit, îți oferim un înlocuitor sau ramburs.
        </p>
      </div>
    </div>
  );
}
