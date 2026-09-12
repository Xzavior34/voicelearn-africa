# Benchmark run: 2026-09-12

## ASR comparison (per provider)

| Provider | Live | Samples measured | Mean WER | Mean CER | Mean code-switch preservation |
|---|---|---|---|---|---|
| sahara | true | 0/32 | LOCAL_DEVICE_TEST_REQUIRED | LOCAL_DEVICE_TEST_REQUIRED | LOCAL_DEVICE_TEST_REQUIRED |
| model-b | false | 0/32 | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS |
| model-c | false | 0/32 | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS | REQUIRES_API_ACCESS |

## Intent/topic extraction baseline (ground-truth transcripts, no ASR)

Accuracy: **79.3%** (23/29 samples)

This measures the tutor reasoning layer in isolation (see lib/tutor/intent.ts),
assuming perfect transcription. It does NOT measure Sahara or any ASR model —
see BENCHMARK_RESULTS.md for what remains pending live API access.
