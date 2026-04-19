import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe la schimbările pe app_settings și invalidează React Query cache.
 * Folosit în StorefrontLayout pentru sync live: orice modificare în admin
 * (theme, footer, contact, ticker, alert, meniuri etc.) se reflectă pe site
 * în <2s fără refresh.
 *
 * Invalidează queries care au în queryKey: "app_settings", "settings",
 * "theme", sau cheia exactă a setării modificate.
 */
export function useRealtimeSettings() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("app_settings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload) => {
          const key =
            (payload.new as any)?.key ?? (payload.old as any)?.key ?? null;

          // Invalidate broad caches
          qc.invalidateQueries({ queryKey: ["app_settings"] });
          qc.invalidateQueries({ queryKey: ["settings"] });
          qc.invalidateQueries({ queryKey: ["theme"] });
          qc.invalidateQueries({ queryKey: ["editable_content"] });
          qc.invalidateQueries({ queryKey: ["theme_text"] });

          // Invalidate by exact key if present
          if (key) {
            qc.invalidateQueries({ queryKey: [key] });
            qc.invalidateQueries({ queryKey: ["app_settings", key] });
            // Notify hooks listening on a custom event (CSS variables, branding)
            window.dispatchEvent(
              new CustomEvent("app-setting-changed", { detail: { key } })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
