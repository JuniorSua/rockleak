import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { allStories, getStory } from "@/lib/stories";

export const alt = "RockLeak fact-checked story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allStories().map((s) => ({ slug: s.slug }));
}

// The share card: big number + headline. Built to be legible as a phone-sized thumbnail.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const story = getStory((await params).slug);
  const headline = story?.headline ?? "RockLeak";
  const stat = story?.stat;
  const [bold, medium] = await Promise.all(
    ["Bold", "Medium"].map((w) => readFile(join(process.cwd(), `assets/fonts/BarlowSemiCondensed-${w}.ttf`))),
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0b0d10", color: "white", padding: 64, fontFamily: "Barlow" }}>
        <div style={{ display: "flex", height: 8, width: "100%", background: "linear-gradient(90deg,#1f4fd6,#0e9f9a,#6d3fd6)", borderRadius: 4 }} />
        <div style={{ display: "flex", marginTop: 36, fontSize: 26, fontWeight: 500, letterSpacing: 4, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
          {story?.kicker ?? "Fact-checked"}
        </div>
        {stat && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, marginTop: 18 }}>
            <div style={{ fontSize: 140, fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 32, fontWeight: 500, color: "rgba(255,255,255,0.7)", maxWidth: 520, lineHeight: 1.25 }}>{stat.label}</div>
          </div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: stat ? 54 : 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1060 }}>{headline}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36, fontSize: 26 }}>
          <div style={{ display: "flex", fontWeight: 700, letterSpacing: 3 }}>ROCKLEAK</div>
          <div style={{ display: "flex", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Bedrock facts. Every side.</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Barlow", data: bold, weight: 700, style: "normal" },
        { name: "Barlow", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
