import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, Search, ShieldCheck, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGdprData() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [consents, setConsents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anonymizing, setAnonymizing] = useState(false);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    setLoading(true);
    const { data } = await supabase.from("gdpr_consents").select("*").order("created_at", { ascending: false }).limit(200);
    setConsents(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    if (consents.length === 0) return;
    const headers = ["ID", "Session", "User ID", "Necessary", "Analytics", "Marketing", "IP Hash", "Created At"];
    const rows = consents.map(c => [c.id, c.session_id, c.user_id || "", c.necessary, c.analytics, c.marketing, c.ip_hash || "", c.created_at]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gdpr-consents-${Date.now()}.csv`; a.click();
    toast({ title: "CSV exportat" });
  };

  const anonymizeUser = async () => {
    if (!email) return;
    setAnonymizing(true);
    // Find user by searching profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").limit(500);
    const match = profiles?.find((p: any) => p.full_name?.toLowerCase().includes(email.toLowerCase()));
    
    if (!match) {
      toast({ title: "Utilizator negăsit", variant: "destructive" });
      setAnonymizing(false);
      return;
    }

    const { data, error } = await supabase.rpc("anonymize_user_data", { p_user_id: match.user_id });
    if (error) {
      toast({ title: "Eroare la anonimizare", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Date anonimizate cu succes" });
    }
    setAnonymizing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">GDPR & Date Personale</h1>
          <p className="text-sm text-muted-foreground">Consimțăminte GDPR, export date, anonimizare utilizatori.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><FileDown className="w-4 h-4 mr-1" /> Export CSV Consimțăminte</Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Trash2 className="w-4 h-4" />Anonimizare date utilizator</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Introdu numele sau email-ul utilizatorului. Datele personale vor fi anonimizate, comenzile păstrate pentru obligații fiscale.</p>
          <div className="flex gap-2">
            <Input placeholder="Nume sau email utilizator" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-md" />
            <Button variant="destructive" onClick={anonymizeUser} disabled={anonymizing || !email}>
              <Trash2 className="w-4 h-4 mr-1" /> {anonymizing ? "Se procesează..." : "Anonimizează"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Consimțăminte GDPR ({consents.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Se încarcă...</p> : (
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Necesare</TableHead>
                    <TableHead>Analitice</TableHead>
                    <TableHead>Marketing</TableHead>
                    <TableHead>IP Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleString("ro-RO")}</TableCell>
                      <TableCell className="text-xs font-mono">{c.session_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs">{c.necessary ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-xs">{c.analytics ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-xs">{c.marketing ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-xs font-mono">{c.ip_hash?.slice(0, 8) || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
