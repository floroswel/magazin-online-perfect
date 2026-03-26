import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings2, Clock, Layers, BarChart3, Wand2 } from "lucide-react";
import { lazy, Suspense } from "react";

const AdminAIGeneratorSettings = lazy(() => import("./AdminAIGeneratorSettings"));
const AdminAIPendingApprovals = lazy(() => import("./AdminAIPendingApprovals"));
const AdminAIBulkJobs = lazy(() => import("./AdminAIBulkJobs"));
const AdminAIUsageStats = lazy(() => import("./AdminAIUsageStats"));
const AdminAIGenerator = lazy(() => import("../apps/AdminAIGenerator"));

const Fallback = () => <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

export default function AdminAIGeneratorHub() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> Generator AI — Centru Complet
        </h1>
        <p className="text-sm text-muted-foreground">Generare conținut, aprobări, bulk, statistici și setări</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="generate" className="flex items-center gap-1"><Wand2 className="w-4 h-4" /> Generare</TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-1"><Clock className="w-4 h-4" /> Aprobări</TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-1"><Layers className="w-4 h-4" /> Bulk</TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> Utilizare</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1"><Settings2 className="w-4 h-4" /> Setări</TabsTrigger>
        </TabsList>

        <Suspense fallback={<Fallback />}>
          <TabsContent value="generate"><AdminAIGenerator /></TabsContent>
          <TabsContent value="approvals"><AdminAIPendingApprovals /></TabsContent>
          <TabsContent value="bulk"><AdminAIBulkJobs /></TabsContent>
          <TabsContent value="usage"><AdminAIUsageStats /></TabsContent>
          <TabsContent value="settings"><AdminAIGeneratorSettings /></TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
