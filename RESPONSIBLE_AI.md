# VoiceLearn Africa — Responsible AI & Safety Framework

VoiceLearn Africa is built on a fundamental ethical principle: **Learning should adapt to the learner, not force the learner to change how they speak.** 

Because voice input in educational environments involves young learners, speech biometrics, and cultural linguistic nuances, we enforce a strict Responsible AI framework across seven core dimensions.

---

## 1. Informed Consent & Data Minimization
- **Consented Benchmark Samples:** All physical audio benchmark recordings are sourced exclusively from consenting adult contributors who provided explicit permission for educational and evaluation use.
- **Zero Learner Profiling:** VoiceLearn does not construct biometric voice profiles, acoustic fingerprints, or behavioral dossiers on learners.
- **In-Memory Audio Processing:** Audio passed to `/api/speech` is processed ephemerally in server memory during transcription and is never written to permanent disk storage, databases, or third-party ad networks.
- **Zero PII Collection:** The system does not request or store student names, ages, phone numbers, email addresses, school IDs, or location data.

---

## 2. Child Safeguarding & Educational Scope
- **Age-Appropriate Curriculum:** Content is bounded strictly to standard secondary-school subjects (Mathematics, Science, Biology, Physics, Chemistry, English Language).
- **No Open-Ended Unsupervised Generation:** The tutoring agent operates within a deterministic curriculum ladder (`lib/tutor/curriculum.ts`), eliminating open-ended hallucinations, inappropriate topic drift, or toxic outputs.
- **Constructive, Encouraging Tone:** Tutoring feedback focuses on diagnosing conceptual misconceptions rather than penalizing or criticizing student speech.

---

## 3. Teacher Oversight & Non-Punitive Design
- **Companion, Not Replacement:** VoiceLearn is designed as a low-stakes revision and homework companion used alongside classroom teachers, never in place of human educators.
- **No Consequential High-Stakes Decisions:** VoiceLearn is never used for formal grading, school admissions, disciplinary action, or academic tracking.
- **Difficulty Adaptation as Support:** Adaptive progression between Levels 1–5 solely selects appropriate practice questions to support understanding, never creating permanent academic records.

---

## 4. Linguistic Respect & Code-Switching Fairness
- **Dignity of Multilingual Thought:** Nigerian Pidgin and African code-switching are treated as natural, sophisticated modes of communication, not "broken English" or errors to be corrected.
- **Multi-Dialect & Acoustic Evaluation:** The benchmark explicitly measures performance across Standard English, Nigerian Pidgin, intra-sentential English-Pidgin switching, and English-Yoruba code-switching in noisy, fast, and smartphone acoustic conditions.
- **Transparent Language Attribution:** The system uses explicit language marker tracking (`lib/benchmark/metrics.ts`) to evaluate code-switch preservation without claiming unverified linguistic perfection.

---

## 5. Explicit Failure Handling & Safe Recovery
When speech recognition is unclear or audio is degraded, VoiceLearn prioritizes transparency over false confidence:

| Condition | System Behavior |
|---|---|
| **Ambiguous / Muffled Speech** | *"I couldn't hear that clearly. Could you say that again, or type your question below?"* |
| **Out-of-Curriculum Question** | Clearly identifies the boundaries of its secondary subjects rather than fabricating an answer. |
| **API / Provider Outage** | Fails loudly and gracefully, preserving session state and activating the text fallback input. |
| **Microphone Permission Blocked** | Instantly displays clear instructions while keeping full typed-text tutoring operational. |

---

## 6. Security, Secrets & Infrastructure
- **Server-Side Credentials Only:** All provider keys (`SAHARA_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`) are loaded strictly on the server and are never exposed via `NEXT_PUBLIC_*` or sent to the browser.
- **Sanitized Logging:** Authorization headers and raw audio payloads are never written to server logs.
- **Type-Safe Validation:** All network payloads are validated using Zod schemas (`lib/speech/types.ts`, `lib/tutor/schema.ts`).

---

## 7. Auditability & Continuous Monitoring
- **Local Reproducibility:** Every benchmark result, WER computation, and downstream accuracy score is reproducible via `npm test` and `npm run benchmark:all`.
- **Honest Evidence Labelling:** All claims are tagged with empirical statuses (`LIVE VERIFIED`, `AWAITING AUDIO`, `BLOCKED`) to prevent exaggeration.
