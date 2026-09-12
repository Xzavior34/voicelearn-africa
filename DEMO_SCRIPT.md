# Demo script

Target length: 60–90 seconds. Every line below reflects what the current build actually does —
nothing here is aspirational.

## 0–10s — The problem

"African learners naturally mix languages when they ask questions — English and Nigerian Pidgin
in the same sentence. Most speech systems lose meaning exactly there."

## 10–25s — Learner speaks, VoiceLearn understands

On `/learn`, tap the mic (or use the "type instead" fallback if Sahara credentials aren't
configured in your environment — see note below) and ask:

> "Why negative times negative go give positive?"

Show the "I understood" card: topic = *Multiplication of signed numbers*, learning need =
*conceptual question*.

**Honesty note for the recording:** if Sahara isn't configured, say so on camera — "Sahara isn't
connected in this build, so I'm typing what I just said" — and use the typed-text field. This is
the accurate, non-fabricated way to demo the loop right now.

## 25–45s — Teach

Show the tutor's explanation rendering: the repeated-direction-reversal explanation, followed by
the follow-up question: "If -4 x -3 = ?, what do you think the answer is?"

## 45–60s — Learner answers by voice

Speak (or type): "Twelve."

Show the "Correct." feedback and the harder follow-up question that appears next
("-6 x -2").

## 60–75s — Adapt

Answer incorrectly on purpose ("Negative twelve") to show the misconception-aware feedback and
the difficulty dropping back down — demonstrating that the next question genuinely depends on the
previous answer, not a fixed script.

## 75–90s — Benchmark

Cut to `/benchmark`. Show the honest ASR table (`requires_api_access` for all three providers —
say plainly that Sahara credentials aren't available in this environment) and the real,
currently-measured educational-understanding baseline (~79%).

Close with:

> "VoiceLearn turns African code-switched speech into an adaptive learning interaction — the
> reasoning and assessment loop is real and tested today; live Sahara integration is the next
> step once credentials are available."
