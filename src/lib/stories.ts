import published from "../../content/stories.json";
import type { Story } from "@/lib/types";

// Published stories live in content/stories.json. Only scripts/newsroom.mts writes it,
// after the story passes schema checks and Plumb's approval (see newsroom/PLAYBOOK.md).
const STORIES = (published as Story[]).toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));

// Each story is a numbered "drop", counted from the first one ever published.
const NUMBERS = new Map(STORIES.toReversed().map((s, i) => [s.slug, i + 1]));

export function allStories(): Story[] {
  return STORIES;
}

export function getStory(slug: string): Story | undefined {
  return STORIES.find((s) => s.slug === slug);
}

export function dropNumber(story: Story): number {
  return NUMBERS.get(story.slug) ?? 0;
}
