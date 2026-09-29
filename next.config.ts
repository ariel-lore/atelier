import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Quick Tunnel (cloudflared) loads /_next from a *.trycloudflare.com host.
  // Setting this switches Next from a warning to an allow-list, so the pattern must stay.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
