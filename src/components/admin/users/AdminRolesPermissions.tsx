import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, UserPlus, Trash2, Search, Users, Crown, Eye, ShieldCheck, Settings } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Constants } from "@/integrations/supabase/types";

const ALL_ROLES = Constants.public.Enums.app_role;

type AppRole = typeof ALL_ROLES[number];

// Permission matrix: which modules each role can access
const PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "orders", label: "Comenzi", icon: "🛒" },
  { key: "products", label: "Produse", icon: "📦" },
  { key: "categories", label: "Categorii", icon: "🏷️" },
  { key: "stock", label: "Stoc & Depozit", icon: "🏭" },
  { key: "customers", label: "Clienți / CRM", icon: "👥" },
  { key: "coupons", label: "Cupoane & Reduceri", icon: "🎟️" },
  { key: "marketing", label: "Marketing", icon: "📣" },
  { key: "newsletter", label: "Newsletter", icon: "📧" },
  { key: "content", label: "Conținut (CMS)", icon: "📝" },
  { key: "reports", label: "Rapoarte", icon: "📈" },
  { key: "payments", label: "Plăți", icon: "💳" },
  { key: "shipping", label: "Livrare", icon: "🚚" },
  { key: "settings", label: "Setări", icon: "⚙️" },
  { key: "users", label: "Utilizatori & Roluri", icon: "🔐" },
  { key: "modules", label: "Module", icon: "🧩" },
] as const;

type PermissionAction = "view" | "create" | "edit" | "delete";

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "view", label: "Vizualizare" },
  { key: "create", label: "Creare" },
  { key: "edit", label: "Editare" },
  { key: "delete", label: "Ștergere" },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<AppRole, Record<string, PermissionAction[]>> = {
  admin: Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, ["view", "create", "edit", "delete"]])),
  moderator: {
    dashboard: ["view"], orders: ["view", "edit"], products: ["view", "edit"],
    categories: ["view"], stock: ["view"], customers: ["view", "edit"],
    coupons: ["view"], marketing: ["view"], newsletter: ["view"],
    content: ["view", "edit"], reports: ["view"], payments: ["view"],
    shipping: ["view"], settings: [], users: [], modules: [],
  },
  user: { dashboard: [], orders: [], products: [], categories: [], stock: [], customers: [], coupons: [], marketing: [], newsletter: [], content: [], reports: [], payments: [], shipping: [], settings: [], users: [], modules: [] },
  orders_manager: {
    dashboard: ["view"], orders: ["view", "create", "edit", "delete"],
    products: ["view"], categories: ["view"], stock: ["view"],
    customers: ["view"], coupons: ["view"], marketing: [],
    newsletter: [], content: [], reports: ["view"], payments: ["view"],
    shipping: ["view", "create", "edit"], settings: [], users: [], modules: [],
  },
  products_manager: {
    dashboard: ["view"], orders: ["view"], products: ["view", "create", "edit", "delete"],
    categories: ["view", "create", "edit", "delete"], stock: ["view", "create", "edit", "delete"],
    customers: [], coupons: [], marketing: [], newsletter: [],
    content: [], reports: ["view"], payments: [], shipping: [],
    settings: [], users: [], modules: [],
  },
  marketing: {
    dashboard: ["view"], orders: ["view"], products: ["view"],
    categories: ["view"], stock: [], customers: ["view"],
    coupons: ["view", "create", "edit", "delete"], marketing: ["view", "create", "edit", "delete"],
    newsletter: ["view", "create", "edit", "delete"], content: ["view", "create", "edit"],
    reports: ["view"], payments: [], shipping: [], settings: [], users: [], modules: [],
  },
  support: {
    dashboard: ["view"], orders: ["view", "edit"], products: ["view"],
    categories: [], stock: ["view"], customers: ["view", "edit"],
    coupons: ["view"], marketing: [], newsletter: [],
    content: [], reports: [], payments: ["view"], shipping: ["view"],
    settings: [], users: [], modules: [],
  },
  finance: {
    dashboard: ["view"], orders: ["view"], products: ["view"],
    categories: [], stock: ["view"], customers: ["view"],
    coupons: ["view"], marketing: [], newsletter: [],
    content: [], reports: ["view", "create", "edit"], payments: ["view", "edit"],
    shipping: ["view"], settings: [], users: [], modules: [],
  },
  viewer: Object.fromEntries(PERMISSION_MODULES.map((m) => [m.key, ["view"]])),
};

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Administrator", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: Crown },
  moderator: { label: "Moderator", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: ShieldCheck },
  user: { label: "Utilizator", color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: Users },
  orders_manager: { label: "Manager Comenzi", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: Shield },
  products_manager: { label: "Manager Produse", color: "bg-green-500/15 text-green-400 border-green-500/30", icon: Shield },
  marketing: { label: "Marketing", color: "bg-pink-500/15 text-pink-400 border-pink-500/30", icon: Shield },
  support: { label: "Suport", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: Shield },
  finance: { label: "Finanțe", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: Shield },
  viewer: { label: "Vizitator", color: "bg-slate-500/15 text-slate-400 border-slate-500/30", icon: Eye },
};

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
  full_name?: string;
}

