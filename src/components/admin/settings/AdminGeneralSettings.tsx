import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const JUDETE = [
  "Alba","Arad","Arges","Bacau","Bihor","Bistrita-Nasaud","Botosani","Braila","Brasov","Buzau",
  "Calarasi","Cluj","Constanta","Covasna","Dambovita","Dolj","Galati","Giurgiu","Gorj","Harghita",
  "Hunedoara","Ialomita","Iasi","Ilfov","Maramures","Mehedinti","Mures","Neamt","Olt","Prahova",
  "Salaj","Satu Mare","Sibiu","Suceava","Teleorman","Timis","Tulcea","Valcea","Vaslui","Vrancea",
  "Municipiul Bucuresti"
];

const DAYS = ["Luni","Marti","Miercuri","Joi","Vineri","Sambata","Duminica"];

export default function AdminGeneralSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data } = await supabase.from("app_settings").select("key, value_json");
    const map: Record<string, any> = {};
    (data || []).forEach(r => { map[r.key] = r.value_json; });
    setSettings(map);
    setLoading(false);
  };

  const get = (key: string, def: any = "") => settings[key] ?? def;
  const set = (key: string, val: any) => setSettings(s => ({ ...s, [key]: val }));
  const getObj = (key: string) => (typeof settings[key] === "object" && settings[key] !== null ? settings[key] : {});
  const setObj = (key: string, field: string, val: any) =>
    setSettings(s => ({ ...s, [key]: { ...(typeof s[key] === "object" && s[key] !== null ? s[key] : {}), [field]: val } }));

  const save = async () => {
    setSaving(true);
    const keys = Object.keys(settings);
    for (const key of keys) {
      await supabase.from("app_settings").upsert(
        { key, value_json: settings[key], updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }
    setSaving(false);
    toast.success("Setări salvate cu succes!");
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Se încarcă...</div>;

  const company = getObj("company_info");
  const social = getObj("social_media");
  const tracking = getObj("tracking_analytics");
  const invoicing = getObj("invoicing_settings");
  const contact = getObj("contact_settings");
  const orderSettings = getObj("order_settings");
  const productSettings = getObj("product_settings");
  const customerSettings = getObj("customer_settings");
  const mapSettings = getObj("map_settings");
  const robotsSettings = getObj("robots_settings");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări Generale</h1>
          <p className="text-sm text-muted-foreground">Configurare completă magazin — stil Gomag</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Se salvează...</> : <><Save className="w-4 h-4 mr-2" /> Salvează</>}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="clienti">Clienti</TabsTrigger>
          <TabsTrigger value="comanda">Comanda</TabsTrigger>
          <TabsTrigger value="produse">Produse</TabsTrigger>
          <TabsTrigger value="facturare">Facturare</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="harta">Harta</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="robots">Robots.txt</TabsTrigger>
        </TabsList>

        {/* ══════ GENERAL ══════ */}
        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Acces Magazin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Acces Magazin</Label>
                <Select value={get("store_access", "open")} onValueChange={v => set("store_access", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Deschis</SelectItem>
                    <SelectItem value="construction">In constructie</SelectItem>
                    <SelectItem value="closed">Inchis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {get("store_access") === "construction" && (
                <div><Label>Parola site in constructie</Label><Input value={get("construction_password", "")} onChange={e => set("construction_password", e.target.value)} /></div>
              )}
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Identitate</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Denumire site *</Label><Input value={get("site_name", "")} onChange={e => set("site_name", e.target.value)} placeholder="Mama Lucica" /></div>
              <div className="flex items-center gap-2">
                <Switch checked={get("logo_visible", true)} onCheckedChange={v => set("logo_visible", v)} />
                <Label>Logo vizibil in magazin</Label>
              </div>
              <div><Label>Text Copyright</Label><Input value={get("copyright_text", "")} onChange={e => set("copyright_text", e.target.value)} placeholder="© 2024 Mama Lucica. Toate drepturile rezervate." /></div>
              <div>
                <Label>Link-uri ANPC / SOL</Label>
                <Select value={get("anpc_display", "link")} onValueChange={v => set("anpc_display", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="widget">Widget</SelectItem>
                    <SelectItem value="both">Ambele</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ CLIENTI ══════ */}
        <TabsContent value="clienti">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Inregistrare Clienti</Label>
                <Select value={customerSettings.registration ?? "active"} onValueChange={v => setObj("customer_settings", "registration", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alocare Agenti de Vanzari</Label>
                <Select value={customerSettings.agent_allocation ?? "first_modify"} onValueChange={v => setObj("customer_settings", "agent_allocation", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_modify">Primul care face modificari pe comanda</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={customerSettings.account_managers ?? false} onCheckedChange={v => setObj("customer_settings", "account_managers", v)} />
                <div><Label>Responsabili de Cont</Label><p className="text-xs text-muted-foreground">Atribuie automat comenzii agentul de vanzari alocat clientului</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={customerSettings.restrict_customer_list ?? false} onCheckedChange={v => setObj("customer_settings", "restrict_customer_list", v)} />
                <div><Label>Restrictionare lista clienti</Label><p className="text-xs text-muted-foreground">Administratorul va avea acces la lista de clienti alocata</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={customerSettings.complex_passwords ?? false} onCheckedChange={v => setObj("customer_settings", "complex_passwords", v)} />
                <div><Label>Activeaza parole complexe</Label><p className="text-xs text-muted-foreground">Parola trebuie sa contina: litere mici, litere mari, cifre. Lungimea minima: 5 caractere</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ COMANDA ══════ */}
        <TabsContent value="comanda">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Comenzi doar pentru clienti autentificati</Label>
                <Select value={orderSettings.auth_only ?? "no"} onValueChange={v => setObj("order_settings", "auth_only", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Da</SelectItem><SelectItem value="no">Nu</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.show_all_shipping ?? false} onCheckedChange={v => setObj("order_settings", "show_all_shipping", v)} />
                <div><Label>Toate metodele de transport</Label><p className="text-xs text-muted-foreground">Clientul va vedea toate modalitatile de transport disponibile inainte de a completa o adresa</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.no_shipping_method ?? false} onCheckedChange={v => setObj("order_settings", "no_shipping_method", v)} />
                <Label>Comanda fara metoda de transport</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.no_shipping_cost ?? true} onCheckedChange={v => setObj("order_settings", "no_shipping_cost", v)} />
                <Label>Comanda fara cost de transport de la curier</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.prefill_address ?? true} onCheckedChange={v => setObj("order_settings", "prefill_address", v)} />
                <div><Label>Precompletare Adresa</Label><p className="text-xs text-muted-foreground">Identifica locatia clientului pe baza IP-ului</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.locker_delivery ?? false} onCheckedChange={v => setObj("order_settings", "locker_delivery", v)} />
                <Label>Livrari in pachetomat</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.order_attachments ?? false} onCheckedChange={v => setObj("order_settings", "order_attachments", v)} />
                <Label>Fisiere atasate la comanda</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.client_cancel ?? true} onCheckedChange={v => setObj("order_settings", "client_cancel", v)} />
                <Label>Anulare comenzi de catre client</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.cancel_invoiced ?? false} onCheckedChange={v => setObj("order_settings", "cancel_invoiced", v)} />
                <Label>Clientul poate anula comenzi facturate</Label>
              </div>
              <div>
                <Label>Statusul comenzilor anulate de clienti</Label>
                <Select value={orderSettings.cancel_status ?? "cancelled"} onValueChange={v => setObj("order_settings", "cancel_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cancelled">Anulata</SelectItem></SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Imparte Comanda</h3>
              <div>
                <Label>Valoare implicita Transport</Label>
                <Select value={orderSettings.split_shipping ?? "free"} onValueChange={v => setObj("order_settings", "split_shipping", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="free">Transport Gratuit</SelectItem><SelectItem value="split">Impartit</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valoare implicita Discount</Label>
                <Select value={orderSettings.split_discount ?? "initial"} onValueChange={v => setObj("order_settings", "split_discount", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="initial">Ramane pe comanda initiala</SelectItem><SelectItem value="split">Impartit</SelectItem></SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Livrare</h3>
              <div>
                <Label>Cod Postal in Checkout</Label>
                <Select value={orderSettings.postal_code_mode ?? "dynamic"} onValueChange={v => setObj("order_settings", "postal_code_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dynamic">Dinamic in functie de curier</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="hidden">Ascuns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.delivery_date ?? false} onCheckedChange={v => setObj("order_settings", "delivery_date", v)} />
                <Label>Data de Livrare in Checkout</Label>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Zile Lucratoare</h3>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((day, i) => (
                  <label key={day} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={(orderSettings.working_days ?? [0,1,2,3,4]).includes(i)} onCheckedChange={(checked) => {
                      const current = orderSettings.working_days ?? [0,1,2,3,4];
                      setObj("order_settings", "working_days", checked ? [...current, i] : current.filter((d: number) => d !== i));
                    }} />
                    {day}
                  </label>
                ))}
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">AWB</h3>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.awb_paid_only ?? false} onCheckedChange={v => setObj("order_settings", "awb_paid_only", v)} />
                <Label>Genereaza AWB doar pentru comenzi cu plata confirmata</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={orderSettings.awb_no_cod_op ?? false} onCheckedChange={v => setObj("order_settings", "awb_no_cod_op", v)} />
                <Label>Genereaza AWB fara valoare ramburs in cazul platilor OP</Label>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Tracking</h3>
              <div>
                <Label>Incarca coduri de conversie</Label>
                <Select value={orderSettings.conversion_mode ?? "all"} onValueChange={v => setObj("order_settings", "conversion_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Pentru toate comenzile</SelectItem>
                    <SelectItem value="paid">Doar pentru comenzile platite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ PRODUSE ══════ */}
        <TabsContent value="produse">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Descriere Categorie</Label>
                  <Select value={productSettings.cat_desc_visible ?? "visible"} onValueChange={v => setObj("product_settings", "cat_desc_visible", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="visible">Vizibila</SelectItem><SelectItem value="hidden">Ascunsa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pozitie descriere</Label>
                  <Select value={productSettings.cat_desc_position ?? "bottom"} onValueChange={v => setObj("product_settings", "cat_desc_position", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="bottom">In partea de jos</SelectItem><SelectItem value="top">In partea de sus</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Pret</h3>
              <div>
                <Label>Preturi</Label>
                <Select value={productSettings.prices_visible ?? "visible"} onValueChange={v => setObj("product_settings", "prices_visible", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="visible">Vizibile</SelectItem><SelectItem value="hidden">Ascunse</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modul de afisare al discount-ului</Label>
                <Select value={productSettings.discount_display ?? "percent"} onValueChange={v => setObj("product_settings", "discount_display", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percent">Procent</SelectItem><SelectItem value="value">Valoare</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preturi in functie de Istoric</Label>
                <Select value={productSettings.price_history ?? "inactive"} onValueChange={v => setObj("product_settings", "price_history", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="inactive">Inactiv</SelectItem><SelectItem value="active">Activ</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mod de afisare taxa SGR</Label>
                <Select value={productSettings.sgr_display ?? "included"} onValueChange={v => setObj("product_settings", "sgr_display", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="included">Inclusa in pret</SelectItem><SelectItem value="separate">Separata</SelectItem></SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Stoc</h3>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={productSettings.auto_stock ?? false} onCheckedChange={v => setObj("product_settings", "auto_stock", v)} />
                Gomag gestioneaza automat stocul
              </label>
              <p className="text-xs text-muted-foreground ml-6">Produsele "La comanda" cu stoc cantitativ primesc statusul "In Stoc"</p>

              <h3 className="font-semibold mt-4 pt-4 border-t">Review</h3>
              <div className="flex items-center gap-2">
                <Switch checked={productSettings.public_reviews ?? true} onCheckedChange={v => setObj("product_settings", "public_reviews", v)} />
                <div><Label>Review-uri Publice</Label><p className="text-xs text-muted-foreground">Permite adaugarea de review-uri de catre clienti</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productSettings.review_images ?? false} onCheckedChange={v => setObj("product_settings", "review_images", v)} />
                <Label>Imagini la review-uri</Label>
              </div>
              <div>
                <Label>Review-uri recompensate</Label>
                <Select value={productSettings.rewarded_reviews ?? "marked"} onValueChange={v => setObj("product_settings", "rewarded_reviews", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="marked">Cele marcate</SelectItem><SelectItem value="all">Toate</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productSettings.show_brand ?? true} onCheckedChange={v => setObj("product_settings", "show_brand", v)} />
                <Label>Marca Produs</Label>
              </div>
              <div>
                <Label>Ordinea afisarii atributelor</Label>
                <Select value={productSettings.attr_order ?? "added"} onValueChange={v => setObj("product_settings", "attr_order", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="added">In ordinea adaugarii la produs</SelectItem><SelectItem value="alpha">Alfabetic</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={productSettings.hide_single_attrs ?? false} onCheckedChange={v => setObj("product_settings", "hide_single_attrs", v)} />
                <Label>Ascunde atributele care au o singura valoare</Label>
              </div>
              <div>
                <Label>Termen de Livrare</Label>
                <Input value={productSettings.delivery_term ?? ""} onChange={e => setObj("product_settings", "delivery_term", e.target.value)} placeholder="2-3 zile lucratoare" />
                <p className="text-xs text-muted-foreground mt-1">Afisat pentru produsele care nu au completat un termen de livrare specific</p>
              </div>
              <div>
                <Label>Informatii conformitate produs (GSPR)</Label>
                <Select value={productSettings.gspr ?? "no"} onValueChange={v => setObj("product_settings", "gspr", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Da</SelectItem><SelectItem value="no">Nu</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ FACTURARE ══════ */}
        <TabsContent value="facturare">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h3 className="font-semibold">Facturi</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Serie *</Label><Input value={invoicing.invoice_series ?? ""} onChange={e => setObj("invoicing_settings", "invoice_series", e.target.value)} placeholder="ML" /></div>
                <div><Label>Numar *</Label><Input type="number" value={invoicing.invoice_number ?? ""} onChange={e => setObj("invoicing_settings", "invoice_number", e.target.value)} placeholder="1" /><p className="text-xs text-muted-foreground">Numarul de la care incepe numerotarea</p></div>
              </div>
              <h3 className="font-semibold mt-4 pt-4 border-t">Proforme</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Serie *</Label><Input value={invoicing.proforma_series ?? ""} onChange={e => setObj("invoicing_settings", "proforma_series", e.target.value)} placeholder="PF" /></div>
                <div><Label>Numar *</Label><Input type="number" value={invoicing.proforma_number ?? ""} onChange={e => setObj("invoicing_settings", "proforma_number", e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={invoicing.tva_incasare ?? false} onCheckedChange={v => setObj("invoicing_settings", "tva_incasare", v)} />
                <Label>TVA la Incasare</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={invoicing.consecutive_numbers ?? false} onCheckedChange={v => setObj("invoicing_settings", "consecutive_numbers", v)} />
                <div><Label>Numere de factura consecutive</Label><p className="text-xs text-muted-foreground">"Da" = continua din an in an, "Nu" = resetare in fiecare an</p></div>
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Afisare</h3>
              <div className="flex items-center gap-2"><Switch checked={invoicing.show_payment_method ?? false} onCheckedChange={v => setObj("invoicing_settings", "show_payment_method", v)} /><Label>Metoda de plata in factura</Label></div>
              <div className="flex items-center gap-2"><Switch checked={invoicing.show_vat_rate ?? false} onCheckedChange={v => setObj("invoicing_settings", "show_vat_rate", v)} /><Label>Cota TVA</Label></div>
              <div className="flex items-center gap-2"><Switch checked={invoicing.show_vat_subtotal ?? false} onCheckedChange={v => setObj("invoicing_settings", "show_vat_subtotal", v)} /><Label>Subtotal TVA</Label></div>
              <div className="flex items-center gap-2"><Switch checked={invoicing.show_shipping_address ?? false} onCheckedChange={v => setObj("invoicing_settings", "show_shipping_address", v)} /><Label>Adresa de Livrare</Label></div>
              <div>
                <Label>Subsol</Label>
                <Textarea value={invoicing.footer ?? ""} onChange={e => setObj("invoicing_settings", "footer", e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground mt-1">Numar comanda - {"{{number}}"} / Data comanda - {"{{date}}"}</p>
              </div>
              <div>
                <Label>CNP-ul implicit pe facturile clientilor (persoane fizice)</Label>
                <Input value={invoicing.default_cnp ?? "0000000000000"} onChange={e => setObj("invoicing_settings", "default_cnp", e.target.value)} />
              </div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Date Firma</h3>
              <div className="flex items-center gap-2">
                <Switch checked={invoicing.vat_payer ?? false} onCheckedChange={v => setObj("invoicing_settings", "vat_payer", v)} />
                <Label>Platitor de TVA</Label>
              </div>
              <div><Label>TVA implicit (%)</Label><Input type="number" value={invoicing.default_vat ?? 19} onChange={e => setObj("invoicing_settings", "default_vat", Number(e.target.value))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Denumire *</Label><Input value={company.name ?? ""} onChange={e => setObj("company_info", "name", e.target.value)} /></div>
                <div><Label>CUI *</Label><Input value={company.cui ?? ""} onChange={e => setObj("company_info", "cui", e.target.value)} /></div>
                <div><Label>Nr. Registru Comertului</Label><Input value={company.reg_com ?? ""} onChange={e => setObj("company_info", "reg_com", e.target.value)} /></div>
                <div><Label>Capital Social</Label><Input value={invoicing.capital_social ?? ""} onChange={e => setObj("invoicing_settings", "capital_social", e.target.value)} /></div>
              </div>
              <div>
                <Label>Tara</Label>
                <Select value={company.country ?? "România"} onValueChange={v => setObj("company_info", "country", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="România">România</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Judet</Label>
                <Select value={company.county ?? ""} onValueChange={v => setObj("company_info", "county", v)}>
                  <SelectTrigger><SelectValue placeholder="Selecteaza judet" /></SelectTrigger>
                  <SelectContent>{JUDETE.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Oras</Label><Input value={company.city ?? ""} onChange={e => setObj("company_info", "city", e.target.value)} /></div>
                <div><Label>Adresa</Label><Input value={company.address ?? ""} onChange={e => setObj("company_info", "address", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ CONTACT ══════ */}
        <TabsContent value="contact">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Adresa E-mail *</Label><Input type="email" value={contact.email ?? ""} onChange={e => setObj("contact_settings", "email", e.target.value)} /></div>
                <div><Label>Telefon</Label><Input value={contact.phone ?? ""} onChange={e => setObj("contact_settings", "phone", e.target.value)} /></div>
                <div><Label>Telefon 2</Label><Input value={contact.phone2 ?? ""} onChange={e => setObj("contact_settings", "phone2", e.target.value)} /></div>
                <div>
                  <Label>Judet</Label>
                  <Select value={contact.county ?? ""} onValueChange={v => setObj("contact_settings", "county", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecteaza" /></SelectTrigger>
                    <SelectContent>{JUDETE.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Oras</Label><Input value={contact.city ?? ""} onChange={e => setObj("contact_settings", "city", e.target.value)} /></div>
                <div><Label>Adresa</Label><Input value={contact.address ?? ""} onChange={e => setObj("contact_settings", "address", e.target.value)} /></div>
                <div><Label>Cod postal</Label><Input value={contact.postal_code ?? ""} onChange={e => setObj("contact_settings", "postal_code", e.target.value)} /></div>
                <div><Label>Orar</Label><Input value={contact.schedule ?? ""} onChange={e => setObj("contact_settings", "schedule", e.target.value)} placeholder="Luni-Vineri: 9:00-17:00" /></div>
              </div>
              <div><Label>Alte date</Label><Textarea value={contact.other_info ?? ""} onChange={e => setObj("contact_settings", "other_info", e.target.value)} rows={3} /></div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Facebook Messenger</h3>
              <div><Label>ID Pagina Facebook</Label><Input value={contact.fb_page_id ?? ""} onChange={e => setObj("contact_settings", "fb_page_id", e.target.value)} /></div>

              <h3 className="font-semibold mt-4 pt-4 border-t">Skype</h3>
              <div><Label>Username</Label><Input value={contact.skype ?? ""} onChange={e => setObj("contact_settings", "skype", e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ HARTA ══════ */}
        <TabsContent value="harta">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Embed Google Maps</Label>
                <Textarea value={mapSettings.embed ?? ""} onChange={e => setObj("map_settings", "embed", e.target.value)} rows={4} placeholder="<iframe src='https://maps.google.com/...'>" />
              </div>
              {mapSettings.embed && (
                <div>
                  <Label className="text-sm mb-2 block">Previzualizare</Label>
                  <div className="rounded-lg overflow-hidden border" dangerouslySetInnerHTML={{ __html: mapSettings.embed }} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ SOCIAL MEDIA ══════ */}
        <TabsContent value="social">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {[
                ["Facebook", "facebook"], ["Instagram", "instagram"], ["Youtube", "youtube"],
                ["Vimeo", "vimeo"], ["Pinterest", "pinterest"], ["Twitter / X", "twitter"],
                ["LinkedIn", "linkedin"], ["TikTok", "tiktok"],
              ].map(([label, key]) => (
                <div key={key}><Label>{label}</Label><Input value={social[key] ?? ""} onChange={e => setObj("social_media", key, e.target.value)} placeholder={`https://${key}.com/...`} /></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ ROBOTS.TXT ══════ */}
        <TabsContent value="robots">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label>Permite indexarea paginilor de cautare</Label>
                <Select value={robotsSettings.index_search ?? "no"} onValueChange={v => setObj("robots_settings", "index_search", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">Nu (noindex nofollow)</SelectItem><SelectItem value="yes">Da</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Blocheaza indexarea paginii de inregistrare</Label>
                <Select value={robotsSettings.block_register ?? "no"} onValueChange={v => setObj("robots_settings", "block_register", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">Nu</SelectItem><SelectItem value="yes">Da</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Custom rules</Label>
                <Textarea value={robotsSettings.custom_rules ?? ""} onChange={e => setObj("robots_settings", "custom_rules", e.target.value)} rows={8} placeholder="User-agent: *&#10;Disallow: /admin/" />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs mb-1 block">Previzualizare robots.txt</Label>
                <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
{`User-agent: *
${robotsSettings.index_search === "yes" ? "" : "Disallow: /search\n"}${robotsSettings.block_register === "yes" ? "Disallow: /auth\n" : ""}${robotsSettings.custom_rules ?? ""}
Sitemap: https://mamalucica.ro/sitemap.xml`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
