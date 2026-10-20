import type { Lean, Verdict } from "@/lib/types";

export const LEAN_ORDER: Lean[] = ["left", "lean-left", "center", "lean-right", "right"];

export const LEAN_LABEL: Record<Lean, string> = {
  left: "Left",
  "lean-left": "Leans left",
  center: "Center",
  "lean-right": "Leans right",
  right: "Right",
};

export const LEAN_COLOR: Record<Lean, string> = {
  left: "#2563eb",
  "lean-left": "#7aa7f5",
  center: "#8b5cf6",
  "lean-right": "#f08a8a",
  right: "#dc2626",
};

export const VERDICT_META: Record<Verdict, { label: string; color: string; icon: string }> = {
  confirmed: { label: "Confirmed", color: "#059669", icon: "●" },
  likely: { label: "Likely", color: "#0d9488", icon: "◐" },
  unverified: { label: "Unverified", color: "#646a73", icon: "○" },
  misleading: { label: "Misleading", color: "#d97706", icon: "◭" },
  false: { label: "False", color: "#dc2626", icon: "✕" },
};

/** Accepts 0-1 or 0-100 and returns an integer percent. */
export function pct(p: number) {
  return Math.round(p <= 1 ? p * 100 : p);
}

export function shortDate(iso: string | null) {
  if (!iso) return "";
  // Date-only values ("2026-10-18") are calendar days; parsing them as UTC midnight shows the day before in ET.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Remove quote marks the source text already wraps itself in, so we can add our own. */
export function unquote(s: string) {
  return s.trim().replace(/^["“”']+|["“”']+$/g, "");
}

const ET = "America/New_York";

/** "5:36 PM ET" */
export function etTime(iso: string) {
  return `${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: ET })} ET`;
}

/** The Eastern calendar day, "2026-10-20", for grouping. */
export function etDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: ET });
}

/** "Tuesday, October 20" */
export function dayHeading(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: ET });
}

/** Drop numbers read like release numbers: 7 -> "007". */
export function dropLabel(n: number) {
  return `Drop ${String(n).padStart(3, "0")}`;
}
