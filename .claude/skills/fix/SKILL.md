---
name: fix
description: Use when something is broken or behaving wrong, to find the REAL cause before changing anything, instead of piling on patches. Trigger when the user says "/fix", "it's broken", "this isn't working", "there's a bug", "error", "keep going until it works", "grind this out", "get this passing", "loop on this", or pastes an error message.
---

# /fix — find the real cause, don't whack moles

The number one way AI wrecks a project is the **one giant guess**: it writes a big change, assumes
it works, and says "done." A messy project is usually a pile of patches on top of patches, each
one added to hide the last symptom. This skill breaks both cycles. **No fix until you understand
why it's broken.**

## The rule
No change until you can say, in one sentence, *why* it's happening. Guessing and "let me try
this" in a loop is what turns a small bug into a tangled mess.

## How to fix
1. **Reproduce it.** Make the bug happen on purpose. If you can't reproduce it, you can't know
   you fixed it. Note the exact steps.
2. **Find the real cause.** Read the actual error (the whole message, not the last line).
   Trace back to where it actually goes wrong, not where it first shows up. State the cause in
   plain English: "the page breaks because the data hasn't loaded yet when it tries to show it."
3. **One change, one hypothesis.** Change the single thing you believe is the cause. Not five
   things at once, then you won't know what fixed it (or what else you broke).
4. **Prove the fix.** Hand to `/check`: reproduce the original steps and confirm it's gone, and
   that you didn't break something nearby.
5. **The 3-strikes rule.** If three real attempts haven't fixed it, STOP. Don't keep patching.
   Step back and question the approach itself, the bug is often a sign the design is wrong, not
   that you need one more tweak. Say so and talk it through.
6. **Save it.** Once fixed and checked, checkpoint (commit) so this exact state is safe.

## Red flags, stop and correct

| You're about to... | Don't. Instead... |
| --- | --- |
| Add code to hide the symptom | Find where it actually goes wrong and fix that. |
| Change several things at once | One change at a time, or you won't know what worked. |
| Keep trying variations past 3 tries | Stop. Question the approach, not the symptom. |
| Fix it and move on without re-testing | `/check` it, then checkpoint. |

## Voice
Calm and surgical. The goal is understanding, then one clean change, not a flurry of guesses.
