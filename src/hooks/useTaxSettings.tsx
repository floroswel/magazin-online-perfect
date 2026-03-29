import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TaxSettings {
  prices_include_tax: boolean;
  display_tax_in_cart: boolean;
  tax_enabled: boolean;
  tax_included_message: string;
  show_tax_included_message: boolean;
  tax_rates: { name: string; rate: number; is_default: boolean }[];
}

const DEFAULTS: TaxSettings = {
  prices_include_tax: true,
  display_tax_in_cart: true,
  tax_enabled: true,
  tax_included_message: "Toate prețurile includ TVA",
  show_tax_included_message: true,
  tax_rates: [],
};

let cachedSettings: TaxSettings | null = null;
let fetchPromise: Promise<TaxSettings> | null = null;

function fetchTaxSettings(): Promise<TaxSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (fetchPromise) return fetchPromise;
  fetchPromise = supabase
    .from("app_settings")
    .select("*")
    .eq("key", "tax_settings")
    .maybeSingle()
    .then(({ data }) => {
      const s = data?.value_json
        ? { ...DEFAULTS, ...(data.value_json as unknown as TaxSettings) }
        : DEFAULTS;
      cachedSettings = s;
      return s;
    }) as Promise<TaxSettings>;
  return fetchPromise;
}

export function useTaxSettings() {
  const [settings, setSettings] = useState<TaxSettings>(cachedSettings || DEFAULTS);

  useEffect(() => {
    fetchTaxSettings().then(setSettings);
  }, []);

  return settings;
}
