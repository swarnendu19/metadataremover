---
name: lean
description: Use to cut AI code slop, the over-building, boilerplate, one-use abstractions, needless dependencies, and 50-lines-where-1-would-do that the AI writes by default. The code-side twin of /polish. Trigger when the user says "/lean", "this is over-built", "too much code", "simplify this", "did the AI over-engineer this", "trim it", or "yagni".
---

# /lean — cut the code slop

AI does not just make UIs *look* generated, it makes code *read* generated: it over-builds. It
wraps a native input in a component, writes an interface for one implementation, adds a
dependency for a one-liner, and ships fifty lines where one would do. That bloat is slop, the
same way a violet gradient is. This skill cuts it. **Deletion over addition.**

## Understand first, then cut
Read the code and trace what it actually does before removing anything. The smallest diff in the
wrong place is a second bug, not a fix. Lazy about the *solution*, never about *understanding*.
Improving working code follows `/step`'s never-trade rule: keep it working, pass by pass.

## What to cut (the reuse ladder, in reverse)
Find code that should have stopped at a higher rung:
- **Speculative work** that nothing uses yet → delete it (YAGNI).
- **A one-use abstraction** (an interface with one implementation, a factory for one product, a
  config for a value that never changes) → inline it.
- **Boilerplate or scaffolding "for later"** → later can scaffold for itself.
- **A dependency** doing what a few lines or a native feature would do (a date-picker lib instead
  of `<input type="date">`, a util lib for one function) → drop it.
- **Fifty lines that could be one** → make it one. The standard library probably already does it.
- **Clever where boring would do** → boring. Clever is what someone decodes at 3am.

## How to run it
1. Look at the changed code (the diff) or the file the user points at.
2. List each over-build with the leaner version beside it: "this 40-line cache class -> one line
   of `lru_cache`."
3. Cut by the root cause, not the symptom: one guard in the shared function beats a guard in every caller.
4. Prove it still works (`/check`). Less code that's broken is not lean, it's broken.

## Never simplify away (the line you don't cross)
Input validation at trust boundaries, error handling that prevents data loss, security,
accessibility basics, or anything the user explicitly asked for. If they want the full version,
build it, no re-arguing.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Cut code before understanding the flow | Read it end to end first. Then cut. |
| Remove a validation/error/security check to shrink the diff | Never. Those stay. |
| Add an abstraction "for when we need it" | YAGNI. Add it when you actually need it. |
| Pull in a dependency for a few lines | Use the native feature or write the few lines. |
| Call it lean without re-running it | `/check` it still works. |

## Voice
Surgical. Code first, then at most a line or two on what you cut and when to add it back. If the
explanation is longer than the code, the explanation is the slop. Shortest thing that actually
works, once you understand the problem.
