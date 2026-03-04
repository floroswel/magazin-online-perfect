import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const pixelProviders = [
  { key: "meta_pixel", name: "Meta (Facebook) Pixel", placeholder: "123456789012345", desc: "Urmărire conversii Facebook & Instagram Ads" },
  { key: "google_ads", name: "Google Ads", placeholder: "AW-123456789", desc: "Urmărire conversii Google Ads" },
  { key: "tiktok_pixel", name: "TikTok Pixel", placeholder: "ABCDEFGH12345", desc: "Urmărire conversii TikTok Ads" },
  { key: "pinterest_tag", name: "Pinterest Tag", placeholder: "1234567890", desc: "Urmărire conversii Pinterest Ads" },
  { key: "snapchat_pixel", name: "Snapchat Pixel", placeholder: "abc123-xyz", desc: "Urmărire conversii Snapchat Ads" },
];

export default function AdminPixels() {
  const [configs, setConfigs] = useState<Record<string, { id: string; active: boolean }>>({});

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Eye className="w-5 h-5" /> Pixel Tracking</h1>
        <p className="text-sm text-muted-foreground">Meta Pixel, Google Ads, TikTok Pixel — urmărire conversii pe toate canalele.</p>
      </div>
      <div className="grid gap-3">
        {pixelProviders.map((p) => (
          <Card key={p.key}>
            <CardContent className="py-4 px-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Switch checked={configs[p.key]?.active || false} onCheckedChange={(checked) => setConfigs({ ...configs, [p.key]: { ...configs[p.key], id: configs[p.key]?.id || "", active: checked } })} />
              </div>
              <div>
                <Label className="text-xs">Pixel / Tag ID</Label>
                <Input placeholder={p.placeholder} value={configs[p.key]?.id || ""} onChange={e => setConfigs({ ...configs, [p.key]: { ...configs[p.key], active: configs[p.key]?.active || false, id: e.target.value } })} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={() => toast({ title: "Configurare salvată" })}><Save className="w-4 h-4 mr-1" /> Salvează toate</Button>
    </div>
  );
}
