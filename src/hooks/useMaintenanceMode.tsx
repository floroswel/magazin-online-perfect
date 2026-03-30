import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "is_maintenance_mode")
        .maybeSingle();
      setIsMaintenanceMode(data?.value === true);
      setLoading(false);
    };
    fetch();

    // Listen for realtime changes
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.is_maintenance_mode" },
        (payload: any) => {
          setIsMaintenanceMode(payload.new?.value === true);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { isMaintenanceMode, loading };
}
