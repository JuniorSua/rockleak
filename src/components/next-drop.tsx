"use client";

import { useSyncExternalStore } from "react";

// The newsroom checks in at 9 AM, 5 PM and 10 PM Eastern (newsroom/PLAYBOOK.md).
const SLOTS = [
  [9, "9 AM"],
  [17, "5 PM"],
  [22, "10 PM"],
] as const;

function nextCheckIn() {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hourCycle: "h23", timeZone: "America/New_York" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const now = get("hour") + get("minute") / 60;
  const next = SLOTS.find(([h]) => h > now);
  return next ? `${next[1]} ET` : "9 AM ET tomorrow";
}

function subscribe(onChange: () => void) {
  const t = setInterval(onChange, 60_000);
  return () => clearInterval(t);
}

export function NextDrop() {
  // null on the server so the static shell never bakes in a stale time
  const next = useSyncExternalStore(subscribe, nextCheckIn, () => null);
  return next ? <>Next check-in: {next}</> : <>Check-ins at 9 AM, 5 PM and 10 PM ET</>;
}
