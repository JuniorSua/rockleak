// Canonical site URL for metadata, sitemaps and structured data. Set SITE_URL once a domain is chosen.
export const SITE_URL = (process.env.SITE_URL ?? "https://rockleak-roan.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "RockLeak";
export const TAGLINE = "Bedrock facts. Every side.";
export const DESCRIPTION =
  "RockLeak checks political news against the official record, shows how every side spun it, and digs up what nobody else is reporting.";

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
