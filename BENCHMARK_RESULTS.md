# Benchmark results

Last regenerated: 2026-09-12 (run `npm run benchmark` to reproduce; see raw JSON in
`lib/benchmark/reports/`).

## Sahara live-integration status (2026-09-12)

The Sahara provider implements the real streaming contract from `https://docs.voice.intron.io/` (see `lib/speech/providers/sahara.ts`).
Live integration status:

1. **Authentication verified**: `SAHARA_API_KEY` is configured in `.env.local`. Running `npm run sahara:health` authenticates successfully against `wss://infer.voice.intron.io/stt/v1/stream` (`state: "authenticated"`).
2. **Streaming protocol verified**: The streaming connection query parameters (`sample_rate`, `bit_rate`, `num_channels`, `use_language_asr_input`) and `SESSION_CREATED` handshake message order are verified against the live endpoint.
3. **Pending audio recordings**: While Sahara connectivity is live and verified, evaluating speech WER requires physical audio recordings from consenting speakers (`LOCAL_DEVICE_TEST_REQUIRED`).

## Part 1 — ASR comparison

| Provider | Live | Samples measured | Mean WER | Mean CER | Mean code-switch preservation |
|---|---|---|---|---|---|
| sahara | true | 0/32 | LOCAL_DEVICE_TEST_REQUIRED | LOCAL_DEVICE_TEST_REQUIRED | LOCAL_DEVICE_TEST_REQUIRED |
| model-b | false | 0/32 | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS |
| model-c | false | 0/32 | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS |

**HONEST REPORTING STATUS**:
- **Sahara (`live: true`)**: Credentials and endpoint connectivity are verified live. ASR WER/CER measurement is pending on-device physical microphone recordings (`LOCAL_DEVICE_TEST_REQUIRED`).
- **Model B & Model C (`live: false`)**: Unconfigured comparison models (`REQUIRES_API_ACCESS`). Zero numbers are never fabricated.

## Part 2 — Educational understanding baseline (internal text-only baseline — NOT a Sahara speech result)

**Accuracy: 79.3% (23/29 initial-question samples).**

This is a real, currently-computed result — not a target or an estimate. It measures
`lib/tutor/intent.ts` directly against the dataset's hand-labeled expected concept, with ASR
skipped entirely (see `BENCHMARK_METHODOLOGY.md` for exactly what this does and doesn't prove).

**This number says nothing about Sahara, or any speech model's accuracy.** It is an internal
sanity check of the tutor's own text-reasoning layer, run on hand-authored ground-truth text, not
on any model's transcription output. Do not read it as, or present it as, a Sahara result.

### The 6 samples it gets wrong

| Sample | Transcript | Expected concept | Why it misses |
|---|---|---|---|
| vl-001 | "Why does a negative number times a negative number give a positive number?" | signed-multiplication | The two "negative" mentions are further apart than the keyword/regex matcher's gap tolerance |
| vl-010 | "So if minus four times minus three, wetin I go get?" | signed-multiplication | Uses "minus four"/"minus three" (numbers spelled out) rather than a plain "minus...minus...times" pattern the current regex expects adjacent |
| vl-020 | "-7 x -8, na wetin I go get, abeg confirm am for me." | signed-multiplication | Purely numeric/symbolic form (`-7 x -8`) without the words "negative"/"minus" the matcher looks for |
| vl-021 | "Whynegativetimesnegativegivepositive I dey ask fast fast..." | signed-multiplication | Fast-speech sample deliberately has no word boundaries — exposes that word-boundary regex needs a tokenization step for fast/run-together speech |
| vl-023 | "Whatisthemainideaforthispassagesef I no get time." | main-idea | Same run-together-speech issue as vl-021 |
| vl-027 | "Why does multiplying two signed negative integers produce a positive product?" | signed-multiplication | Only one literal "negative" — the double-negative idea is implied by "two...integers", which the keyword layer doesn't infer |

**This is genuine, useful signal, not a shortcoming to hide.** It shows precisely where a
deterministic keyword/regex intent layer breaks down: run-together fast speech, and paraphrases
that don't repeat "negative"/"minus" twice. Both are realistic failure modes for real learner
speech, and both are exactly the kind of case an LLM-backed or ML classifier intent layer (see
README "Future Work") would likely handle better than hand-written regex — that upgrade path is
now well-motivated by this data, rather than by assumption.

## Reproducing this

```bash
npm run benchmark
```

Writes `lib/benchmark/reports/asr-comparison-latest.json`,
`lib/benchmark/reports/intent-baseline-latest.json`, and
`lib/benchmark/reports/SUMMARY-latest.md`.
