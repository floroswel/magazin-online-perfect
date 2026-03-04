import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const reportTypes = [
  { value: "sales", label: "Vânzări" },
  { value: "products", label: "Produse" },
  { value: "customers", label: "Clienți" },
  { value: "inventory", label: "Stoc" },
  { value: "financial", label: "Financiar" },
  { value: "orders", label: "Comenzi" },
];

export default function AdminExportReports() {
  const [report, setReport] = useState("sales");
  const [format, setFormat] = useState("csv");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Download className="w-5 h-5" /> Export Rapoarte</h1>
        <p className="text-sm text-muted-foreground">Export rapoarte în CSV sau PDF.</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Tip raport</Label>
              <Select value={report} onValueChange={setReport}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => toast({ title: `Se exportă ${report} ca ${format.toUpperCase()}...` })}>
            {format === "csv" ? <FileSpreadsheet className="w-4 h-4 mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
            Exportă
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
