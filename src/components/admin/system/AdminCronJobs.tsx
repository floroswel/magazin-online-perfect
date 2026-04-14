import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RefreshCw, Mail, ShoppingCart, TrendingUp, Users, Package, Bell } from "lucide-react";

interface CronJob {
  name: string;
  description: string;
  schedule: string;
  scheduleLabel: string;
  icon: React.ReactNode;
  edgeFunction: string;
  status: "active" | "inactive";
}

const cronJobs: CronJob[] = [
  {
    name: "Raport Zilnic Admin",
    description: "Trimite email zilnic cu sumar: comenzi, vânzări, stoc critic, recenzii.",
    schedule: "0 8 * * *",
    scheduleLabel: "Zilnic, 08:00",
    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
    edgeFunction: "daily-report",
    status: "active",
  },
  {
    name: "Recuperare Coșuri Abandonate",
    description: "Trimite email-uri de recuperare pentru coșurile abandonate (secvență 3 email-uri).",
    schedule: "0 */2 * * *",
    scheduleLabel: "La fiecare 2 ore",
    icon: <ShoppingCart className="w-5 h-5 text-amber-500" />,
    edgeFunction: "recover-abandoned-carts",
    status: "active",
  },
  {
    name: "Raport Săptămânal KPI",
    description: "Generează și trimite raportul de performanță săptămânal către admin.",
    schedule: "0 8 * * 1",
    scheduleLabel: "Luni, 08:00",
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    edgeFunction: "weekly-report",
    status: "active",
  },
  {
    name: "Verificare Tracking Colete",
    description: "Actualizează statusul coletelor din curieri (Fan Courier, Sameday etc.).",
    schedule: "*/30 * * * *",
    scheduleLabel: "La fiecare 30 min",
    icon: <Package className="w-5 h-5 text-green-500" />,
    edgeFunction: "check-tracking",
    status: "active",
  },
  {
    name: "Sincronizare Grupuri Clienți",
    description: "Actualizează automat grupurile de clienți pe baza regulilor definite.",
    schedule: "0 3 * * *",
    scheduleLabel: "Zilnic, 03:00",
    icon: <Users className="w-5 h-5 text-purple-500" />,
    edgeFunction: "sync-customer-groups",
    status: "active",
  },
  {
    name: "Flux Post-Vânzare",
    description: "Trimite cereri de review și follow-up după livrare.",
    schedule: "0 10 * * *",
    scheduleLabel: "Zilnic, 10:00",
    icon: <Mail className="w-5 h-5 text-rose-500" />,
    edgeFunction: "post-purchase-flow",
    status: "active",
  },
  {
    name: "Import Produse (Cron)",
    description: "Sincronizare automată a catalogului din feed-uri externe.",
    schedule: "0 4 * * *",
    scheduleLabel: "Zilnic, 04:00",
    icon: <RefreshCw className="w-5 h-5 text-teal-500" />,
    edgeFunction: "cron-import",
    status: "active",
  },
  {
    name: "Winback Clienți Inactivi",
    description: "Trimite oferte de re-angajare clienților care nu au cumpărat de 60+ zile.",
    schedule: "0 9 * * 3",
    scheduleLabel: "Miercuri, 09:00",
    icon: <Bell className="w-5 h-5 text-orange-500" />,
    edgeFunction: "winback-processor",
    status: "active",
  },
  {
    name: "Cereri Review Automate",
    description: "Trimite email de solicitare review la 7 zile după livrare.",
    schedule: "0 11 * * *",
    scheduleLabel: "Zilnic, 11:00",
    icon: <Mail className="w-5 h-5 text-indigo-500" />,
    edgeFunction: "request-reviews",
    status: "active",
  },
];

export default function AdminCronJobs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> Task-uri Programate
        </h1>
        <p className="text-sm text-muted-foreground">
          Vizualizare task-uri automate care rulează în fundal (cron jobs).
        </p>
      </div>

      <div className="grid gap-4">
        {cronJobs.map((job) => (
          <Card key={job.edgeFunction}>
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{job.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{job.name}</h3>
                    <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-[10px]">
                      {job.status === "active" ? "Activ" : "Inactiv"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{job.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {job.scheduleLabel}
                    </span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{job.schedule}</code>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{job.edgeFunction}</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
