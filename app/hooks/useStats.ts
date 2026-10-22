"use client";
import { useEffect, useRef, useState } from "react";

export type FileEntry<T = unknown> = { timestamp: number; content: T };
export type Reports = Record<string, FileEntry>;

export type StatsState = {
  /** Latest content of every JSON file, keyed by file name. */
  stats: Reports;
  /** mtime (ms) of the newest file received. 0 until the first payload. */
  timestamp: number;
  /** Wall-clock time (ms) of the last successful poll, or null. */
  lastFetch: number | null;
  /** Last network/HTTP error message, or null when polling is healthy. */
  error: string | null;
};

const URL = "/bookmarks/api/report";

/**
 * Polls the report endpoint. Only files newer than the last received
 * timestamp are returned, and polling pauses while the tab is hidden.
 */
export function useStats(interval = 1000): StatsState {
  const [state, setState] = useState<StatsState>({
    stats: {},
    timestamp: 0,
    lastFetch: null,
    error: null,
  });
  const since = useRef(0);

  useEffect(() => {
    let mounted = true;
    let inFlight = false;

    const tick = async () => {
      if (inFlight || document.visibilityState === "hidden") return;
      inFlight = true;
      try {
        const res = await fetch(`${URL}?since=${since.current}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!mounted) return;

        const hasData = Boolean(json.changed && json.data);
        if (hasData) since.current = json.timestamp;
        setState((prev) => ({
          stats: hasData ? { ...prev.stats, ...json.data } : prev.stats,
          timestamp: hasData ? json.timestamp : prev.timestamp,
          lastFetch: Date.now(),
          error: null,
        }));
      } catch (err) {
        if (mounted) setState((prev) => ({ ...prev, error: String(err) }));
      } finally {
        inFlight = false;
      }
    };

    tick();
    const id = setInterval(tick, interval);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [interval]);

  return state;
}
