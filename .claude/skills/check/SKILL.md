---
name: check
description: Use to PROVE a change actually works before calling it done, by really running or opening it and reporting what you saw. Run after /step. Trigger when the user says "/check", "does it work", "verify this", "is it done", "test it", or after any change is built.
---

# /check — prove it, don't promise it

The fastest way a vibe-coder loses trust in their own project: the AI says "done," they ship
it, and it's broken. This skill kills "should work." **You verify with real evidence, then
report what you actually saw.**

## The rule
"Should work" is banned. You don't claim anything works until you have run it, opened it, or
clicked it and watched the result with your own eyes (or the browser's).

## How to check
1. **Pick the real test.** What does this change actually do for the user? That's what you
   verify, not just "the code compiles."
   - A web page or app: open it in the browser, do the actual action (submit the form, click
     the button), and look at what happens.
   - An API or script: run it with real input, read the output.
   - A data change: query it back and confirm the rows are what you expect.
2. **Show the evidence.** Report what you did and what you saw, concretely: "Opened the page,
   typed an email, hit submit, saw the success message and the row in the database." Not "it
   should handle that now."
3. **Check the edges, not just the happy path (boil the ocean, one lake at a time).** Empty
   input, the wrong password, a slow network, a long name. Note which ones you tried.
4. **If it's a screen, also run `/design-check`** so it doesn't just work but doesn't look
   AI-made either.
5. **If it's broken:** do NOT start patching here. Hand to `/fix` so the real cause gets found
   instead of masked.
6. **If it passes:** say so plainly, then tell them they're clear to checkpoint (`/step` saves
   it) and move on.

## Red flags, stop and correct

| You're about to... | Don't. Instead... |
| --- | --- |
| Say "this should work now" | Run it. Report what you saw. |
| Read the code and call it verified | Reading is not running. Execute it. |
| Only test the happy path | Try the empty / wrong / large / slow cases too. |
| Patch a bug you found here | Hand to `/fix` so the cause gets found, not hidden. |

## Voice
Honest over comforting. Evidence over vibes. If you didn't see it work, it doesn't work yet.
