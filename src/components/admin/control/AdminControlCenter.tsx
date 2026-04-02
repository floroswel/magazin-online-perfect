import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Megaphone, LayoutDashboard, Download, Upload, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useAllVisibility } from "@/hooks/useVisibility";
import ControlVisibility from "./ControlVisibility";
import ControlBanners from "./ControlBanners";
import ControlLayout from "./ControlLayout";

export default function AdminControlCenter() {
  const { active, total, initialized } = useAllVisibility();
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    const [vis, theme, banners, layout] = await Promise.all([
      (supabase as any).from("site_visibility_settings").select("*"),
      (supabase as any).from("site_theme_settings").select("*"),
      (supabase as any).from("site_banners").select("*"),
      (supabase as any).from("site_layout_settings").select("*"),
    ]);
    const backup = {
      exported_at: new Date().toISOString(),
      visibility: vis.data,
      theme: theme.data,
      banners: banners.data,
      layout: layout.data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mamalucica-control-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportat!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.visibility) {
          for (const row of data.visibility) {
            await (supabase as any)
              .from("site_visibility_settings")
              .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "element_key" });
          }
        }
        if (data.theme) {
          for (const row of data.theme) {
            await (supabase as any)
              .from("site_theme_settings")
              .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
          }
        }
        if (data.layout) {
          for (const row of data.layout) {
            await (supabase as any)
              .from("site_layout_settings")
              .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "setting_key" });
          }
        }
        toast.success("Setări importate cu succes! Reîncarcă pagina.");
      } catch {
        toast.error("Fișier invalid.");
      }
      setImporting(false);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" /> Control Center
          </h1>
          <p className="text-sm text-muted-foreground">Controlează fiecare element vizual și funcțional al site-ului</p>
        </div>
        <div className="flex items-center gap-3">
          {initialized && (
            <Badge variant="outline" className="text-sm px-3 py-1.5">
              <Eye className="w-3.5 h-3.5 mr-1" /> {active} / {total} elemente active
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} disabled={importing}>
            <Upload className="w-4 h-4 mr-1" /> Import JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visibility" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="visibility" className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Vizibilitate
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" /> Bannere
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" /> Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visibility"><ControlVisibility /></TabsContent>
        <TabsContent value="banners"><ControlBanners /></TabsContent>
        <TabsContent value="layout"><ControlLayout /></TabsContent>
      </Tabs>
    </div>
  );
}
