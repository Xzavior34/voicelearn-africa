/**
 * Three-Model Benchmark Health Check.
 *
 * Usage: npm run benchmark:health
 *
 * Checks connectivity and authentication status for:
 *   1. Intron Sahara v2.5 (sahara)
 *   2. OpenAI Whisper Large v3 (whisper-large-v3)
 *   3. Google Gemini Audio (gemini)
 *
 * Never exposes secrets or prints API keys.
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
import { geminiProvider } from "../lib/speech/providers/gemini";

async function main() {
  console.log("=================================================================");
  console.log(" VoiceLearn Africa — Three-Model Benchmark Health Check");
  console.log("=================================================================\n");

  const providers = [
    { id: "sahara", name: "Intron Sahara v2.5", provider: saharaProvider, envKey: "SAHARA_API_KEY" },
    { id: "whisper-large-v3", name: "OpenAI Whisper Large v3", provider: whisperProvider, envKey: "OPENAI_API_KEY" },
    { id: "gemini", name: "Google Gemini Audio", provider: geminiProvider, envKey: "GOOGLE_API_KEY" },
  ];

  const results: Array<{
    id: string;
    name: string;
    model: string;
    state: string;
    message: string;
    latencyMs: number | null;
  }> = [];

  for (const { id, name, provider, envKey } of providers) {
    process.stdout.write(`Checking ${name.padEnd(26)} ... `);
    try {
      if (provider.checkHealth) {
        const health = await provider.checkHealth();
        results.push({
          id,
          name,
          model: provider.model || id,
          state: health.state,
          message: health.message,
          latencyMs: health.latencyMs,
        });
        const badge =
          health.state === "authenticated"
            ? "✅ READY / AUTHENTICATED"
            : health.state === "not_configured"
              ? `⚠️  NOT CONFIGURED (Set ${envKey})`
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
        state: "error",
        message: (err as Error).message,
        latencyMs: null,
      });
    }
  }

  console.log("\n-----------------------------------------------------------------");
  console.log("Detailed Summary:");
  for (const r of results) {
    console.log(`\n• ${r.name} (${r.model})`);
    console.log(`  Status:  ${r.state.toUpperCase()}`);
    console.log(`  Message: ${r.message}`);
    if (r.latencyMs !== null) {
      console.log(`  Latency: ${r.latencyMs}ms`);
    }
  }
  console.log("\n=================================================================");

  const readyCount = results.filter((r) => r.state === "authenticated").length;
  console.log(`Providers ready for live execution: ${readyCount} / ${results.length}`);

  if (readyCount > 0) {
    console.log("Run 'npm run benchmark' to evaluate dataset with available models.");
  } else {
    console.log("To run live benchmark comparisons, add provider API keys to .env.local.");
  }
}

main().catch((err) => {
  console.error("Health check failed:", err);
  process.exit(1);
});
