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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Search, Shield, UserPlus, Trash2, Crown, Eye, ShieldCheck, Mail, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Constants } from "@/integrations/supabase/types";

const ALL_ROLES = Constants.public.Enums.app_role;
type AppRole = typeof ALL_ROLES[number];

const ROLE_CONFIG: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Administrator", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  moderator: { label: "Moderator", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  user: { label: "Utilizator", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" },
  orders_manager: { label: "Manager Comenzi", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  products_manager: { label: "Manager Produse", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  marketing: { label: "Marketing", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  support: { label: "Suport", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  finance: { label: "Finanțe", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  viewer: { label: "Vizitator", color: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

interface EnrichedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  roles: string[];
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [addRoleDialog, setAddRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>("viewer");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-users");
      if (error) throw error;
      return data as { users: EnrichedUser[]; total: number };
    },
  });

  const users = usersData?.users || [];

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol adăugat cu succes!");
      setAddRoleDialog(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Rol eliminat!");
      setSelectedUser(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && !u.roles.includes(filterRole)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (u.email || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalWithRoles = users.filter((u) => u.roles.length > 0).length;
  const totalAdmins = users.filter((u) => u.roles.includes("admin")).length;

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilizatori</h1>
          <p className="text-sm text-muted-foreground">
            Toți utilizatorii înregistrați și rolurile lor
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <Users className="w-5 h-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total utilizatori</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <Shield className="w-5 h-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalWithRoles}</p>
            <p className="text-xs text-muted-foreground">Cu roluri</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <Crown className="w-5 h-5 text-red-400 mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalAdmins}</p>
            <p className="text-xs text-muted-foreground">Administratori</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <Mail className="w-5 h-5 text-primary mb-1" />
            <p className="text-2xl font-bold text-foreground">
              {users.filter((u) => u.email_confirmed_at).length}
            </p>
            <p className="text-xs text-muted-foreground">Email confirmat</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <CardTitle className="text-foreground">
              Utilizatori ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Caută email, nume..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-56"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate rolurile</SelectItem>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </SelectItem>
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
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizator</TableHead>
                    <TableHead>Roluri</TableHead>
                    <TableHead className="hidden md:table-cell">Înregistrat</TableHead>
                    <TableHead className="hidden md:table-cell">Ultima conectare</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.full_name || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => {
                              const cfg = ROLE_CONFIG[role as AppRole];
                              return cfg ? (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={cn("text-xs border", cfg.color)}
                                >
                                  {cfg.label}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Fără rol</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("ro-RO")}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString("ro-RO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Niciodată"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Niciun utilizator găsit.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedUser.full_name, selectedUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedUser.full_name || "Utilizator"}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Înregistrat: {new Date(selectedUser.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      Ultima conectare:{" "}
                      {selectedUser.last_sign_in_at
                        ? new Date(selectedUser.last_sign_in_at).toLocaleDateString("ro-RO")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>
                      Email:{" "}
                      {selectedUser.email_confirmed_at ? (
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                          Confirmat
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                          Neconfirmat
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                    ID: {selectedUser.id.slice(0, 8)}…
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">
                    Roluri active
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role) => {
                        const cfg = ROLE_CONFIG[role as AppRole];
                        return cfg ? (
                          <div key={role} className="flex items-center gap-1">
                            <Badge variant="outline" className={cn("border", cfg.color)}>
                              {cfg.label}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-5 h-5 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`Elimini rolul "${cfg.label}"?`)) {
                                  removeRoleMutation.mutate({
                                    userId: selectedUser.id,
                                    role: role as AppRole,
                                  });
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground">Niciun rol atribuit</span>
                    )}
                  </div>
                </div>

                {/* Add Role */}
                <div className="flex items-end gap-2 pt-2 border-t border-border">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Adaugă rol</Label>
                    <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.filter((r) => !selectedUser.roles.includes(r)).map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_CONFIG[r].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      addRoleMutation.mutate({ userId: selectedUser.id, role: newRole })
                    }
                    disabled={addRoleMutation.isPending || selectedUser.roles.includes(newRole)}
                    className="gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Adaugă
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
