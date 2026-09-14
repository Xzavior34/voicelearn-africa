import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Defensive hardening for Vercel: ffmpeg-static ships a native binary,
  // not just JS. Vercel's automatic file-tracing (which decides what gets
  // bundled into each serverless function) usually picks this up
  // correctly, but native binaries resolved from node_modules are a known
  // occasional gotcha — if it's ever silently excluded, /api/speech's
  // audio conversion fails invisibly in production even though it works
  // locally. This explicitly forces the binary into every API route's
  // bundle so that possibility is ruled out regardless of environment.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;
