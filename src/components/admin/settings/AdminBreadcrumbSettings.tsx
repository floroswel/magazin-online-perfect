import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminBreadcrumbSettings() {
  const [enabled, setEnabled] = useState(true);
  const [separator, setSeparator] = useState("chevron");
  const [showHome, setShowHome] = useState(true);
  const [homeLabel, setHomeLabel] = useState("Acasă");
  const [showOnProduct, setShowOnProduct] = useState(true);
  const [showOnCategory, setShowOnCategory] = useState(true);
  const [showOnBlog, setShowOnBlog] = useState(true);
  const [structuredData, setStructuredData] = useState(true);

  const handleSave = () => {
    toast.success("Setările breadcrumbs au fost salvate!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Breadcrumbs</h1>
          <p className="text-sm text-muted-foreground">Configurare navigare breadcrumbs pe site</p>
        </div>
        <Button onClick={handleSave}>Salvează</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setări Generale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Activează breadcrumbs</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Afișează „Acasă" în breadcrumbs</Label>
            <Switch checked={showHome} onCheckedChange={setShowHome} />
          </div>
          {showHome && (
            <div>
              <Label>Text link „Acasă"</Label>
              <Input value={homeLabel} onChange={(e) => setHomeLabel(e.target.value)} className="mt-1 max-w-xs" />
            </div>
          )}
          <div>
            <Label>Separator</Label>
            <Select value={separator} onValueChange={setSeparator}>
              <SelectTrigger className="mt-1 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chevron">› (Chevron)</SelectItem>
                <SelectItem value="slash">/ (Slash)</SelectItem>
                <SelectItem value="arrow">→ (Săgeată)</SelectItem>
                <SelectItem value="dot">• (Punct)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Afișare pe pagini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Pagini produs</Label>
            <Switch checked={showOnProduct} onCheckedChange={setShowOnProduct} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Pagini categorie</Label>
            <Switch checked={showOnCategory} onCheckedChange={setShowOnCategory} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Pagini blog</Label>
            <Switch checked={showOnBlog} onCheckedChange={setShowOnBlog} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Structured Data (JSON-LD)</Label>
              <p className="text-xs text-muted-foreground mt-1">Adaugă markup BreadcrumbList pentru Google</p>
            </div>
            <Switch checked={structuredData} onCheckedChange={setStructuredData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
