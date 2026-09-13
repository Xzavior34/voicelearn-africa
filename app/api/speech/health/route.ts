import { NextResponse } from "next/server";
import { speechProviders } from "@/lib/speech/registry";

export const runtime = "nodejs";

/**
 * Real provider health/authentication status — distinct from
 * `provider.isLive`, which only reflects whether credentials are
 * *configured*, not whether Sahara actually accepted them. This route
 * performs an actual (tiny) session for any provider that implements
 * `checkHealth()`. Never reports "authenticated" without a real call
 * having succeeded.
 */
export async function GET() {
  const results = await Promise.all(
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
  );
  return NextResponse.json({ results });
}
