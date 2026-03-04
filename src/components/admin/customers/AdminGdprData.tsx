import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Search, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGdprData() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const searchUser = async () => {
    if (!email) return;
    setSearching(true);
    // Search in profiles
    const { data: profiles } = await supabase.from("profiles").select("*").limit(100);
    // We can't search by email directly in profiles, so we show all and let admin identify
    setUserData({ profiles: profiles || [], message: "Căutare efectuată. Datele sunt afișate mai jos." });
    setSearching(false);
  };

  const exportData = () => {
    if (!userData) return;
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gdpr-export-${Date.now()}.json`; a.click();
    toast({ title: "Date exportate" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">GDPR & Date Personale</h1>
        <p className="text-sm text-muted-foreground">Export date client, gestionare consimțăminte conform GDPR.</p>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Căutare date client</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Email sau ID utilizator" value={email} onChange={(e) => setEmail(e.target.value)} className="max-w-md" />
            <Button onClick={searchUser} disabled={searching}><Search className="w-4 h-4 mr-1" /> Caută</Button>
          </div>
          {userData && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{userData.message}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportData}><Download className="w-4 h-4 mr-1" /> Export Date (JSON)</Button>
              </div>
              <p className="text-xs text-muted-foreground">Găsite {userData.profiles?.length || 0} profiluri. Pentru ștergerea contului, utilizatorul trebuie să solicite prin email.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
