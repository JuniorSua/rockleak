import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Story photos come from Wikimedia Commons (free licenses only; see newsroom/PLAYBOOK.md)
  images: {
    remotePatterns: ["upload", "thumb"].map((h) => ({ protocol: "https" as const, hostname: `${h}.wikimedia.org`, pathname: "/wikipedia/commons/**" })),
  },
  // Share-image fonts are read from disk at request time for new stories
  outputFileTracingIncludes: { "/story/[slug]/opengraph-image": ["./assets/fonts/**"] },
  // Old routes from the first prototype
  async redirects() {
    return [
      { source: "/panel", destination: "/about", permanent: true },
      { source: "/method", destination: "/about", permanent: true },
      { source: "/odds", destination: "/midterms", permanent: true },
      { source: "/wire", destination: "/", permanent: false },
      { source: "/unreported", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
