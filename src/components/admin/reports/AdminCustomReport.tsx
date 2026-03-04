import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function AdminCustomReport() {
  const [metric, setMetric] = useState("revenue");
  const [dimension, setDimension] = useState("day");
  const [period, setPeriod] = useState("30d");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Rapoarte Personalizate</h1>
        <p className="text-sm text-muted-foreground">Query builder: selectează metrici, dimensiuni, filtre.</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Metrică</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Venituri</SelectItem>
                  <SelectItem value="orders">Nr. comenzi</SelectItem>
                  <SelectItem value="aov">Valoare medie comandă</SelectItem>
                  <SelectItem value="customers">Clienți unici</SelectItem>
                  <SelectItem value="products_sold">Produse vândute</SelectItem>
                  <SelectItem value="profit">Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Dimensiune</Label>
              <Select value={dimension} onValueChange={setDimension}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Zi</SelectItem>
                  <SelectItem value="week">Săptămână</SelectItem>
                  <SelectItem value="month">Lună</SelectItem>
                  <SelectItem value="category">Categorie</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="payment">Metodă plată</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Perioadă</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Ultimele 7 zile</SelectItem>
                  <SelectItem value="30d">Ultimele 30 zile</SelectItem>
                  <SelectItem value="90d">Ultimele 90 zile</SelectItem>
                  <SelectItem value="year">Anul curent</SelectItem>
                  <SelectItem value="all">Tot istoricul</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => toast({ title: "Raport generat", description: `${metric} per ${dimension}, perioadă: ${period}` })}>
            <Play className="w-4 h-4 mr-1" /> Generează raport
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p>Selectează parametrii și apasă „Generează raport".</p>
        </CardContent>
      </Card>
    </div>
  );
}
