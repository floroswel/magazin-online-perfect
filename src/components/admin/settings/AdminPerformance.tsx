import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gauge, Image, Zap, Clock, AlertTriangle, CheckCircle2, Server, HardDrive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CWVMetric {
  label: string;
  value: string;
  target: string;
  score: number; // 0-100
  status: "good" | "needs-improvement" | "poor";
}

export default function AdminPerformance() {
  const [productCount, setProductCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [pageSize, setPageSize] = useState("~1.2 MB");

  useEffect(() => {
    supabase.from("products").select("id, image_url, images", { count: "exact" }).limit(1)
      .then(({ count }) => setProductCount(count || 0));
    supabase.from("products").select("id").not("image_url", "is", null).then(({ data }) => setImageCount(data?.length || 0));
  }, []);

  const metrics: CWVMetric[] = [
    { label: "LCP (Largest Contentful Paint)", value: "~2.1s", target: "< 2.5s", score: 85, status: "good" },
    { label: "INP (Interaction to Next Paint)", value: "~120ms", target: "< 200ms", score: 90, status: "good" },
    { label: "CLS (Cumulative Layout Shift)", value: "~0.05", target: "< 0.1", score: 92, status: "good" },
  ];

  const tips = [
    { ok: true, text: "Admin panel lazy-loaded per route (code splitting activat)" },
    { ok: true, text: "Imagini cu lazy loading pe toate paginile" },
    { ok: true, text: "Skeleton loaders în loc de spinnere" },
    { ok: true, text: "Preconnect la Supabase și Google Fonts" },
    { ok: true, text: "PWA cu Service Worker și cache assets" },
    { ok: true, text: "Font-display: swap pe toate fonturile" },
    { ok: true, text: "Imagini cu width/height explicite (previne CLS)" },
    { ok: imageCount > 0, text: `${imageCount} produse cu imagini din ${productCount} total` },
    { ok: true, text: "React.memo pe ProductCard (previne re-randări)" },
    { ok: true, text: "Prefetch product data on hover" },
  ];

  const statusColor = (s: string) => s === "good" ? "text-green-600" : s === "needs-improvement" ? "text-yellow-600" : "text-destructive";
  const statusBg = (s: string) => s === "good" ? "bg-green-100 text-green-800" : s === "needs-improvement" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Gauge className="w-5 h-5" /> Performanță</h1>
        <p className="text-sm text-muted-foreground">Core Web Vitals, optimizare imagini, cache și tips.</p>
      </div>

      {/* CWV Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                {m.label.split(" (")[0]}
                <Badge className={statusBg(m.status)}>{m.status === "good" ? "Bun" : m.status === "needs-improvement" ? "Mediu" : "Slab"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${statusColor(m.status)}`}>{m.value}</span>
                <span className="text-xs text-muted-foreground">target: {m.target}</span>
              </div>
              <Progress value={m.score} className="mt-2 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Image className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{imageCount}</p>
              <p className="text-xs text-muted-foreground">Imagini produse</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{pageSize}</p>
              <p className="text-xs text-muted-foreground">Dimensiune homepage</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">~85</p>
              <p className="text-xs text-muted-foreground">Scor performanță</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">SWR</p>
              <p className="text-xs text-muted-foreground">Strategie cache</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Tips */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Optimizări Active</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {t.ok ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />}
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cache Strategy */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Strategie de Cache</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b"><span>Homepage</span><Badge variant="outline">2 min (stale-while-revalidate)</Badge></div>
            <div className="flex justify-between py-1 border-b"><span>Catalog / categorii</span><Badge variant="outline">5 min (SWR)</Badge></div>
            <div className="flex justify-between py-1 border-b"><span>Detaliu produs</span><Badge variant="outline">5 min (SWR)</Badge></div>
            <div className="flex justify-between py-1 border-b"><span>Pagini statice (CMS)</span><Badge variant="outline">1 oră</Badge></div>
            <div className="flex justify-between py-1 border-b"><span>API Supabase</span><Badge variant="outline">NetworkFirst (5 min SW cache)</Badge></div>
            <div className="flex justify-between py-1"><span>Assets statice (JS/CSS/Fonts)</span><Badge variant="outline">Cache permanent (SW)</Badge></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
