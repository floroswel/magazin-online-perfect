import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyConfig {
  default_currency: string;
  currencies: { code: string; symbol: string; rate: number; }[];
}

interface CurrencyContextType {
  currency: string;
  symbol: string;
  setCurrency: (code: string) => void;
  convert: (amountRON: number) => number;
  format: (amountRON: number) => string;
  currencies: { code: string; symbol: string; rate: number; }[];
}

const DEFAULT_CONFIG: CurrencyConfig = {
  default_currency: "RON",
  currencies: [
    { code: "RON", symbol: "lei", rate: 1 },
    { code: "EUR", symbol: "€", rate: 0.2 },
    { code: "USD", symbol: "$", rate: 0.22 },
  ],
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CurrencyConfig>(DEFAULT_CONFIG);
  const [currency, setCurrencyState] = useState(() =>
    localStorage.getItem("shop_currency") || "RON"
  );

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "currency_settings")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json) {
          setConfig({ ...DEFAULT_CONFIG, ...(data.value_json as any) });
        }
      });
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem("shop_currency", code);
  }, []);

  const currentCurrency = config.currencies.find((c) => c.code === currency) || config.currencies[0];

  const convert = useCallback(
    (amountRON: number) => +(amountRON * currentCurrency.rate).toFixed(2),
    [currentCurrency]
  );

  const format = useCallback(
    (amountRON: number) => {
      const converted = convert(amountRON);
      if (currentCurrency.code === "RON") return `${converted.toLocaleString("ro-RO")} lei`;
      return `${currentCurrency.symbol}${converted.toLocaleString("en-US")}`;
    },
    [convert, currentCurrency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        symbol: currentCurrency.symbol,
        setCurrency,
        convert,
        format,
        currencies: config.currencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
