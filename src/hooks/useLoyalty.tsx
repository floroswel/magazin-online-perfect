import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface LoyaltyLevel {
  id: string;
  name: string;
  min_points: number;
  discount_percentage: number;
  color: string;
  icon: string;
  benefits: string[];
}

export function useLoyalty() {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<LoyaltyLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<LoyaltyLevel | null>(null);
  const [levels, setLevels] = useState<LoyaltyLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [pointsRes, levelsRes] = await Promise.all([
      supabase.from("loyalty_points").select("points").eq("user_id", user.id),
      supabase.from("loyalty_levels").select("*").order("min_points", { ascending: true }),
    ]);

    const pts = (pointsRes.data || []).reduce((sum, p) => sum + p.points, 0);
    setTotalPoints(pts);

    const lvls = (levelsRes.data || []) as LoyaltyLevel[];
    setLevels(lvls);

    // Find current level (highest level where min_points <= pts)
    const current = [...lvls].reverse().find(l => pts >= l.min_points) || lvls[0] || null;
    setCurrentLevel(current);

    // Find next level
    const nextIdx = current ? lvls.findIndex(l => l.id === current.id) + 1 : 0;
    setNextLevel(nextIdx < lvls.length ? lvls[nextIdx] : null);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPoints = async (points: number, action: string, description: string, orderId?: string) => {
    if (!user) return;
    await supabase.from("loyalty_points").insert({
      user_id: user.id, points, action, description, order_id: orderId || null,
    });
    await fetchData();
  };

  return { totalPoints, currentLevel, nextLevel, levels, loading, addPoints };
}
