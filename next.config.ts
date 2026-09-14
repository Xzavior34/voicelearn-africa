import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ROOT CAUSE FIX (confirmed via production diagnosis, GET /api/speech/health
  // returned canExecute: false, code=ENOENT, resolvedPath: "ffmpeg" - meaning
  // our own require("ffmpeg-static") call never resolved to a real path at
  // all in production).
  //
  // ffmpeg-static's own index.js computes its binary path as
  // path.join(__dirname, "ffmpeg"). Next.js's default server bundling
  // inlines small packages like ffmpeg-static directly into the compiled
  // route chunk (confirmed: the compiled output for /api/speech had zero
  // occurrences of the string "ffmpeg-static" after a production build,
  // meaning its source was inlined rather than left as a real require()
  // against node_modules). Once inlined, __dirname no longer points at
  // node_modules/ffmpeg-static, so the computed path does not exist,
  // ffmpeg-static's own code sets its export to null, and our code falls
  // back to the bare "ffmpeg" string, which does not exist on PATH either.
  //
  // serverExternalPackages tells Next.js to leave this package as a
  // genuine runtime require() against the real node_modules folder
  // instead of bundling/rewriting its source, so __dirname resolves
  // correctly again. This is the documented mechanism for exactly this
  // class of problem.
  serverExternalPackages: ["ffmpeg-static"],

  // Kept as defense in depth even with the above fix: forces the binary
  // into every API route's file-tracing output regardless of environment.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/ffmpeg-static/**/*"],
  },
};

export default nextConfig;
