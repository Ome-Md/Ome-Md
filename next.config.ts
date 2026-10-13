import type { NextConfig } from "next";

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  agentRules: false,
  devIndicators: false,
  distDir: process.env.ACADEMY_NEXT_DIST_DIR ?? ".next",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  outputFileTracingExcludes: {
    "/*": [
      "./.academy-data/**/*",
      "./.env*",
      "./.next-test/**/*",
      "./tests/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
