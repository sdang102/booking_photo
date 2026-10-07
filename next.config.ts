import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
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
