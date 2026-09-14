import { NextResponse } from "next/server";
import { speechProviders } from "@/lib/speech/registry";
import { checkFfmpegAvailable } from "@/lib/speech/audio-conversion";

export const runtime = "nodejs";

/**
 * Real provider health/authentication status — distinct from
 * `provider.isLive`, which only reflects whether credentials are
 * *configured*, not whether Sahara actually accepted them. This route
 * performs an actual (tiny) session for any provider that implements
 * `checkHealth()`. Never reports "authenticated" without a real call
 * having succeeded.
 *
 * Also reports whether ffmpeg (used to convert browser-recorded audio
 * to the PCM16/16kHz/mono format Sahara requires) can actually execute
 * in this environment. This is the fastest way to diagnose an
 * AUDIO_CONVERSION_FAILED production issue without needing to record
 * real audio first.
 */
export async function GET() {
  const [results, ffmpeg] = await Promise.all([
    Promise.all(
      Object.values(speechProviders).map(async (provider) => {
        if (!provider.checkHealth) {
          return {
            provider: provider.name,
            state: provider.isLive ? "unknown_error" : "not_configured",
            message: provider.checkHealth
              ? undefined
              : "This provider does not implement a live health check.",
            checkedAt: new Date().toISOString(),
            latencyMs: null,
          };
        }
        return { provider: provider.name, ...(await provider.checkHealth()) };
      }),
    ),
    checkFfmpegAvailable(),
  ]);
  return NextResponse.json({ results, ffmpeg });
}
