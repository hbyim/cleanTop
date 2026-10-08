import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(githubPages
    ? {
        output: "export",
        basePath: "/cleanTop",
        trailingSlash: true,
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
