"use client";
import React, { useEffect, useState } from "react";
import { relativeTime } from "@/app/pages/monitor/lib";

type Props = {
  /** mtime of the newest report received (0 = nothing yet). */
  timestamp: number;
  /** Time of the last successful poll. */
  lastFetch: number | null;
  error: string | null;
  /** Seconds after which data without a new report is flagged as stale. */
  staleAfter?: number;
};

/**
 * Connection + freshness indicator for the dashboard header.
 *   live     - polling works and a report arrived recently
 *   stale    - polling works but the producer has not written for a while
 *   offline  - the last poll failed
 *   waiting  - nothing received yet
 */
export function LiveBadge({ timestamp, lastFetch, error, staleAfter = 60 }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let kind: "live" | "stale" | "offline" | "waiting";
  let text: string;

  if (error) {
    kind = "offline";
    text = "Offline";
  } else if (!timestamp || !lastFetch) {
    kind = "waiting";
    text = "Waiting for data";
  } else if (now - timestamp > staleAfter * 1000) {
    kind = "stale";
    text = `Stale · last report ${relativeTime(timestamp, now)}`;
  } else {
    kind = "live";
    text = `Live · updated ${relativeTime(timestamp, now)}`;
  }

  return (
    <div className={`live live--${kind}`} role="status" aria-live="polite" title={error ?? undefined}>
      <span className="live__dot" aria-hidden="true" />
      <span className="live__text">{text}</span>
    </div>
  );
}
