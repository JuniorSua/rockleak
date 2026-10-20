// Canonical site URL for metadata, sitemaps and structured data. Set SITE_URL once a domain is chosen.
export const SITE_URL = (process.env.SITE_URL ?? "https://rockleak-roan.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "RockLeak";
export const TAGLINE = "Bedrock facts. Every side.";
export const DESCRIPTION =
  "Only the political news that matters today: what happened, why it matters to you, and what's true. Checked against the record, three times a day.";

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
