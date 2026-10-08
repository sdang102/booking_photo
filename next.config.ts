import type { NextConfig } from "next";
import { createHash } from "node:crypto";

const themeScript = "document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'";
const themeScriptHash = createHash("sha256").update(themeScript).digest("base64");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseImagePattern = (() => {
  if (!supabaseUrl) return [];
  try {
    const url = new URL(supabaseUrl);
    return [{
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    }];
  } catch {
    return [];
  }
})();

const supabaseSources = (() => {
  if (!supabaseUrl) return { http: "", websocket: "" };
  try {
    const url = new URL(supabaseUrl);
    return { http: url.origin, websocket: `wss://${url.host}` };
  } catch {
    return { http: "", websocket: "" };
  }
})();

const isDevelopment = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'sha256-${themeScriptHash}'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: https://images.unsplash.com${supabaseSources.http ? ` ${supabaseSources.http}` : ""}`,
  `connect-src 'self'${supabaseSources.http ? ` ${supabaseSources.http} ${supabaseSources.websocket}` : ""}`,
  `media-src 'self'${supabaseSources.http ? ` ${supabaseSources.http}` : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 80, 82, 90],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      ...supabaseImagePattern,
    ],
  },
};

export default nextConfig;
