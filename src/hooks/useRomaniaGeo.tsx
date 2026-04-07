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
    const { data } = await (supabase
      .from("romania_localitati" as any)
      .select("*")
      .eq("judet_id", judetId)
      .order("tip")
      .order("nume") as any);
    setLocalitati((data || []) as Localitate[]);
    setLoadingLocalitati(false);
  };

  const clearLocalitati = () => setLocalitati([]);

  return { judete, localitati, fetchLocalitati, clearLocalitati, loadingLocalitati };
};

export default useRomaniaGeo;
