import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Judet {
  id: number;
  nume: string;
  abreviere: string;
}

interface Localitate {
  id: number;
  judet_id: number;
  nume: string;
  tip: string | null;
}

const useRomaniaGeo = () => {
  const [judete, setJudete] = useState<Judet[]>([]);
  const [localitati, setLocalitati] = useState<Localitate[]>([]);
  const [loadingLocalitati, setLoadingLocalitati] = useState(false);

  useEffect(() => {
    (supabase.from("romania_judete" as any).select("*").order("nume") as any)
      .then(({ data }: any) => setJudete((data || []) as Judet[]));
  }, []);

  const fetchLocalitati = async (judetId: number) => {
    setLoadingLocalitati(true);
    try {
      // Find the abbreviation for this judet
      const judet = judete.find(j => j.id === judetId);
      if (!judet?.abreviere) {
        setLocalitati([]);
        setLoadingLocalitati(false);
        return;
      }

      // Use Roloca API via edge function for accurate data
      const { data: apiData, error } = await supabase.functions.invoke(
        "get-localities",
        { body: { judetAuto: judet.abreviere } }
      );

      if (!error && apiData?.localities?.length > 0) {
        const mapped: Localitate[] = apiData.localities.map((l: any, idx: number) => ({
          id: l.id || idx + 1,
          judet_id: judetId,
          nume: l.nume,
          tip: l.tip || null,
        }));
        setLocalitati(mapped);
      } else {
        // Fallback to DB if API fails
        const { data } = await (supabase
          .from("romania_localitati" as any)
          .select("*")
          .eq("judet_id", judetId)
          .order("tip")
          .order("nume") as any);
        setLocalitati((data || []) as Localitate[]);
      }
    } catch (err) {
      console.error("Error fetching localities:", err);
      // Fallback to DB
      const { data } = await (supabase
        .from("romania_localitati" as any)
        .select("*")
        .eq("judet_id", judetId)
        .order("tip")
        .order("nume") as any);
      setLocalitati((data || []) as Localitate[]);
    }
    setLoadingLocalitati(false);
  };

  const clearLocalitati = () => setLocalitati([]);

  return { judete, localitati, fetchLocalitati, clearLocalitati, loadingLocalitati };
};

export default useRomaniaGeo;