export default function AdminRolesPermissions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [addDialog, setAddDialog] = useState(false);
  const [matrixRole, setMatrixRole] = useState<AppRole | null>(null);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("viewer");

  // Fetch user roles with profile info
  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get profiles for all users
      const userIds = [...new Set(roles.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return roles.map((r) => ({
        ...r,
        full_name: profileMap.get(r.user_id)?.full_name || null,
      })) as UserRole[];
    },
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol adăugat cu succes!");
      setAddDialog(false);
      setNewUserId("");
      setNewRole("viewer");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol eliminat!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Stats
  const roleCounts = ALL_ROLES.map((role) => ({
    role,
    count: userRoles.filter((ur) => ur.role === role).length,
  })).filter((r) => r.count > 0);

  const filtered = userRoles.filter((ur) => {
    if (filterRole !== "all" && ur.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        ur.user_id.toLowerCase().includes(q) ||
        ur.role.toLowerCase().includes(q) ||
        (ur.full_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roluri & Permisiuni</h1>
          <p className="text-sm text-muted-foreground">Gestionare roluri utilizatori și matrice de permisiuni per rol</p>
        </div>
        <Button onClick={() => setAddDialog(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Atribuie rol
        </Button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {roleCounts.map(({ role, count }) => {
          const cfg = ROLE_CONFIG[role];
          return (
            <Card
              key={role}
              className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setMatrixRole(role)}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-xs border", cfg.color)}>
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">utilizator{count !== 1 ? "i" : ""}</p>
              </CardContent>
            </Card>
          );
        })}
        <Card
          className="bg-card border-border border-dashed cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => setMatrixRole("admin")}
        >
          <CardContent className="pt-4 pb-3 px-4 flex flex-col items-center justify-center text-center">
            <Settings className="w-5 h-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Vezi matricea permisiuni</p>
          </CardContent>
        </Card>
      </div>

      {/* User roles table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <CardTitle className="text-foreground">Utilizatori cu roluri ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Caută..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-52" />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate rolurile</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Se încarcă...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Atribuit la</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ur) => {
                  const cfg = ROLE_CONFIG[ur.role];
                  return (
                    <TableRow key={ur.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{ur.full_name || "Utilizator"}</p>
                          <p className="text-xs font-mono text-muted-foreground">{ur.user_id.slice(0, 12)}…</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border", cfg.color)}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ur.created_at).toLocaleDateString("ro-RO")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMatrixRole(ur.role)}
                            className="text-muted-foreground"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Ești sigur că vrei să elimini rolul "${cfg.label}" pentru acest utilizator?`)) {
                                deleteRoleMutation.mutate(ur.id);
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Niciun rezultat.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuie Rol Utilizator</DialogTitle>
            <DialogDescription>Introdu ID-ul utilizatorului și selectează rolul dorit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>User ID (UUID)</Label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Anulează</Button>
            <Button
              onClick={() => addRoleMutation.mutate({ user_id: newUserId.trim(), role: newRole })}
              disabled={!newUserId.trim() || addRoleMutation.isPending}
            >
              {addRoleMutation.isPending ? "Se adaugă..." : "Atribuie rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={!!matrixRole} onOpenChange={(open) => !open && setMatrixRole(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Matrice Permisiuni
            </DialogTitle>
            <DialogDescription>
              Vizualizează permisiunile pentru fiecare rol. Selectează un rol din tab-urile de mai jos.
            </DialogDescription>
          </DialogHeader>

          {/* Role tabs */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROLES.map((role) => {
              const cfg = ROLE_CONFIG[role];
              return (
                <Button
                  key={role}
                  variant={matrixRole === role ? "default" : "outline"}
                  size="sm"
                  className={cn("text-xs", matrixRole !== role && cfg.color)}
                  onClick={() => setMatrixRole(role)}
                >
                  {cfg.label}
                </Button>
              );
            })}
          </div>

          {/* Matrix table */}
          <ScrollArea className="flex-1 min-h-0">
            {matrixRole && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Modul</TableHead>
                    {ACTIONS.map((a) => (
                      <TableHead key={a.key} className="text-center w-[100px]">{a.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_MODULES.map((mod) => {
                    const perms = DEFAULT_PERMISSIONS[matrixRole]?.[mod.key] || [];
                    return (
                      <TableRow key={mod.key}>
                        <TableCell className="font-medium">
                          <span className="mr-2">{mod.icon}</span>
                          {mod.label}
                        </TableCell>
                        {ACTIONS.map((action) => {
                          const has = perms.includes(action.key);
                          return (
                            <TableCell key={action.key} className="text-center">
                              <Checkbox
                                checked={has}
                                disabled
                                className={cn(
                                  has ? "data-[state=checked]:bg-primary data-[state=checked]:border-primary" : "opacity-30"
                                )}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {matrixRole === "admin" && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
              <strong className="text-primary">Admin</strong> are acces complet la toate modulele și funcționalitățile.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
