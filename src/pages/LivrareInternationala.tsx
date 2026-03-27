import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Globe, Package, AlertTriangle, Truck } from "lucide-react";
import SeoHead from "@/components/SeoHead";

const euCountries = [
  { country: "Germania", cost: "25 RON", days: "5-7" },
  { country: "Austria", cost: "25 RON", days: "5-7" },
  { country: "Italia", cost: "25 RON", days: "5-7" },
  { country: "Franța", cost: "30 RON", days: "6-8" },
  { country: "Spania", cost: "30 RON", days: "6-8" },
  { country: "Ungaria", cost: "20 RON", days: "3-5" },
  { country: "Bulgaria", cost: "20 RON", days: "3-5" },
  { country: "Republica Moldova", cost: "25 RON", days: "5-7" },
  { country: "Polonia", cost: "25 RON", days: "5-7" },
  { country: "Cehia", cost: "25 RON", days: "5-7" },
  { country: "Grecia", cost: "30 RON", days: "6-8" },
  { country: "Belgia / Olanda", cost: "30 RON", days: "6-8" },
  { country: "Alte țări UE", cost: "35 RON", days: "7-10" },
  { country: "UK (non-UE)", cost: "50 RON", days: "7-12" },
];

export default function LivrareInternationala() {
  return (
    <Layout>
      <SeoHead title="Livrare Internațională — VENTUZA" description="Livrăm lumânări handmade VENTUZA în toată Europa. Costuri, termene și informații despre transport internațional." />
      <div className="container py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Livrăm Lumânările VENTUZA în Europa</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Aromele VENTUZA ajung acum și la tine, oriunde ai fi în Europa. Ambalaj special pentru transport sigur al lumânărilor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Ambalaj Protector</h3>
              <p className="text-xs text-muted-foreground mt-1">Cutie rigidă cu protecție anti-șoc special pentru lumânări fragile</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Tracking Complet</h3>
              <p className="text-xs text-muted-foreground mt-1">Urmărești coletul pas cu pas, de la atelierul nostru la ușa ta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Livrare Gratuită &gt; 300 RON</h3>
              <p className="text-xs text-muted-foreground mt-1">Livrare internațională gratuită pentru comenzi peste 300 RON</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Costuri și Termene de Livrare</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Țara</TableHead>
                  <TableHead>Cost Livrare</TableHead>
                  <TableHead>Termen Estimat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {euCountries.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.country}</TableCell>
                    <TableCell>{row.cost}</TableCell>
                    <TableCell>{row.days} zile lucrătoare</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-200">Important — Țări non-UE</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Pentru livrările în afara UE (ex: UK, Elveția), destinatarul poate fi supus taxelor vamale și TVA locale. 
                  Aceste costuri nu sunt incluse în prețul produsului și sunt responsabilitatea cumpărătorului.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/catalog" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Comandă acum 🕯️
          </Link>
        </div>
      </div>
    </Layout>
  );
}
