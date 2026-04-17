import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VisibilityRecord {
  element_key: string;
  is_active: boolean;
  scheduled_from: string | null;
  scheduled_until: string | null;
}

let cache: Map<string, VisibilityRecord> = new Map();
let listeners: Set<() => void> = new Set();
let initialized = false;
let initializing = false;

function isWithinSchedule(record: VisibilityRecord): boolean {
  if (!record.is_active) return false;
  const now = new Date();
  if (record.scheduled_from && new Date(record.scheduled_from) > now) return false;
  if (record.scheduled_until && new Date(record.scheduled_until) < now) return false;
  return true;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function initVisibility() {
  if (initialized || initializing) return;
  initializing = true;
  const { data } = await (supabase as any)
    .from("site_visibility_settings")
    .select("element_key, is_active, scheduled_from, scheduled_until");
  if (data) {
    data.forEach((row: VisibilityRecord) => cache.set(row.element_key, row));
  }
  initialized = true;
  initializing = false;
  notifyListeners();

  // Realtime subscription
  supabase
    .channel("site_visibility_realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_visibility_settings" },
      (payload: any) => {
        const row = payload.new as VisibilityRecord | undefined;
        if (row?.element_key) {
          cache.set(row.element_key, row);
          notifyListeners();
        }
      }
    )
    .subscribe();
}

/**
 * Returns true if the element should be visible.
 * Returns null while loading.
 * If no record exists for the key, defaults to true (visible).
 */
export function useVisibility(elementKey: string): boolean | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    initVisibility();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  if (!initialized) return null;
  const record = cache.get(elementKey);
  if (!record) return true; // default visible
  return isWithinSchedule(record);
}

/**
 * Returns all visibility records and the total counts.
 */
export function useAllVisibility() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    initVisibility();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const all = Array.from(cache.values());
  const active = all.filter((r) => isWithinSchedule(r)).length;
  return { records: all, active, total: all.length, initialized };
}
