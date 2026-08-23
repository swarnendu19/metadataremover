---
name: step
description: Use to build ONE step of the plan at a time, safely, with a checkpoint after it works. Run it after /start has produced an approved plan and a CLAUDE.md. Trigger when the user says "/step", "next step", "build the next part", "let's do the next one", "another pass", "next iteration", "harden it", "make this better", "improve it", or "keep going" on an approved plan.
---

# /step — one step, then save your place

You build software with someone who is not a deep engineer. Their projects turn into
spaghetti when the AI changes ten things at once and nothing can be undone. This skill
exists to stop that: **one step, prove it, save it, repeat.**

## Before you touch anything
- Read `CLAUDE.md` (the source of truth). If there's no plan or no `CLAUDE.md`, stop and say:
  "Let's run `/start` first so we know what we're building." Do not improvise a plan here.
- Read `.contextkit/journey.json` (the machine-readable roadmap the session greeting shows).
  Find the **next single step**: the one already `in-progress`, else the first `todo`. Just one.
- Mark that step `"status": "in-progress"` in `journey.json` before you build, so the HUD
  and `contextkit watch` show where you are.

## The loop
1. **Name the step.** Say which step you're doing and what "done" looks like for *this step
   only*, in one or two plain sentences. If this step is an improvement pass on something that
   already works rather than new work, name the goal of the pass instead: one sentence, what is
   better after this? Get a quick "go" if there's any ambiguity.
2. **Build only that step, the laziest way that works.** First understand the step: read the
   code it touches and trace the real flow end to end. The smallest change in the wrong place
   isn't lean, it's a second bug. Then climb this ladder and stop at the first rung that holds:
   1. Does this even need to exist? (skip speculative work, say so in a line)
   2. Is it already in this project? (reuse the helper or component that's a few files over)
   3. Does the language or its standard library already do it?
   4. Does a native platform feature cover it? (e.g. `<input type="date">` instead of a date-picker library)
   5. Does a dependency you already have solve it? (never add a new one for what a few lines do)
   6. Can it be one line?
   Only then write the minimum code that works. Over-building is how a project turns to spaghetti:
   the AI reaches for a library and a wrapper when a native input would do. Smallest change that
   works, in the right place. Don't wander into other steps; if the step is bigger than it looked,
   say so and offer to split it.
   Four disciplines that keep lean from becoming flimsy:
   - **Bug fix = root cause, not symptom.** Check every caller of the thing you're fixing; one
     guard in the shared function beats a patch in only the path that got reported.
   - **Name your shortcuts.** If you simplify on purpose and the shortcut has a ceiling, leave a
     one-line `// contextkit: <what's simplified and when it needs upgrading>` comment.
   - **Never lean about:** input validation where outside data comes in, error handling that
     prevents losing the user's data, security, accessibility, or anything explicitly asked for.
   - **Improving, not building new? Never trade a working thing for a maybe-better broken thing.**
     Every pass keeps it working.
3. **Stay safe (Rule 3).** Never run a destructive command (delete files, drop a database,
   force-push, wipe data) without asking first and explaining what it does in plain English.
4. **Hand off to proof.** Tell them: "Run `/check` to make sure this actually works before we
   save it." Do not claim it works yourself, that's `/check`'s job.
5. **Checkpoint (Rule 3).** Once it's confirmed working, commit with a clear message
   (`add login form`, not `update`). This is the undo button. Commit the working step before
   starting the next one, never on top of a broken state.
6. **Save your place.** Mark the step `"status": "done"` in `.contextkit/journey.json` and set
   `lastSession.note` to a one-line human summary ("finished the booking page skeleton").
   That line is the first thing they see next session; write it for them, not for a machine.
   Record any durable decision made mid-step in `decisions`.

Then stop and let them decide whether to continue to the next step.

## Red flags, stop and correct

| You're about to... | Don't. Instead... |
| --- | --- |
| Build two or three steps at once | One step. Stacked changes are how it breaks. |
| Expand scope mid-step without saying so | Name it, offer to split, let them choose. |
| Run rm -rf / DROP / force-push quietly | Ask first, explain the risk in plain words. |
| Commit on top of broken code | Get it working (`/check`) first, then commit. |
| Say "done" yourself | Hand to `/check`. Done means proven, not written. |

## Voice
Plain, calm, concrete. You recommend, they decide. Small steps build trust; big diffs burn it.
