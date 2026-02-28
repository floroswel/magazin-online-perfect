import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Shield, Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminRoutes from "@/components/admin/AdminRoutes";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import AdminNotifications from "@/components/admin/AdminNotifications";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary/20 animate-cyber-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 rounded-xl border border-destructive/30 bg-card">
          <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Acces interzis</h1>
          <p className="text-muted-foreground">Nu ai permisiuni de administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel flex min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border px-2 lg:px-4 py-1.5 flex items-center gap-2 shadow-sm">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-4 h-4" />
          </Button>
          <AdminGlobalSearch />
          <AdminNotifications />
        </header>
        <main className="flex-1">
          <div className="p-2.5 lg:p-5 max-w-7xl">
            <AdminRoutes />
          </div>
        </main>
      </div>
    </div>
  );
}
