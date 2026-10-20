import { XMLParser } from "fast-xml-parser";
import { cacheLife } from "next/cache";
import { OUTLETS, feedUrl, type Outlet } from "@/lib/sources";
import type { Lean, WireCluster, WireItem } from "@/lib/types";

const UA = "Mozilla/5.0 (compatible; RockLeakWire/0.1; +https://github.com/JuniorSua/rockleak)";
const MAX_AGE_MS = 48 * 3600_000;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });

type Node = Record<string, unknown>;

function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Node)) return String((v as Node)["#text"]);
  return "";
}

function clean(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Number.parseInt(h, 16)))
    .replace(/&(amp|quot|apos|#39|nbsp|lt|gt);/g, (m) => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&nbsp;": " ", "&lt;": "<", "&gt;": ">" })[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

async function readOutlet(o: Outlet, now: number): Promise<WireItem[]> {
  try {
    const res = await fetch(feedUrl(o), { headers: { "user-agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const doc = parser.parse(await res.text()) as Node;
    const channel = (doc.rss as Node | undefined)?.channel as Node | undefined;
    const raw = (channel?.item ?? (doc.feed as Node | undefined)?.entry ?? []) as Node | Node[];
    const items = Array.isArray(raw) ? raw : [raw];
    return items
      .map((it): WireItem => {
        let title = clean(text(it.title));
        // Google News titles are "Headline - Outlet"
        if (o.google) title = title.replace(/\s+-\s+[^-]+$/, "");
        const link = typeof it.link === "object" ? String((it.link as Node)["@href"] ?? "") : text(it.link);
        const date = text(it.pubDate) || text(it.published) || text(it.updated) || text(it["dc:date"]);
        const parsed = date ? Date.parse(date) : NaN;
        return {
          outletId: o.id,
          outlet: o.name,
          lean: o.lean,
          title,
          url: link.trim(),
          publishedAt: Number.isNaN(parsed) ? null : new Date(parsed).toISOString(),
          summary: o.google ? "" : clean(text(it.description) || text(it.summary)).slice(0, 280),
        };
      })
      .filter((i) => i.title && i.url && (!i.publishedAt || now - Date.parse(i.publishedAt) < MAX_AGE_MS))
      .slice(0, 25);
  } catch {
    return [];
  }
}

/** Pull every outlet's political feed. Cached for a minute, refreshed in the background. */
export async function getWire(): Promise<{ items: WireItem[]; fetchedAt: string; outletsUp: number }> {
  "use cache";
  cacheLife("minutes");
  const now = Date.now();
  const results = await Promise.all(OUTLETS.map((o) => readOutlet(o, now)));
  const items = results.flat().toSorted((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return { items, fetchedAt: new Date(now).toISOString(), outletsUp: results.filter((r) => r.length).length };
}

// --- Clustering --------------------------------------------------------------
// Cheap and explainable: headlines that share >= 2 distinctive words (names,
// places, topics) are treated as the same story. The pipeline can refine with an LLM.

const STOP = new Set(
  "a an the and or but of to in on for with at by from as is are was were be been it its this that these those he she they his her their our we you i not no new says say said after over into about amid than more most what why how who will would could can may just up out off vs us u.s. week day news live update updates opinion analysis video watch here there".split(
    " ",
  ),
);

function keywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[’']s\b/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

const LEAN_SIDE: Record<Lean, -1 | 0 | 1> = { left: -1, "lean-left": -1, center: 0, "lean-right": 1, right: 1 };

export function clusterWire(items: WireItem[]): WireCluster[] {
  // Weight shared words by rarity (IDF): "Trump" or "Senate" appear everywhere and
  // say little; "Patriot" + "Ukraine" together pin down one event.
  const keyed = items.map((item) => ({ item, k: keywords(item.title) })).filter((x) => x.k.size >= 2);
  const df = new Map<string, number>();
  for (const { k } of keyed) for (const w of k) df.set(w, (df.get(w) ?? 0) + 1);
  const n = keyed.length || 1;
  const idf = (w: string) => Math.log(n / (df.get(w) ?? 1));
  const common = Math.log(10); // words in >10% of headlines carry no signal

  function similarity(a: Set<string>, b: Set<string>) {
    let shared = 0;
    let score = 0;
    for (const w of a) {
      if (!b.has(w)) continue;
      const v = idf(w);
      if (v < common) continue;
      shared++;
      score += v;
    }
    return shared >= 2 ? score : 0;
  }

  const groups: { seeds: Set<string>[]; items: WireItem[] }[] = [];
  const THRESHOLD = 8;
  for (const { item, k } of keyed) {
    let best: (typeof groups)[number] | undefined;
    let bestScore = THRESHOLD;
    for (const g of groups) {
      // Compare only to the cluster's first few headlines so clusters can't snowball.
      const s = Math.max(...g.seeds.map((seed) => similarity(k, seed)));
      if (s >= bestScore) {
        best = g;
        bestScore = s;
      }
    }
    if (best) {
      best.items.push(item);
      if (best.seeds.length < 3) best.seeds.push(k);
    } else {
      groups.push({ seeds: [k], items: [item] });
    }
  }

  return groups
    .map((g, idx) => {
      // One headline per outlet keeps a chatty feed from dominating a cluster.
      const seen = new Set<string>();
      const uniq = g.items.filter((i) => !seen.has(i.outletId) && seen.add(i.outletId));
      const sides = new Set(uniq.map((i) => LEAN_SIDE[i.lean]));
      return {
        id: `c${idx}-${[...keywords(uniq[0].title)].slice(0, 3).join("-")}`,
        label: uniq[0].title,
        items: uniq,
        leans: [...new Set(uniq.map((i) => i.lean))],
        balance: sides.size / 3,
      };
    })
    .filter((c) => c.items.length >= 2)
    .toSorted((a, b) => b.items.length - a.items.length || b.balance - a.balance);
}

export async function getWireClusters(): Promise<WireCluster[]> {
  const { items } = await getWire();
  return clusterWire(items);
}
