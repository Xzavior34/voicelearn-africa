# Competition evidence matrix

| Requirement | Implementation | Status | Evidence |
|---|---|---|---|
| Real voice interaction | `lib/client/useSpeechRecorder.ts` + `components/VoiceTutor.tsx` | **VERIFIED (code)** / LOCAL_DEVICE_TEST_REQUIRED | Real `MediaRecorder`/`getUserMedia` calls, no simulated audio. Not yet tested against a physical microphone from this environment. |
| Sahara integration | `lib/speech/providers/sahara.ts` (real streaming WS contract per docs.voice.intron.io), `lib/speech/audio-conversion.ts`, `app/api/speech/health/route.ts` | **VERIFIED (live)** | `npm run sahara:health` authenticates live against `wss://infer.voice.intron.io/stt/v1/stream` (`state: "authenticated"`, credit balance 1578). |
| 3-model benchmark | `lib/benchmark/runner.ts`, `npm run benchmark` | **VERIFIED (runs)** | Command runs successfully; Sahara reports `live: true` (`LOCAL_DEVICE_TEST_REQUIRED`), comparison models report `REQUIRES_API_ACCESS`. |
| Code-switching preserved, not translated away | `lib/tutor/intent.ts` language-pattern detection, `codeSwitchPreservation` metric | **VERIFIED** | `__tests__/intent.test.ts`; `lib/benchmark/metrics.ts` |
| Downstream educational task (not just STT) | `lib/tutor/session.ts` full pipeline | **VERIFIED** | `__tests__/session-flow.test.ts` — 3-turn test showing teach → question → assess → adapt |
| Adaptive learning loop (next question depends on last answer) | `lib/tutor/adaptation.ts` | **VERIFIED** | `__tests__/adaptation.test.ts`, `__tests__/session-flow.test.ts` |
| Education vertical | Full product (mathematics, science, English concepts) | **VERIFIED** | `lib/tutor/curriculum.ts` |
| Working prototype | Next.js app, `npm run build` succeeds | **VERIFIED (local build)** | Build log in this session; not deployed (see below) |
| Reproducible benchmark | `npm run benchmark` | **VERIFIED** | Deterministic, documented in `BENCHMARK_METHODOLOGY.md` |
| Automated tests | Vitest suite | **VERIFIED** | 44 tests (42 passing, 2 host-ffmpeg dependent skipped) |
| Lint / typecheck / build all pass | `npm run lint`, `npm run typecheck`, `npm run build` | **VERIFIED** | All three run clean in this session |
| Responsible AI documentation | `RESPONSIBLE_AI.md` | **VERIFIED (doc)** | — |
| Accessibility | Focus states, aria-live, skip link, typed-text fallback | **VERIFIED (code)** / not screen-reader-tested by a human | `app/globals.css`, `components/VoiceTutor.tsx` |
| Deployment | — | **BLOCKED (credentials)** | Vercel CLI is not authenticated; see README "Deployment" |
| School pilot / learner outcomes | — | **NOT CLAIMED — none exist** | N/A by design |
| Real audio dataset | Schema + protocol in `DATASET.md` | **LOCAL_DEVICE_TEST_REQUIRED** | Schema updated with `audioFilePath`; adult consent protocol defined; physical recordings require device mic |

## Status legend

- **VERIFIED** — actually run/tested in this session, with evidence cited.
- **REQUIRES_API_ACCESS** — code is real and complete, but needs live credentials this
  environment does not have to produce a live result.
- **LOCAL_DEVICE_TEST_REQUIRED** — code is real, but needs a physical device/microphone this
  environment does not have to verify end-to-end.
- **NOT DONE / NOT CLAIMED** — explicitly out of scope for this submission as built; no claim is
  made that it exists.
