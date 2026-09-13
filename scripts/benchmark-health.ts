/**
 * Three-Model Benchmark Health Check.
 *
 * Models evaluated:
 *   1. Model A: Intron Sahara v2.5 (sahara) — Remote WebSocket API (SAHARA_API_KEY)
 *   2. Model B: OpenAI Whisper Large v3 (whisper-large-v3) — Local open weights (Apache-2.0, zero paid API)
 *   3. Model C: Meta Wav2Vec2 Large 960h (wav2vec2-large-960h) — Local open weights baseline (Apache-2.0, zero paid API)
 *
 * Usage: npm run benchmark:health
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
    break;
  }
}

import { saharaProvider } from "../lib/speech/providers/sahara";
import { whisperProvider } from "../lib/speech/providers/whisper";
import { wav2vec2Provider } from "../lib/speech/providers/wav2vec2";

async function main() {
  console.log("=================================================================");
  console.log(" VoiceLearn Africa — Three-Model Benchmark Health Check");
  console.log(" ZERO PAID ASR API DEPENDENCIES (Sahara API Key for Live Product)");
  console.log("=================================================================\n");

  const providers = [
    { id: "sahara", name: "Intron Sahara v2.5", provider: saharaProvider, runtime: "Remote API" },
    { id: "whisper-large-v3", name: "OpenAI Whisper Large v3", provider: whisperProvider, runtime: "Local Open-Weight" },
    { id: "wav2vec2-large-960h", name: "Meta Wav2Vec2 Large 960h", provider: wav2vec2Provider, runtime: "Local Baseline" },
  ];

  const results: Array<{
    id: string;
    name: string;
    model: string;
    runtime: string;
    state: string;
    message: string;
    device?: string;
    latencyMs: number | null;
  }> = [];

  for (const { id, name, provider, runtime } of providers) {
    process.stdout.write(`Checking ${name.padEnd(28)} [${runtime.padEnd(16)}] ... `);
    try {
      if (provider.checkHealth) {
        const health = await provider.checkHealth();
        results.push({
          id,
          name,
          model: provider.model || id,
          runtime,
          state: health.state,
          message: health.message,
          device: health.device,
          latencyMs: health.latencyMs,
        });
        const badge =
          health.state === "authenticated" || health.state === "model_ready" || health.state === "ready"
            ? "✅ READY"
            : health.state === "model_download_required"
              ? "📥 READY (DOWNLOAD ON FIRST RUN)"
              : health.state === "not_configured"
                ? "⚠️  NOT CONFIGURED (Set SAHARA_API_KEY)"
                : `❌ ${health.state.toUpperCase()}`;
        console.log(badge);
      } else {
        console.log("⚠️  NO HEALTH CHECK METHOD");
      }
    } catch (err) {
      console.log(`❌ ERROR: ${(err as Error).message}`);
      results.push({
        id,
        name,
        model: provider.model || id,
        runtime,
        state: "error",
        message: (err as Error).message,
        latencyMs: null,
      });
    }
  }

  console.log("\n-----------------------------------------------------------------");
  console.log("Detailed Summary:");
  for (const r of results) {
    console.log(`\n• ${r.name} (${r.model}) [${r.runtime}]`);
    console.log(`  Status:  ${r.state.toUpperCase()}`);
    console.log(`  Message: ${r.message}`);
    if (r.device) {
      console.log(`  Device:  ${r.device}`);
    }
    if (r.latencyMs !== null) {
      console.log(`  Health Check Latency: ${r.latencyMs}ms`);
    }
  }
  console.log("\n=================================================================");

  const readyCount = results.filter((r) => ["authenticated", "model_ready", "ready", "model_download_required"].includes(r.state)).length;
  console.log(`Benchmark models available: ${readyCount} / ${results.length}`);
  console.log("Run 'npm run benchmark' to execute the three-model benchmark on audio samples.");
}

main().catch((err) => {
  console.error("Health check failed:", err);
  process.exit(1);
});
