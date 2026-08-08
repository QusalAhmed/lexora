import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ---------------------------------------------------------------------------
  // Security Headers
  // Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy are required for
  // SharedArrayBuffer which PowerSync Web uses for multi-tab sync.
  // Google Fonts are NOT used via CDN — Next.js self-hosts them at build time
  // so COEP: require-corp does not break font loading.
  // ---------------------------------------------------------------------------
  async headers(): Promise<
    { source: string; headers: { key: string; value: string }[] }[]
  > {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
    ];
  },

  // ---------------------------------------------------------------------------
  // Turbopack — Next.js 16 uses Turbopack by default.
  // Empty config silences the "webpack config with no turbopack config" error.
  // Turbopack handles WASM natively, no extra configuration needed.
  // ---------------------------------------------------------------------------
  turbopack: {},
};

export default nextConfig;
