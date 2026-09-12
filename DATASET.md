# Dataset

`lib/benchmark/dataset/dataset.ts` — 32 samples.

## Provenance

**All 32 samples are hand-authored by the engineering team for this submission.** They are
**text-only** — no audio recordings exist for any of them, human or synthetic. No consented
learner recordings, no permitted third-party dataset, and no synthetic TTS audio has been
produced yet. This is stated plainly because the competition brief explicitly requires
disclosing exactly this.

This is sufficient to:
- unit-test the metrics functions against known reference/hypothesis text pairs
- compute the ground-truth-transcript intent/topic-extraction baseline (`BENCHMARK_RESULTS.md`
  Part 2)

It is **not** sufficient to benchmark real ASR accuracy for Sahara or any comparison model — that
requires real audio (see README "Future Work").

## Composition

| Category | Count | Notes |
|---|---|---|
| standard_english | 8 | Includes both questions and 2 follow-up answers |
| english_pidgin | 8 | Nigerian Pidgin markers throughout |
| educational_code_switching | 7 | Mid-sentence English/Pidgin switching, subject-heavy |
| fast_speech | 3 | Run-together text as a stand-in for fast speech; NOT a real speech-rate signal — no audio exists to actually be fast. Flagged `LOCAL DEVICE TEST REQUIRED` for a genuine version |
| noisy_environment | 3 | `[background: ...]` bracket annotations are descriptive placeholders, not real noise-mixed audio. Same caveat as fast_speech |
| subject_vocabulary | 3 | Formal academic phrasing, same 3 subjects |

## Schema

See `lib/benchmark/dataset/types.ts` for the full zod schema. Every sample has:

- `id` — e.g. `vl-001`
- `referenceTranscript` — the authored utterance
- `languagePair` — `en` / `en-pcm` / `en-yo`
- `domain` — always `education`
- `subject` — `mathematics` / `science` / `english` / `general`
- `category` — one of the six above
- `intent` — the ground-truth learning-need label
- `expectedConceptId` — which curriculum concept this SHOULD map to, or `null` if intentionally
  out of the current curriculum's scope (used to check the system doesn't force a false match)
- `noiseCondition` / `deviceType` — **declared, not measured** metadata; no device or microphone
  produced this text
- `role` — `initial_question` (scored by the intent baseline) or `follow_up_answer` (a bare
  answer like "Twelve.", used instead by the assessment module's tests) — see
  `BENCHMARK_METHODOLOGY.md` for why these are scored separately

## Subjects covered

Mathematics (signed multiplication), science (photosynthesis/chlorophyll), and English (main
idea identification) — matching the three concepts in `lib/tutor/curriculum.ts`. Several samples
are deliberately out-of-curriculum (e.g. "What is the capital of Nigeria?") to verify the system
correctly reports "not in current curriculum" instead of forcing a false match.

## Consent & children

No recordings of any real learner — child or adult — exist in this dataset. If real audio is
collected in the future (see README "Future Work"), it must follow the consent and child-safety
practices in `RESPONSIBLE_AI.md` before being added here.

## Real audio dataset protocol & schema extension (2026-09-12)

### Schema extension
The benchmark dataset schema in `lib/benchmark/dataset/types.ts` has been extended to support physical audio recordings alongside the existing text samples:
- `audioFilePath` — path to the physical audio file (WAV/WebM) on disk
- `speakerCountry` — country of speaker origin (e.g., "Nigeria")
- `speakerAccent` — regional accent and dialect (e.g., "Nigerian English", "Lagos Pidgin", "Yoruba-influenced English")
- `deviceUsed` — physical recording device used (e.g., "Smartphone microphone")
- `consentObtained` — verification of documented adult informed consent

### Target distribution (15–20 samples)
In accordance with the competition guidelines, physical recordings are targeted to a curated subset of 15–20 adult samples:
- **5 Standard English**: `vl-001`, `vl-002`, `vl-003`, `vl-004`, `vl-027`
- **5 English ↔ Nigerian Pidgin**: `vl-006`, `vl-007`, `vl-009`, `vl-010`, `vl-012`
- **5 English ↔ Yoruba**: `vl-014`, `vl-015`, `vl-018`, `vl-020`, `vl-028` (Sahara `yo` input supported)
- **Natural speed & noise variation**: fast utterances (`vl-021`, `vl-022`) and mild ambient background noise (`vl-024`, `vl-025`)

### Sourcing & Ethics
- **Adult consent**: Recordings must be obtained from consenting adults (18+) with documented informed consent for AI benchmark evaluation.
- **Child safeguarding**: In strict compliance with `RESPONSIBLE_AI.md`, children's voices are never recorded.
- **Verification status**: Flagged `LOCAL_DEVICE_TEST_REQUIRED` until physical microphone recordings from consenting speakers are captured on a physical mobile device.
