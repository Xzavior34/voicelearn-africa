# Android Test Checklist

For physical verification on Android Chrome. This checklist exists because none of the tests
below can be run from this development environment — there is no real browser, microphone, or
Android device available here. Everything in this file is **NOT YET VERIFIED** until you run it.

For each test: note PASS / FAIL / PARTIAL, and what actually happened if it wasn't a clean PASS.

---

## 0. Homepage

Open the deployed site's homepage (not `/learn` directly).

**Expected:**
- Loads without layout shift or horizontal scrolling.
- Headline and "Start learning" / "See how it works" buttons are visible without excessive
  scrolling on a phone screen.
- No overlapping text, no cut-off content.

---

## 0b. Navigation

Use the navbar to move between Home, Learn, Benchmark ("Research & evaluation"), and About.

**Expected:** every link works, the current page is reachable and renders, and the back button
returns you to the previous page correctly.

---

## A. First-time microphone permission

1. Open the deployed site in Android Chrome (not a webview/in-app browser).
2. Go to `/learn` and tap the mic button.

**Expected:**
- Chrome's native microphone permission prompt appears.
- If you deny it, the app does not crash — it shows a readable message and a way to type your
  question instead.
- If you allow it, recording starts (visual recording indicator appears).

---

## B. Standard English

Say: **"Why do plants need sunlight for photosynthesis?"**

**Expected:** correct transcription → topic identified as photosynthesis/chlorophyll → an
explanation → a relevant follow-up question.

---

## C. Topic switch

Immediately after B, say: **"What is evaporation?"**

**Expected:** the topic changes to evaporation. The explanation must be about evaporation, **not**
a repeat of the photosynthesis/chlorophyll explanation from step B. This is the single most
important thing to check — it's the exact bug class this build was hardened against.

---

## D. Unknown topic

Say: **"Why do clouds look white?"**

**Expected:** the app recognizes this as a new topic and honestly says it's not in the current
curriculum (or gives a "not sure" response) — it must **not** answer with leftover evaporation
content from step C.

---

## E. Nigerian Pidgin + English

Say: **"Why water fit evaporate even when e never reach 100 degrees?"**

**Expected:** the mixed English/Pidgin phrasing is understood as an evaporation question — not
rejected, not garbled into something else.

---

## F. Related follow-up

Say: **"So what's the difference between evaporation and boiling?"**

**Expected:** stays on the evaporation topic (does not reset to "new topic" or lose context) and
gives a comparison-style answer.

---

## G. Correct learner answer

When the tutor asks you a follow-up question, answer it correctly.

**Expected:** positive/correct feedback, and the next question is different (harder), not a
repeat.

---

## H. Incorrect learner answer

On a fresh question, answer incorrectly on purpose.

**Expected:** the app explains what's wrong (not just "incorrect"), doesn't shame you, and either
simplifies or gives another example — not the exact same explanation verbatim, and not an
infinite loop of the same question.

---

## I. Rapid requests

Ask a question, and before the response finishes, immediately ask a second, different question
(e.g. tap a starter prompt, then immediately tap another one before the first responds).

**Expected:** the second question's answer is what's shown — the first (now-stale) response never
appears after the second one, and the app doesn't show a mixed-up or duplicated response.

---

## J. Retry after failure

Turn off Wi-Fi/mobile data right as you submit a question, then turn it back on and try again.

**Expected:** a clear "network trouble" message (not a frozen spinner, not a raw error), and
asking again afterward works normally.

---

## K. Refresh

Mid-conversation, refresh the page.

**Expected:** the app reloads cleanly (no blank/broken page), starts a fresh conversation (this is
expected — session state is not currently persisted across a refresh), and the microphone still
works without having to re-grant permission.

---

## L. Long conversation

Have at least 8–10 back-and-forth turns, mixing topics, answers, and at least one topic switch.

**Expected:** no duplicated messages, no response attached to the wrong question, no visible
slowdown by turn 8–10.

---

## M. Landscape orientation

Rotate the phone to landscape mid-conversation.

**Expected:** layout reflows without cutting off the mic button or the conversation; no
horizontal overflow; recording still works.

---

## N. On-screen keyboard

Tap "Or type instead" and type a question.

**Expected:** the keyboard doesn't cover the input field or the submit button; the page doesn't
jump around while the keyboard opens/closes.

---

## O. Reduced motion / accessibility (where available on your device)

In Android Accessibility settings, enable "Remove animations" (or your device's equivalent), then
reload the site and repeat steps B–D.

**Expected:** the app still works fully — animations (listening pulse, waveform, message
fade-in) are minimized or removed, but nothing is missing or broken as a result.

---

## What to capture as evidence

- Screen recording (preferred) or screenshots of steps **C** and **D** specifically — these are
  the two that prove the core fix actually works on a real device, not just in automated tests.
- A screenshot of the microphone permission prompt (step A).
- A screenshot or note of what happened in step **I** (the rapid-request race condition).
- Note the device model, Android version, and Chrome version.
- Note anything that didn't match "Expected" above, even if it seems minor.

## What to report back

For each of 0, 0b, A–O: PASS, FAIL, or PARTIAL, plus a one-line note for anything not a clean
PASS. That's the input needed to correctly fill in the "Browser/Mobile" status in the submission
report — I will not upgrade that status based on anything other than your actual results.
