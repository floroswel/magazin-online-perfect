import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StoreBranding {
  name: string;
  emoji: string;
  tagline: string;
  phone: string;
  email: string;
  copyright: string;
}

const DEFAULTS: StoreBranding = {
  name: "VENTUZA",
  emoji: "🕯️",
  tagline: "Lumânări handmade din ceară de soia, create cu dragoste în România.",
  phone: "",
  email: "contact@ventuza.ro",
  copyright: `© ${new Date().getFullYear()} VENTUZA. Toate drepturile rezervate.`,
};

const StoreBrandingContext = createContext<StoreBranding>(DEFAULTS);

export function StoreBrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<StoreBranding>(DEFAULTS);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "store_branding")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && typeof data.value_json === "object" && !Array.isArray(data.value_json)) {
          const val = data.value_json as Record<string, unknown>;
          setBranding(prev => ({ ...prev, ...val } as StoreBranding));
          if (val.name) document.title = val.name as string;
        }
      });
  }, []);

  return (
    <StoreBrandingContext.Provider value={branding}>
      {children}
    </StoreBrandingContext.Provider>
  );
}

export function useStoreBranding() {
  return useContext(StoreBrandingContext);
}
