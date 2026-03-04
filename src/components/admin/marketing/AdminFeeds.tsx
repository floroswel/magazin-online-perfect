import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Rss, Plus, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const defaultFeeds = [
  { id: "1", name: "Google Shopping", url: "/feed/google-shopping.xml", format: "XML", products: 0, active: false },
  { id: "2", name: "Facebook Catalog", url: "/feed/facebook.xml", format: "XML", products: 0, active: false },
  { id: "3", name: "Compari.ro", url: "/feed/compari.xml", format: "XML", products: 0, active: false },
  { id: "4", name: "Price.ro", url: "/feed/price.xml", format: "XML", products: 0, active: false },
  { id: "5", name: "eMAG Marketplace", url: "/feed/emag.xml", format: "XML", products: 0, active: false },
];

export default function AdminFeeds() {
  const [feeds, setFeeds] = useState(defaultFeeds);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Rss className="w-5 h-5" /> Feed-uri Marketing</h1>
          <p className="text-sm text-muted-foreground">Google Shopping, Facebook Catalog, comparatoare de prețuri.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Feed nou</Button>
      </div>
      <div className="grid gap-3">
        {feeds.map((f) => (
          <Card key={f.id} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 py-4 px-5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{f.name}</p>
                  <Badge variant="outline" className="text-[10px]">{f.format}</Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{f.url}</p>
              </div>
              <p className="text-sm text-muted-foreground">{f.products} produse</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Feed regenerat" })}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Switch checked={f.active} onCheckedChange={(checked) => setFeeds(feeds.map(i => i.id === f.id ? { ...i, active: checked } : i))} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
