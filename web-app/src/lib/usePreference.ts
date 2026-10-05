import { useEffect, useState } from "react";
import type { Metric } from "../data/mockData";

/** A per-viewer UI preference remembered in this browser (falls back to the default if storage is blocked). */
export function usePreference<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key) as T | null;
      return saved && allowed.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage blocked: the preference just won't be remembered.
    }
  }, [key, value]);
  return [value, setValue];
}

/** GP$ vs Sales$ toggle, shared by the dashboards and budgets so the choice follows the viewer between pages. */
export function useMetricPreference() {
  return usePreference<Metric>("add-impact-metric", "gp", ["gp", "sales"]);
}
