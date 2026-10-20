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
  const d = new Date(iso);
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
