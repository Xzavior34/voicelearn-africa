/**
 * Fast, real Sahara authentication check.
 *
 * Usage: npm run sahara:health
 *
 * Opens one real session against the live endpoint with ~1s of
 * silence and reports whether the API key actually authenticated.
 * This is deliberately separate from the full benchmark (which
 * processes all 32 dataset samples) so you get a yes/no on
 * credentials in seconds, not minutes.
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

async function main() {
  if (!saharaProvider.checkHealth) {
    console.error("saharaProvider does not implement checkHealth().");
    process.exit(1);
  }

  console.log("Checking Sahara connectivity/authentication...");
  const result = await saharaProvider.checkHealth();
  console.log(JSON.stringify(result, null, 2));

  switch (result.state) {
    case "authenticated":
      console.log("\n✅ Sahara is authenticated and reachable. You can now run: npm run benchmark");
      process.exit(0);
      break;
    case "not_configured":
      console.log("\n⚠️  SAHARA_API_KEY is not set. Add it to .env.local.");
      process.exit(1);
      break;
    case "auth_failed":
      console.log("\n❌ Sahara rejected the API key (AUTHENTICATION_ERROR). Double-check SAHARA_API_KEY.");
      process.exit(1);
      break;
    case "quota_exceeded":
      console.log("\n⚠️  Sahara reports quota exceeded for this key.");
      process.exit(1);
      break;
    case "unreachable":
      console.log("\n❌ Could not reach Sahara (network/timeout). Check SAHARA_WS_URL and network access.");
      process.exit(1);
      break;
    default:
      console.log("\n❌ Unknown error — see message above.");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
