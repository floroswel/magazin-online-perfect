import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Globe, Shield, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminDomainSettings() {
  const handleSave = () => {
    toast.success("Setările domeniului au fost salvate!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Domenii</h1>
          <p className="text-sm text-muted-foreground">Configurează domeniile magazinului tău</p>
        </div>
        <Button onClick={handleSave}>Salvează</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" /> Domeniu Principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Domeniu custom</Label>
            <div className="flex gap-2 mt-1">
              <Input placeholder="www.magazinul-tau.ro" className="flex-1" />
              <Button variant="outline">Verifică DNS</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Adaugă un record CNAME care indică spre platforma noastră</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> SSL Activ</Badge>
            <Badge variant="secondary">Let's Encrypt</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redirectări</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Forțează HTTPS</Label>
              <p className="text-xs text-muted-foreground">Redirecționează automat HTTP → HTTPS</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Redirect www → non-www</Label>
              <p className="text-xs text-muted-foreground">Canonicalizare domeniu</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
