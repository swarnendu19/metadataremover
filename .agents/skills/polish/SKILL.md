---
name: polish
description: Use to FIX the things that make a screen look AI-made, working from DESIGN.md and the anti-slop catalog, fixing by root cause not by decoration. Trigger when the user says "/polish", "make it look better", "fix the design", "make it not look AI-made", or after /design-check finds issues.
---

# /polish — fix the slop, by the root

`/design-check` found what's wrong. This skill fixes it, the right way. The trap is decorating
a screen that's actually just missing a design system. **Fix causes, not symptoms.**

## Before you touch a pixel
- **Read `DESIGN.md`.** It's the source of truth for tokens, fonts, and rules. If there isn't
  one, stop and run `/design-intake` first, polishing without a system just produces a
  different flavor of default.
- **Don't polish unfinished work.** If the feature isn't actually working yet, finish it
  (`/check`) before making it pretty.

## How to polish
1. **Classify each issue** (from `/design-check`) as one of:
   - **Missing token** (no defined color/size for this) → add it to DESIGN.md, then use it.
   - **One-off deviation** (ignored an existing token) → snap it back to the token.
   - **Conceptual misalignment** (fighting the intended aesthetic) → rework it toward the
     North Star, don't patch it.
   Fixing the root cause is what stops the slop from coming back next screen.
2. **Run the detector, fix what it finds.** `node bin/detect-slop.mjs <path>` lists every
   measurable tell with file:line and the fix. Work the list: swap the reflex font, kill the
   gradient text, replace the side-stripe border, drop the violet gradient, fix contrast
   (>=4.5:1, OKLCH), put spacing on a 4pt scale, cut buzzwords and em-dashes. Then handle the
   catalog tells a script can't see: card-grid monotony, imagery, hierarchy (`reference/anti-slop-tells.md`).
3. **Check every interactive element has all its states:** default, hover, focus (visible!),
   active, disabled, loading, error. Missing states are a top slop tell and an accessibility
   fail.
4. **Stay restrained.** Don't add animation, gradients, or glow that nobody asked for. One
   accent, used rarely. `prefers-reduced-motion` respected. The fix for "looks AI-made" is
   usually *less*, not more.
5. **Prove it.** Re-run `node bin/detect-slop.mjs <path>` until it reports **0 P1**, then
   re-screenshot and run `/design-check`. The score should go up and the tells should be gone.
   Don't claim it's polished until the re-check confirms it.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Add decoration to a screen with no system | Run `/design-intake`, then polish to the tokens. |
| Patch one screen and leave the token broken | Fix the token so every screen benefits. |
| Add motion/gradient/glow for flair | Restraint. Less is the fix. |
| Polish a feature that doesn't work yet | `/check` it works first. |
| Say "polished" without re-checking | Re-run `/design-check` and show the new score. |

## Voice
Surgical and restrained. Every change traces to a tell or a token. The goal is a screen you
can't tell was AI-assisted, reached by subtraction more than addition.
