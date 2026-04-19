import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Theme Text Provider
 * ─────────────────────────────────────────────────────────────
 * Centralizat pentru toate textele editabile din temă.
 * Toate cheile încep cu prefixul `theme_text_` și sunt
 * citite din tabela `app_settings`. Sincronizare în timp real
 * via Supabase Realtime — orice modificare în admin se reflectă
 * instant pe storefront fără refresh.
 */

type TextMap = Record<string, string>;

interface ThemeTextContextValue {
  texts: TextMap;
  t: (key: string, fallback?: string) => string;
  setText: (key: string, value: string) => Promise<boolean>;
  loading: boolean;
}

const ThemeTextContext = createContext<ThemeTextContextValue>({
  texts: {},
  t: (_k, fb) => fb ?? "",
  setText: async () => false,
  loading: true,
});

const CACHE_KEY = "ml_theme_texts_cache";

function loadCache(): TextMap {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCache(map: TextMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {}
}

export function ThemeTextProvider({ children }: { children: ReactNode }) {
  const [texts, setTexts] = useState<TextMap>(() => loadCache());
  const [loading, setLoading] = useState(true);

  const fetchTexts = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value_json")
      .like("key", "theme_text_%");
    if (error) {
      setLoading(false);
      return;
    }
    const map: TextMap = {};
    (data ?? []).forEach((row: any) => {
      const v = row.value_json;
      const str = typeof v === "string" ? v : (v == null ? "" : JSON.stringify(v));
      // unwrap accidental JSON-string quotes
      map[row.key] = str.replace(/^"|"$/g, "");
    });
    setTexts(map);
    saveCache(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTexts();
    // Realtime: orice schimbare la app_settings cu cheie `theme_text_*` re-fetch
    const channel = supabase
      .channel("theme_texts_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload: any) => {
          const key = (payload.new?.key ?? payload.old?.key) as string | undefined;
          if (key && key.startsWith("theme_text_")) fetchTexts();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTexts]);

  const t = useCallback(
    (key: string, fallback = "") => {
      const full = key.startsWith("theme_text_") ? key : `theme_text_${key}`;
      return texts[full] ?? fallback;
    },
    [texts]
  );

  const setText = useCallback(async (key: string, value: string) => {
    const full = key.startsWith("theme_text_") ? key : `theme_text_${key}`;
    // optimistic
    setTexts(prev => {
      const next = { ...prev, [full]: value };
      saveCache(next);
      return next;
    });
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: full, value_json: value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return !error;
  }, []);

  return (
    <ThemeTextContext.Provider value={{ texts, t, setText, loading }}>
      {children}
    </ThemeTextContext.Provider>
  );
}

export function useThemeText() {
  return useContext(ThemeTextContext);
}
