import type { NextConfig } from "next";

// Derive the next/image remote pattern from R2_PUBLIC_URL at build time
// instead of hardcoding it — the value is environment-specific and already
// configured wherever the app is deployed.
function r2RemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  if (!process.env.R2_PUBLIC_URL) return [];
  try {
    const { protocol, hostname } = new URL(process.env.R2_PUBLIC_URL);
    return [{ protocol: protocol.replace(":", "") as "http" | "https", hostname }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Allow the dev server's JS chunks (/_next/*) to load when the app is
  // reached from another device. Without this, Next.js blocks these as
  // cross-origin, the client never hydrates, and every interactive feature
  // (forms, buttons) silently falls back to native GET submission.
  allowedDevOrigins: ["192.168.1.183", "*.ngrok-free.app", "*.ngrok.app"],
  images: {
    remotePatterns: r2RemotePatterns(),
  },
};

export default nextConfig;
