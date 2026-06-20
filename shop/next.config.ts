import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app. The repo root still has a leftover
  // package-lock.json from the old MERN app, which makes Next/Turbopack infer
  // the wrong workspace root and emit build output where Vercel can't serve it
  // (causing platform 404s). These force the root to be shop/.
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,

  // Allow the dev server's JS chunks (/_next/*) to load when the app is
  // reached from another device. Without this, Next.js blocks these as
  // cross-origin, the client never hydrates, and every interactive feature
  // (forms, buttons) silently falls back to native GET submission.
  allowedDevOrigins: ["192.168.1.183", "*.ngrok-free.app", "*.ngrok.app"],
};

export default nextConfig;
