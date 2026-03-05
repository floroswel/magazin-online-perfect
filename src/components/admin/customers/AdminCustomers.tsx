import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, ShoppingCart, Award, Download, Eye, ChevronUp, ChevronDown, Ban, Mail, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Customer {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  loyalty_points: number;
  last_order_at: string | null;
  abc_class: string;
  is_blocked: boolean;
  groups: string[];
}

type SortField = "full_name" | "total_spent" | "order_count" | "created_at" | "last_order_at";

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_spent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterAbc, setFilterAbc] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [minSpent, setMinSpent] = useState("");
  const [maxSpent, setMaxSpent] = useState("");
  const [minOrders, setMinOrders] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: orders } = await supabase.from("orders").select("user_id, user_email, total, created_at");
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone, created_at, abc_class, is_blocked");
      const { data: loyalty } = await supabase.from("loyalty_points").select("user_id, points");
      const { data: grps } = await supabase.from("customer_groups").select("id, name, slug");
      const { data: members } = await supabase.from("customer_group_members").select("user_id, group_id");
      setGroups(grps || []);

      const memberMap = new Map<string, string[]>();
      members?.forEach(m => {
        const arr = memberMap.get(m.user_id) || [];
        const grp = grps?.find(g => g.id === m.group_id);
        if (grp) arr.push(grp.name);
        memberMap.set(m.user_id, arr);
      });

      const userMap = new Map<string, Customer>();
      // Build from orders
      const ordersByUser = new Map<string, { count: number; total: number; lastAt: string; email: string; firstAt: string }>();
      orders?.forEach(o => {
        const ex = ordersByUser.get(o.user_id);
        if (ex) {
          ex.count++;
          ex.total += Number(o.total);
          if (o.created_at > ex.lastAt) ex.lastAt = o.created_at;
          if (o.created_at < ex.firstAt) ex.firstAt = o.created_at;
        } else {
          ordersByUser.set(o.user_id, { count: 1, total: Number(o.total), lastAt: o.created_at, firstAt: o.created_at, email: o.user_email || "—" });
        }
      });

      profiles?.forEach(p => {
        const od = ordersByUser.get(p.user_id);
        userMap.set(p.user_id, {
          user_id: p.user_id,
          email: od?.email || "—",
          full_name: p.full_name,
          phone: p.phone,
          created_at: p.created_at,
          order_count: od?.count || 0,
          total_spent: od?.total || 0,
          loyalty_points: 0,
          last_order_at: od?.lastAt || null,
          abc_class: (p as any).abc_class || "C",
          is_blocked: (p as any).is_blocked || false,
          groups: memberMap.get(p.user_id) || [],
        });
      });

      // Add users from orders that don't have profiles
      ordersByUser.forEach((od, uid) => {
        if (!userMap.has(uid)) {
          userMap.set(uid, {
            user_id: uid, email: od.email, full_name: null, phone: null,
            created_at: od.firstAt, order_count: od.count, total_spent: od.total,
            loyalty_points: 0, last_order_at: od.lastAt, abc_class: "C", is_blocked: false, groups: memberMap.get(uid) || [],
          });
        }
      });

      loyalty?.forEach(l => { const c = userMap.get(l.user_id); if (c) c.loyalty_points += l.points; });
      setCustomers(Array.from(userMap.values()));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    if (q && !c.email.toLowerCase().includes(q) && !(c.full_name || "").toLowerCase().includes(q) && !(c.phone || "").includes(q)) return false;
    if (filterAbc !== "all" && c.abc_class !== filterAbc) return false;
    if (filterStatus === "blocked" && !c.is_blocked) return false;
    if (filterStatus === "active" && c.is_blocked) return false;
    if (filterGroup !== "all" && !c.groups.includes(filterGroup)) return false;
    if (minSpent && c.total_spent < Number(minSpent)) return false;
    if (maxSpent && c.total_spent > Number(maxSpent)) return false;
    if (minOrders && c.order_count < Number(minOrders)) return false;
    return true;
  }).sort((a, b) => {
    let va: any = a[sortField], vb: any = b[sortField];
    if (sortField === "full_name") { va = (va || "").toLowerCase(); vb = (vb || "").toLowerCase(); }
    if (va === null || va === undefined) va = sortDir === "desc" ? -Infinity : Infinity;
    if (vb === null || vb === undefined) vb = sortDir === "desc" ? -Infinity : Infinity;
    return sortDir === "desc" ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
  });

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.order_count, 0);

  const exportCSV = () => {
    const header = "Nume,Email,Telefon,Comenzi,Total cheltuit,Puncte,Clasă ABC,Grup,Ultima comandă\n";
    const rows = filtered.map(c =>
      `"${c.full_name || "—"}","${c.email}","${c.phone || "—"}",${c.order_count},${c.total_spent.toFixed(2)},${c.loyalty_points},${c.abc_class},"${c.groups.join("; ")}","${c.last_order_at ? format(new Date(c.last_order_at), "dd.MM.yyyy") : "—"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clienti.csv"; a.click();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => sortField === field ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3 inline" /> : <ChevronUp className="w-3 h-3 inline" />) : null;

  const abcColor = (cls: string) => cls === "A" ? "bg-green-500/20 text-green-600 border-green-500/30" : cls === "B" ? "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" : "bg-muted text-muted-foreground border-border";

  const toggleSelect = (uid: string) => setSelected(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.user_id)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Clienți</h1>
          <p className="text-sm text-muted-foreground">Gestionare avansată bază de clienți</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Badge variant="outline" className="text-xs">{selected.size} selectați</Badge>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xl font-bold">{customers.length}</p><p className="text-xs text-muted-foreground">Total clienți</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-green-500" /></div>
          <div><p className="text-xl font-bold">{totalOrders}</p><p className="text-xs text-muted-foreground">Total comenzi</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Award className="w-5 h-5 text-yellow-500" /></div>
          <div><p className="text-xl font-bold">{totalRevenue.toLocaleString("ro-RO", { minimumFractionDigits: 0 })} lei</p><p className="text-xs text-muted-foreground">Venituri totale</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="col-span-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Nume, email, telefon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={filterAbc} onValueChange={setFilterAbc}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Clasă ABC" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate clasele</SelectItem>
                <SelectItem value="A">Clasa A</SelectItem>
                <SelectItem value="B">Clasa B</SelectItem>
                <SelectItem value="C">Clasa C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți</SelectItem>
                <SelectItem value="active">Activi</SelectItem>
                <SelectItem value="blocked">Blocați</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Min cheltuit" type="number" value={minSpent} onChange={e => setMinSpent(e.target.value)} className="h-9" />
            <Input placeholder="Min comenzi" type="number" value={minOrders} onChange={e => setMinOrders(e.target.value)} className="h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">Niciun client găsit.</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("full_name")}>Client <SortIcon field="full_name" /></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("order_count")}>Comenzi <SortIcon field="order_count" /></TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => toggleSort("total_spent")}>Total <SortIcon field="total_spent" /></TableHead>
                  <TableHead>ABC</TableHead>
                  <TableHead>Grup</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("last_order_at")}>Ultima cmd <SortIcon field="last_order_at" /></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map(c => (
                  <TableRow key={c.user_id} className={c.is_blocked ? "opacity-60" : ""}>
                    <TableCell><Checkbox checked={selected.has(c.user_id)} onCheckedChange={() => toggleSelect(c.user_id)} /></TableCell>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(c.full_name || c.email || "?")[0].toUpperCase()}
                        </div>
                        {c.full_name || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.phone || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{c.order_count}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{c.total_spent.toLocaleString("ro-RO", { minimumFractionDigits: 2 })} lei</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${abcColor(c.abc_class)}`}>{c.abc_class}</Badge></TableCell>
                    <TableCell className="text-xs">{c.groups.length > 0 ? c.groups[0] : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.last_order_at ? format(new Date(c.last_order_at), "dd.MM.yy") : "—"}</TableCell>
                    <TableCell>
                      {c.is_blocked ? (
                        <Badge variant="destructive" className="text-[10px]"><Ban className="w-3 h-3 mr-0.5" />Blocat</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">Activ</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/customers/detail/${c.user_id}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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
