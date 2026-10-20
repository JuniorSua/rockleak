import seed from "../../content/seed-stories.json";
import type { Story } from "@/lib/types";

// Prototype storage: stories are JSON in /content. The pipeline will write to a
// database (see ARCHITECTURE.md) and this module becomes the read layer for it.
const STORIES = (seed as Story[]).toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function allStories(): Story[] {
  return STORIES;
}

export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}
