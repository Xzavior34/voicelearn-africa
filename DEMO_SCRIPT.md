# Demo recording script

> **UPDATED NOTICE:** since this script was written, a real four-model benchmark run has completed (Sahara, Whisper Tiny, Whisper Base, Wav2Vec2 Base 960h — all `VERIFIED`), including a genuine physical code-switched recording. The "Model B/C blocked" line below is stale — see `FINAL_SUBMISSION_EVIDENCE.md` for the current numbers if you want to cite one on camera. The old WER/CER figures (3.6%/0.8%, or elsewhere 7.1%/6.3%) also predate that run — do not cite them.

Target length: 2:00–2:30. Every line below reflects what the current build actually does — the
sequence is chosen specifically because it's the one that used to fail (stale topic/follow-up
state) and is now fixed and regression-tested. Nothing here is aspirational; where evidence is
partial (physical device testing beyond what's already been done), the script says so on camera rather than skipping
past it.

**Before recording**: check whether `SAHARA_API_KEY` is configured in the environment you're
demoing from (`/api/speech/health` or the note on `/learn` will tell you). If it isn't, use the
"type instead" fallback and say so on camera — that's the honest way to demo the reasoning loop
without a live mic. If it is configured, use the real microphone.

## 0:00–0:20 — The problem

"African learners naturally mix languages while they're learning — English and Nigerian Pidgin in
the same sentence, sometimes the same question. Most voice systems treat that as noise to correct.
VoiceLearn treats it as normal speech."

## 0:20–0:45 — Standard question, correct understanding

Ask (voice or typed):

> "Why negative times negative dey give positive?"

Show: topic identified as *Multiplication of signed numbers*, the explanation, and the follow-up
question ("If -4 x -3 = ?, what do you think the answer is?").

## 0:45–1:05 — Code-switched educational reasoning

Ask:

> "Why water fit evaporate even when e never reach 100 degrees?"

Show: the topic switches cleanly to *Evaporation* — say on camera that this is a genuinely new
topic being recognized from Pidgin-inflected phrasing, not a hardcoded keyword match for this
exact sentence.

## 1:05–1:25 — Clean topic switch (the bug this build fixes)

Ask:

> "What is evaporation?"

Show: the response is about evaporation, not a repeat of the multiplication explanation. This is
the exact class of bug (stale topic/follow-up state carrying over into an unrelated new question)
that this build's turn-relation classifier exists to prevent — say so on camera; it's the most
technically meaningful thing to point at.

## 1:25–1:45 — Curriculum-independent new-topic handling

Ask:

> "Why do clouds look white?"

Show: the app recognizes this as a new topic and honestly says it isn't in the current curriculum,
rather than answering with leftover evaporation content. Say on camera: "the classifier doesn't
need to know what clouds are to know this is a new question — it just needs to not pretend the old
answer still applies."

## 1:45–2:10 — Answer assessment and adaptation

Ask the tutor a question that leads to a follow-up (e.g. re-ask the multiplication question), then
answer it once correctly ("Twelve.") and once incorrectly ("Negative twelve.") on a fresh attempt.
Show: correct answer → positive feedback + harder next question; incorrect answer → misconception
feedback + difficulty stepping back down, not the same question repeated verbatim.

## 2:10–2:30 — Evidence, honestly labeled

Cut to `/benchmark`. Show, in order:

1. The **text-level intent baseline** (78.8%, 26/33) — say plainly this is reasoning-layer
   accuracy on hand-typed transcripts, not a speech accuracy number.
2. The **four measured models** (Sahara, Whisper Tiny, Whisper Base, Wav2Vec2 Base 960h — see
   `FINAL_SUBMISSION_EVIDENCE.md` for exact WER/CER) — say plainly this is on 2 physical
   recordings, one of them genuinely code-switched, not a dataset-wide claim.

Close with:

> "The reasoning, topic-tracking, and assessment loop is real and tested today — 109 automated
> tests, including the exact scenario that used to break. Live multi-model speech benchmarking is
> the next step once those credentials are available."
