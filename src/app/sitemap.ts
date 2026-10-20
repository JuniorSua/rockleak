import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { allStories } from "@/lib/stories";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/midterms", "/unreported", "/wire", "/about"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "hourly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const stories = allStories().map((s) => ({
    url: `${SITE_URL}/story/${s.slug}`,
    lastModified: s.publishedAt,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));
  return [...pages, ...stories];
}
