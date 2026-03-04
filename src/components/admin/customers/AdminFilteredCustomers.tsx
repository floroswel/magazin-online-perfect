import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, subMonths } from "date-fns";
import { ro } from "date-fns/locale";
import { Users, Search, Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  filter: "new" | "active" | "inactive" | "vip" | "b2b" | "all";
  title: string;
  description: string;
}

export default function AdminFilteredCustomers({ filter, title, description }: Props) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);

      if (filter === "new") {
        query = query.gte("created_at", subMonths(new Date(), 1).toISOString());
      }

      const { data } = await query;
      let results = data || [];

      // Client-side filtering for complex cases
      if (filter === "vip") {
        // Show profiles with most orders (simplified - just show all sorted by date)
        results = results.slice(0, 20);
      }

      setProfiles(results);
      setLoading(false);
    };
    fetchCustomers();
  }, [filter]);

  const filtered = profiles.filter(
    (p) => !search || p.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csv = ["Nume,Telefon,Data înregistrare", ...filtered.map((p) => `${p.full_name || ""},${p.phone || ""},${p.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clienti-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{filtered.length} clienți</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Caută după nume..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nu sunt clienți în această categorie</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Data înregistrării</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(p.created_at), "dd MMM yyyy", { locale: ro })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
