import type { Lean } from "@/lib/types";

// Outlet registry for The Wire. Feeds verified 2026-10-20. Lean labels follow
// AllSides / Ad Fontes conventions and should be re-checked periodically.
//
// `google` entries have no usable native feed (dead, blocked, or none), so they are
// discovered via Google News RSS. Google's terms limit reuse: discovery only,
// always link to the original outlet.

export interface Outlet {
  id: string;
  name: string;
  lean: Lean;
  feed?: string;
  google?: string; // domain for Google News site: search
  tier: "core" | "center" | "spectrum";
}

export const OUTLETS: Outlet[] = [
  // The "big three" the owner asked for first
  { id: "fox", name: "Fox News", lean: "right", tier: "core", feed: "https://moxie.foxnews.com/google-publisher/politics.xml" },
  { id: "cnn", name: "CNN", lean: "lean-left", tier: "core", google: "cnn.com" }, // native RSS stale since 2022
  { id: "politico", name: "Politico", lean: "lean-left", tier: "core", feed: "https://rss.politico.com/politics-news.xml" },

  // Center / wire
  { id: "ap", name: "AP", lean: "lean-left", tier: "center", google: "apnews.com" },
  { id: "reuters", name: "Reuters", lean: "center", tier: "center", google: "reuters.com" },
  { id: "thehill", name: "The Hill", lean: "center", tier: "center", feed: "https://thehill.com/homenews/feed/" },
  { id: "wsj", name: "WSJ", lean: "center", tier: "center", feed: "https://feeds.content.dowjones.io/public/rss/socialpoliticsfeed" },
  { id: "newsnation", name: "NewsNation", lean: "center", tier: "center", feed: "https://www.newsnationnow.com/politics/feed/" },
  { id: "semafor", name: "Semafor", lean: "center", tier: "center", feed: "https://www.semafor.com/rss.xml" },
  { id: "tangle", name: "Tangle", lean: "center", tier: "center", feed: "https://www.readtangle.com/rss/" },

  // Rest of the spectrum
  { id: "nyt", name: "New York Times", lean: "lean-left", tier: "spectrum", feed: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml" },
  { id: "nbc", name: "NBC News", lean: "lean-left", tier: "spectrum", feed: "https://feeds.nbcnews.com/nbcnews/public/politics" },
  { id: "npr", name: "NPR", lean: "lean-left", tier: "spectrum", feed: "https://feeds.npr.org/1014/rss.xml" },
  { id: "guardian", name: "The Guardian US", lean: "left", tier: "spectrum", feed: "https://www.theguardian.com/us-news/us-politics/rss" },
  { id: "wapo", name: "Washington Post", lean: "lean-left", tier: "spectrum", google: "washingtonpost.com" },
  { id: "axios", name: "Axios", lean: "lean-left", tier: "spectrum", google: "axios.com" },
  { id: "dispatch", name: "The Dispatch", lean: "lean-right", tier: "spectrum", feed: "https://thedispatch.com/feed/" },
  { id: "examiner", name: "Washington Examiner", lean: "lean-right", tier: "spectrum", feed: "https://www.washingtonexaminer.com/section/politics/feed/" },
  { id: "nr", name: "National Review", lean: "right", tier: "spectrum", feed: "https://www.nationalreview.com/politics-policy/feed/" },
  { id: "newsmax", name: "Newsmax", lean: "right", tier: "spectrum", google: "newsmax.com" },
  { id: "breitbart", name: "Breitbart", lean: "right", tier: "spectrum", feed: "https://feeds.feedburner.com/breitbart" },
];

export function feedUrl(o: Outlet) {
  if (o.feed) return o.feed;
  const q = encodeURIComponent(`site:${o.google} politics when:2d`);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}
