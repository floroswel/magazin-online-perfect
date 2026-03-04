import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, Users } from "lucide-react";

interface Props {
  mode: "import" | "export";
}

export default function AdminCustomerImportExport({ mode }: Props) {
  const isImport = mode === "import";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{isImport ? "Import Clienți" : "Export Clienți"}</h1>
        <p className="text-sm text-muted-foreground">
          {isImport ? "Import clienți din fișier CSV cu mapare câmpuri." : "Export lista clienți pentru campanii sau analize."}
        </p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            {isImport ? (
              <>
                <p className="text-muted-foreground mb-4">Încarcă un fișier CSV cu coloanele: Nume, Email, Telefon</p>
                <Button variant="outline"><Upload className="w-4 h-4 mr-1" /> Selectează fișier CSV</Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">Exportă toți clienții într-un fișier CSV.</p>
                <Button><Download className="w-4 h-4 mr-1" /> Descarcă CSV</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
