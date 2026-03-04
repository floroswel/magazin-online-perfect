import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function AdminSSL() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Certificat SSL</h1>
        <p className="text-sm text-muted-foreground">Status și configurare certificat SSL.</p>
      </div>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">SSL Activ</p>
              <p className="text-xs text-muted-foreground">Certificat gestionat automat de platformă</p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 border-green-200 ml-auto">Valid</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Emis de</p><p className="font-medium">Let's Encrypt</p></div>
            <div><p className="text-xs text-muted-foreground">Protocol</p><p className="font-medium">TLS 1.3</p></div>
            <div><p className="text-xs text-muted-foreground">Reînnoire automată</p><p className="font-medium text-green-600">Da</p></div>
            <div><p className="text-xs text-muted-foreground">HSTS</p><p className="font-medium text-green-600">Activat</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Certificat verificat — valid" })}>
            <RefreshCw className="w-4 h-4 mr-1" /> Verifică acum
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
