---
name: design-intake
description: Use BEFORE designing anything, to interview the user and write a DESIGN.md (the design source of truth) so the app has a real aesthetic instead of a default AI look. Trigger when the user says "/design-intake", "set up the design", "what should it look like", "design system", or is about to build UI without a DESIGN.md.
---

# /design-intake — decide the look on purpose

The reason vibe-coded apps look AI-made is that nobody decided how they should look, so the
AI reached for its defaults (Inter, a violet gradient, a grid of cards). This skill decides it
on purpose and writes it down, so every screen after this has a spine.

## The rule: interview, don't confirm
Ask **2-3 real questions per round** and wait for real answers before drafting anything. Do
not generate a design from the original prompt alone, that just produces the default look.
This is the design twin of `/start`: questions first.

## Round 1 — what is this
1. **Register:** is this a **brand** surface (a landing/marketing page, where the design *is*
   the pitch) or a **product** surface (an app/dashboard, where the design gets out of the
   way)? They have opposite goals; you must know which.
2. **Who uses it and to do what?** The actual person and the actual job.
3. **What should they feel / what's the outcome?**

## Round 2 — the taste
4. **Three words** for the personality (e.g. "calm, sharp, editorial"). Push past generic.
5. **Named references and anti-references.** Two or three real sites/products it should feel
   like, and at least one it must NOT feel like. "Not generic SaaS" is the most useful answer
   you can get, it's how you dodge the default.
6. **Accessibility / constraints** (light only? dark? big text? brand colors you must use?).

## Round 3 — the tokens (offer a recommendation for each so they can just pick)
7. **Color strategy + anchor hue:** restrained (neutrals + one accent) / committed (one color
   carries it) / full palette / drenched. Pick the strategy, then the hue.
8. **Type direction:** a font with a voice, paired on a contrast axis. Reject the reflex picks
   (Inter/Geist/Roboto). Recommend 2-3 real options from a catalog.
9. **Motion energy:** still / subtle / lively. (Default to subtle.)

## Then write DESIGN.md
Use the template in this kit. Fill in the tokens, the **Creative North Star** (a one-line
metaphor for the feel), the **anti-references** (verbatim, so the AI never drifts back to
them), and the **Named Rules** (e.g. "Accent is at most 10% of any screen").

- **If code already exists (scan mode):** read the current colors/fonts/spacing first, show
  the user what's actually there, then confirm the descriptive language before writing.
- **If it's greenfield (seed mode):** scaffold sensible defaults and mark them `<!-- SEED -->`
  so they know what's a guess to revisit.

Never overwrite an existing DESIGN.md without asking.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Design from the prompt without asking | Interview first. That's the whole point. |
| Accept "make it modern/clean/nice" | Push for named references and anti-references. |
| Reach for Inter + a violet gradient | That's the default look. Decide on purpose. |
| Overwrite their DESIGN.md silently | Ask. It's their source of truth. |

## Voice
Curious and concrete. You recommend, they decide. The deliverable is a DESIGN.md they could
hand to anyone and get a consistent, non-generic result.
