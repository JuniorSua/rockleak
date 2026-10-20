"use client";

import { useSyncExternalStore } from "react";

// Election Day 2026: we count to midnight ET on Nov 3.
const ELECTION = Date.parse("2026-11-03T05:00:00Z");

function daysLeft() {
  return Math.max(0, Math.ceil((ELECTION - Date.now()) / 86_400_000));
}

function subscribe(onChange: () => void) {
  const t = setInterval(onChange, 60_000);
  return () => clearInterval(t);
}

export function Countdown() {
  // null on the server so the static shell never bakes in a stale count
  const days = useSyncExternalStore(subscribe, daysLeft, () => null);
  if (days === null) return <span>MIDTERMS · NOV 3</span>;
  if (days === 0) return <span className="text-signal">ELECTION DAY</span>;
  return (
    <span>
      MIDTERMS IN <span className="text-signal">{days}</span> {days === 1 ? "DAY" : "DAYS"}
    </span>
  );
}
