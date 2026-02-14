import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Shield } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminRoutes from "@/components/admin/AdminRoutes";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
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
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acces interzis</h1>
          <p className="text-muted-foreground">Nu ai permisiuni de administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Top bar with search */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b px-6 py-3 flex items-center">
          <AdminGlobalSearch />
        </header>
        <main className="flex-1">
          <div className="p-6 lg:p-8 max-w-7xl">
            <AdminRoutes />
          </div>
        </main>
      </div>
    </div>
  );
}
