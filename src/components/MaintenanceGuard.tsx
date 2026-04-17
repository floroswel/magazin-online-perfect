import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { useAdmin } from "@/hooks/useAdmin";
import { Flame } from "lucide-react";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { isMaintenanceMode, loading: maintenanceLoading } = useMaintenanceMode();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Don't block while loading
  if (maintenanceLoading || adminLoading) return <>{children}</>;

  // Admins bypass maintenance
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md space-y-6">
          <Flame className="h-16 w-16 mx-auto text-primary animate-pulse" />
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Ne întoarcem curând!
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Pregătim noi arome pentru lumânările noastre. Revino în curând pentru surprize parfumate! 🕯️
          </p>
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Mama Lucica — Lumânări artizanale handmade
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
