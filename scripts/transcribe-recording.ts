import { existsSync, readFileSync } from "node:fs";
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
  const audioBuffer = readFileSync(resolve(process.cwd(), "benchmark/audio/learner_recording_01.wav"));
  for (const lang of ["en", "en-pcm"] as const) {
    try {
      console.log(`\n--- Transcribing with ${lang} ---`);
      const result = await saharaProvider.transcribe({ audioBytes: audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength), mimeType: "audio/wav", languagePair: lang });
      console.log("Result:", JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      console.error('Error for ' + lang + ':', err instanceof Error ? err.message : String(err));
    }
  }
}
main().catch(console.error);