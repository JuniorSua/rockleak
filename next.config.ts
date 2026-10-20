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
  // Share-image fonts are read from disk at request time for new stories
  outputFileTracingIncludes: { "/story/[slug]/opengraph-image": ["./assets/fonts/**"] },
  // Old routes from the first prototype
  async redirects() {
    return [
      { source: "/panel", destination: "/about", permanent: true },
      { source: "/method", destination: "/about", permanent: true },
      { source: "/odds", destination: "/midterms", permanent: true },
    ];
  },
};

export default nextConfig;
