import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2, Languages, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const LOCALES = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hu", name: "Magyar", flag: "🇭🇺" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

const DEFAULT_KEYS = [
  "add_to_cart", "buy_now", "out_of_stock", "in_stock", "search", "categories",
  "my_account", "login", "register", "cart", "checkout", "favorites", "compare",
  "reviews", "questions", "specifications", "description", "price", "quantity",
  "delivery", "free_shipping", "total", "subtotal", "discount", "apply_coupon",
  "continue_shopping", "place_order", "order_confirmation", "newsletter_signup",
];

type TranslationData = Record<string, Record<string, string>>;

export default function AdminTranslations() {
  const [data, setData] = useState<TranslationData>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "translations")
      .maybeSingle()
      .then(({ data: row }) => {
        if (row?.value_json && typeof row.value_json === "object") {
          setData(row.value_json as TranslationData);
        } else {
          // Initialize with default keys
          const init: TranslationData = {};
          LOCALES.forEach((l) => {
            init[l.code] = {};
            DEFAULT_KEYS.forEach((k) => { init[l.code][k] = ""; });
          });
          setData(init);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "translations", value_json: data as any, description: "i18n translations" }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Traduceri salvate!");
    setSaving(false);
  };

  const allKeys = Array.from(new Set(Object.values(data).flatMap((d) => Object.keys(d)))).sort();
  const filteredKeys = search ? allKeys.filter((k) => k.includes(search.toLowerCase())) : allKeys;

  const updateTranslation = (locale: string, key: string, value: string) => {
    setData((d) => ({
      ...d,
      [locale]: { ...(d[locale] || {}), [key]: value },
    }));
  };

  const addKey = () => {
    if (!newKey.trim()) return;
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_");
    setData((d) => {
      const next = { ...d };
      LOCALES.forEach((l) => {
        next[l.code] = { ...(next[l.code] || {}), [key]: "" };
      });
      return next;
    });
    setNewKey("");
  };

  const deleteKey = (key: string) => {
    setData((d) => {
      const next = { ...d };
      LOCALES.forEach((l) => {
        const { [key]: _, ...rest } = next[l.code] || {};
        next[l.code] = rest;
      });
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" />Se încarcă...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Languages className="w-6 h-6 text-primary" /> Traduceri
          </h1>
          <p className="text-sm text-muted-foreground">Gestionează traducerile pentru toate limbile suportate</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvează
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Caută cheie..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Input placeholder="Cheie nouă" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-48" />
        <Button variant="outline" onClick={addKey} disabled={!newKey.trim()}>
          <Plus className="w-4 h-4 mr-1" /> Adaugă
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="ro">
            <TabsList>
              {LOCALES.map((l) => (
                <TabsTrigger key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {LOCALES.map((l) => (
              <TabsContent key={l.code} value={l.code} className="space-y-2 mt-4">
                {filteredKeys.map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded w-48 shrink-0 truncate">{key}</code>
                    <Input
                      value={data[l.code]?.[key] || ""}
                      onChange={(e) => updateTranslation(l.code, key, e.target.value)}
                      placeholder={`Traducere ${l.name}...`}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => deleteKey(key)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {filteredKeys.length === 0 && <p className="text-center text-muted-foreground py-8">Nicio cheie de traducere.</p>}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
