# FINAL SUBMISSION EVIDENCE — Regamos VoiceLearn Africa

Prepared for: Intron Sahara CodeSwitch Africa Challenge
Status of this document: every claim below is either (a) measured and cited to a specific artifact in this repo, or (b) explicitly marked as not yet measured / pending. No claim in this document should be read as "100% accurate," "production validated," or "proven to improve learning outcomes" unless a specific measurement is cited. **"Verified" means a real measurement occurred — it does not mean the measured accuracy is high. Read the actual numbers, not just the status column.**

---

## 1. Live URL

**[ADD FINAL DEPLOYED URL BEFORE SUBMISSION]** — not knowable from this pass; confirm it loads on desktop and mobile, and re-test the voice/microphone flow specifically, before submitting.

## 2. Repository URL

https://github.com/Xzavior34/voicelearn-africa (verified commit `ec9ac62`)

## 3. Demo Video URL

**[ADD FINAL DEMO VIDEO URL BEFORE SUBMISSION]** — not created as part of this pass; see `DEMO_SCRIPT.md` for the recording script.

---

## A. What is actually VERIFIED

Source: `benchmark/results/summary.json`, run `run-1789350091875`, generated 2026-09-14 on a real device with `SAHARA_API_KEY` configured and all local model files present.

| Model | Physical Samples Measured | WER | CER | CS-WER (`vl-035`) | Mean Latency | Status |
|---|---|---|---|---|---|---|
| Intron Sahara v2.5 | 2/35 | 40.2% | 37.0% | 76.8% | ~16.0s | `VERIFIED` |
| OpenAI Whisper Tiny | 1/35 | 25.0% | 11.9% | N/A (device timeout) | ~43.7s | `VERIFIED` |
| OpenAI Whisper Base | 1/35 | 17.9% | 10.3% | N/A (device timeout) | ~85.2s | `VERIFIED` |
| Meta Wav2Vec2 Base 960h | 2/35 | 71.4% | 34.7% | 85.7% | ~47.2s | `VERIFIED` |

**Read this honestly:**
- **N=2 physical recordings out of 35 total dataset samples.** Every number above is a single-sample case study per model — do not describe any cell as "the" accuracy of a model, and do not claim Sahara is "the most accurate" without noting this is a two-sample, mixed comparison (Sahara and Wav2Vec2 both measured on both recordings; Whisper Tiny/Base only measured on the shorter one).
- Whisper Tiny/Base did not complete a measurement on the 26.6s `vl-035` recording in this run — a genuine device-side timeout (180s) on the test device's CPU, not a hidden or fabricated result.
- Local-model latencies (44–88s) reflect CPU inference on a phone-class device — not representative of any production deployment.
- The genuine code-switched recording's error rates (CS-WER 76.8%/85.7% for the two models that measured it) are real and not flattering — that is useful signal about how hard this benchmark's code-switching is, not something to downplay.
- Downstream (ASR→tutor) result on `vl-001` (single, simple math question): Sahara, Whisper Tiny, and Whisper Base all reached a successful tutor turn; Wav2Vec2 Base 960h did not. On `vl-035` (one utterance covering four separate questions): only Wav2Vec2 Base 960h's transcript reached a successful tutor turn; Sahara's did not, and Whisper Tiny/Base have no result for this sample. Source: `benchmark/results/raw-results.json`.

**Dataset:** 35 total samples, 2 physical audio recordings (`vl-001` standard English, `vl-035` genuine English/Nigerian-Pidgin code-switching), 33 text-only functional fixtures (tutor reasoning tests only, never ASR evidence). Full detail in `DATASET.md`.

**Test suite:** 143 automated tests passing, including regression coverage for the exact stale-topic sequence (Pidgin math → evaporation → photosynthesis → affect/effect) and turn-cancellation safety.

## B. What the evaluator can reproduce

```bash
npm install
npm run typecheck && npm run lint && npm test && npm run build
npm run benchmark:health     # confirms which models are locally ready, no credentials needed for the local ones
```

Reproducing the exact benchmark numbers above additionally requires:
1. A real `SAHARA_API_KEY` (see Section C).
2. The three local model weight files placed at `models/whisper-tiny/`, `models/whisper-base/`, `models/wav2vec2-base-960h/` per `LOCAL_MODEL_SETUP.md` (not included in this repository — see Section E).
3. `npm run benchmark` or `npm run benchmark:verify`.

Without both of the above, the local models will correctly report `BLOCKED (MODEL_NOT_FOUND)` and Sahara will correctly report `BLOCKED (REQUIRES_API_ACCESS)` — that is expected, honest behavior, not a bug.

## C. What requires the Sahara API key / environment

- Sahara's row in the table above cannot be reproduced without a real `SAHARA_API_KEY` (see `.env.example`). There is no way to run it without real credentials, by design (Sahara is a metered third-party API).
- The exact latency figures are specific to the network conditions and device used for this run; re-running will produce a new, real, possibly different latency (not a discrepancy — Sahara is a remote service).

## D. What is included in the public repository

- All application and benchmark code, including the four provider implementations (`lib/speech/providers/`), the benchmark runner and scripts, and the full test suite.
- The two physical audio WAV fixtures (`benchmark/audio/learner_recording_01.wav`, `benchmark/audio/affect_codeswitch_01.wav`) — small files, safe to commit.
- The committed benchmark results (`benchmark/results/summary.json`, `benchmark/results/raw-results.json`) from the real run cited above.
- All documentation, including `LOCAL_MODEL_SETUP.md` explaining exactly how to reproduce the local-model setup.

## E. What is intentionally NOT committed (security/size reasons)

- **Local model weights** (`models/whisper-tiny/`, `models/whisper-base/`, `models/wav2vec2-base-960h/`) — these are large binary files (hundreds of MB each) and are publicly available from Hugging Face; committing them would bloat the repository for no reproducibility benefit. `.gitignore` excludes `models/` and `*.safetensors`/`*.bin`.
- **`.env.local`** and any real value of `SAHARA_API_KEY` — never committed, never printed in any document in this repository. `.env.example` shows the variable names only, with no values.
- Hugging Face cache directories or any other local-machine-specific paths.

## F. Responsible AI Statement

VoiceLearn Africa is positioned as a **low-stakes revision and homework companion used alongside classroom teachers, never in place of human educators** (`RESPONSIBLE_AI.md`). No clinical, legal, financial, or high-stakes educational authority is claimed. No completed school pilot, measured learning improvement, or deployment outcome is claimed anywhere in this repository — any such claim added later must cite specific evidence or be explicitly labeled proposed/future. This statement has not changed and contains no contradiction with the verified benchmark above.

## G. Known Limitations

- **N=2 physical recordings total, N=1 genuine code-switched recording, out of 35 dataset samples.** Every WER/CER/CS-WER figure is a single-sample case study.
- Whisper Tiny and Whisper Base did not produce a measurement on `vl-035` in the cited run (device timeout).
- Only Wav2Vec2 Base 960h's downstream pipeline result succeeded on the multi-topic `vl-035` utterance; Sahara's did not, and Whisper Tiny/Base have no result for it.
- Local-model latencies in this run (44–88s) are specific to the constrained test device and not representative of production.
- The live Vercel deployment's voice flow has not been independently re-confirmed as part of this documentation pass — test it yourself before submitting (see Section 1).
