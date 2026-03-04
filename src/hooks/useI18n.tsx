import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Translations = Record<string, string>;

interface I18nContextType {
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string, fallback?: string) => string;
  locales: { code: string; name: string; flag: string }[];
}

const SUPPORTED_LOCALES = [
  { code: "ro", name: "Română", flag: "🇷🇴" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hu", name: "Magyar", flag: "🇭🇺" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(() =>
    localStorage.getItem("shop_locale") || "ro"
  );
  const [translations, setTranslations] = useState<Record<string, Translations>>({});

  useEffect(() => {
    // Load translations from DB
    supabase
      .from("app_settings")
      .select("value_json")
      .eq("key", "translations")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_json && typeof data.value_json === "object") {
          setTranslations(data.value_json as Record<string, Translations>);
        }
      });
  }, []);

  const setLocale = useCallback((l: string) => {
    setLocaleState(l);
    localStorage.setItem("shop_locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return translations[locale]?.[key] || fallback || key;
    },
    [locale, translations]
  );

  return (
    <I18nContext.Provider
      value={{ locale, setLocale, t, locales: SUPPORTED_LOCALES }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
