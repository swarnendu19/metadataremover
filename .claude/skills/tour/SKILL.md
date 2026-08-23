---
name: tour
description: The first-run setup wizard, played as a live four-act "opening night" for the kit. It proves the engine is alive (staggered doctor cascade), equips the agent with the essential opt-in tools, confirms the seed from install, runs one real live round of the clarity lock so the user watches it fire instead of hearing about it, then reveals the cockpit (statusline + optional watch). Trigger when the user says "/tour", "getting started", "set me up", "how do I start", or "onboard me".
---

# /tour — opening night (four acts, live)

## Codex mode

If `.codex/contextkit/` exists, this is a Codex installation. Run:

    node .codex/contextkit/bin/codex-doctor.mjs

Use `~/.codex/contextkit/bin/codex-doctor.mjs` for a global install. Stop and fix any red result
with `contextkit doctor --fix` before continuing.

Then give the same short onboarding, but make these Codex substitutions:

- Invoke skills as `$tour`, `$start`, and `$step`, or ask in plain language.
- Explain that `.agents/skills` supplies workflows, `.codex/hooks.json` supplies lifecycle checks,
  and `AGENTS.md` supplies durable project rules.
- Offer `contextkit watch` as the live HUD. Codex has no contextkit statusline.
- Run the vague-prompt demo, but describe it accurately: Codex injects the ask-first guidance and
  its current hook API warns before a write. Its PreToolUse hook cannot deny a write dynamically,
  so the written rule and the planning flow remain the hard guardrail.

Do not claim that Codex's clarity hook physically locks edits. Once the user sees the navigator,
the questions, and the health check, hand off with `$start`.

This is the user's first taste of the tool, so **be** the tool: ask, don't lecture, and **ask in
multiple choice** so they just pick. Four acts, back to back: prove the engine's alive, equip the
agent, confirm the project seed, then run one real live round of the clarity lock so they watch it
work instead of hearing about it - then show them the cockpit. By the end they're set up AND
they've watched it protect them once, live. The asking IS the demo. No feature tour, no listing
skills.

## One line of welcome
"I'll get you set up in a couple of minutes, and you'll see the kit actually work while I do it -
not a slide, the real thing firing live. The way I work: I ask, you pick from options, no
blank-page questions. Let's start by checking the engine's actually alive."

## Act 1 — Arm the system (prove the engine is alive, live)
This is the opening beat: the checks light up one at a time, like a panel powering on. Run the
self-check with the cascade flag and show the user the result:

    node .claude/contextkit/bin/doctor.mjs --cascade

(If that file doesn't exist, this is a global install: run `node ~/.claude/contextkit/bin/doctor.mjs
--cascade` instead.) If `--cascade` itself errors for any reason, fall back immediately to the
plain call - same checks, same exit code, it just won't stagger the lines:

    node <same path> doctor.mjs   (drop --cascade)

- **All green:** say so in one line ("lights are all green - the engine's alive") and move on.
- **Any red:** stop the tour. Tell the user plainly which light is red and what it means,
  then offer the one-command fix: `node <same path> --fix` (with a global engine, this is also
  what switches the ask-first rule on for THIS project - that's expected on global installs,
  not a problem). Re-run the check, show it green, then continue.

Never continue the tour with a red check: a user who tours a dead engine thinks they're
protected when they aren't - that's the worst outcome this kit can produce.

## Equip the agent (opt-in, before Act 2)
With the engine confirmed alive, spend the next minute equipping it before the live demo. A fresh
Claude Code (or Codex, or Antigravity) can't search the web, read a library's current docs, or
look at an image. These few tools fix that, and they're the ones that pay off immediately. Offer
them as ONE multiple-choice pick (they choose which, every one optional), and say in a single plain
line **why each earns its place**. That one line is how you convince them, so make it concrete:

- **exa** — searches the live web and pulls a library's current docs, so the agent stops guessing
  from months-old memory. (needs a free EXA_API_KEY)
- **context7** — drops a library's newest official docs straight into the agent, so the code matches
  today's API, not last year's. (no key)
- **gemini** — lets the agent look at screenshots and designs and tell you whether they actually
  look right, not just whether the code runs. (needs a Gemini key)
- **crawl4ai** — point it at a specific site or docs page and it reads the whole thing into clean
  text the agent can use. (no key)

Ask it as a pick: **"Which should I set up? Pick any, or all four. Not sure? Take all four, they're
the ones most people end up using daily."**

Then, for each one they choose:
- **No key needed (context7, crawl4ai):** set it up now with `/connect-mcp`'s method and move on.
- **Needs a key (exa, gemini):** if they have the key, wire it in. If they don't, give them the
  one-line path to a free key ("grab a free EXA key at their site, takes a minute"), or offer:
  **"set it up now / I'll get the key and you add it later / skip it"**. NEVER block onboarding on a
  key. Skipping is always a fine answer.
- After setting any up, prove ONE works (ask the agent to use it once and show the result). Don't
  assume it connected.

Keep it to these four. Do not upsell a pile of servers. Playwright and GitHub exist in `/connect-mcp`
for when they actually need them later.

## Act 2 — Confirm the seed, don't re-ask it
Installing this kit already asked four questions into `.contextkit/seed.json`: which agent they
drive, how much code they read, their goal, and a one-line `project`. That interview is done.
Don't repeat it here - just confirm it landed.

Read `.contextkit/seed.json` and reflect it back in ONE line: "You said we're building [project]
and you steer while the AI writes - still true?" (phrase that clause to match `level`: `vibe`
keeps "you steer while the AI writes"; `some`/`dev` drop it or adapt it.)

- **They confirm:** nothing more to ask, move on to Act 3.
- **They say no, or the seed file is missing:** don't improvise questions here. Say so plainly
  and point them at `/start`, which owns the real interrogation: "Let's get that right properly -
  run `/start` and it'll walk through it with you." That decides the rest of this tour: skip Act 3
  and Act 4 entirely (there's no confirmed goal to demo or reflect back) and end here pointing at
  `/start` - nothing to improvise.

## Act 3 — The trip-wire demo (watch the lock arm, live)
This is the moment that sells the whole kit: not a slide about the clarity lock, the lock actually
firing, live, in front of them. Pick the demo prompt from the confirmed seed's `goal` (never
improvise a different one - both prompts below are verified to arm `isVagueBuild`, exact wording
matters):

- `goal: "new"`, and no real app code sitting in the project yet: tell the user to type this
  exactly: **`build me a nice landing page`**
- `goal: "rescue"`, or there's already real app code in the project (even if `goal` says
  something else): tell the user to type this exactly: **`make my app better`**
- `goal: "learn"` with no existing code: treat it like `new` (landing page prompt); with existing
  code, treat it like `rescue` (app-better prompt) - use your judgment on "existing code" the same
  way either branch would.

Do not paraphrase either prompt. Their exact wording is what arms the lock; anything else is not
verified and may not fire.

**If they type something else instead** (their own idea, a typo, a question): that's fine - people
do. Don't insist on the script and don't quietly start building. If the lock armed anyway, run the
demo on THEIR prompt (better - it's their real project). If it didn't arm, answer or park what
they typed in one line, then offer once: "Want to see the ask-first lock fire? Type the prompt
above exactly and watch." If they'd rather just get to work, skip to Act 4 - the tour serves
them, not the other way around.

Then:
1. Let the clarity engine do its thing: say nothing else, just wait for the lock to arm and the
   first multiple-choice question to appear.
2. Run exactly ONE round of it - ask the first multiple-choice question the engine raises, take
   their pick, and stop there. Don't run the full clarification interview during the tour.
3. Narrate what just happened, in plain English: "That lock you just saw arms on every vague ask -
   nothing gets built until you say yes." Point at the specific thing that fired if it helps (the
   vague word, the missing detail) so it's concrete, not abstract.
4. Offer the choice as a pick: **"Want to keep going and actually answer the round for real, or
   release the lock now? Just say 'just do it' and it'll build without asking further."**

Either answer is fine - this is a demo, not a real build yet, so there's no wrong choice. If they
release it, that's the lock's actual escape hatch working as designed, another thing worth being
loud about.

## Act 4 — The cockpit reveal, then hand off
If they have the contextkit statusline (they didn't decline it during setup, turn it off, or keep
a status line of their own): point at what's already on screen. One line, describing what's
actually there: "That line under every prompt is your cockpit - your project, a progress bar, step
N of M, and it'll say 'asking first' the moment a clarity round is running."

If they declined the statusline, turned it off, or kept their own status line contextkit didn't
wire: there's nothing on screen to point at, so skip that line entirely and give them their two
real windows instead: "No statusline on screen for you, so your two windows into this are
`contextkit recap` (the receipts card from your last session, any time) and `contextkit watch` (the
live HUD, in a second pane)."

Then offer the live HUD as a second-window option:
- **Windows:** offer to run `start contextkit watch` in a new window.
- **macOS:** offer to run `open -a Terminal` (then `contextkit watch` inside it), or the terminal
  app's equivalent.
- **Anything else:** just print the command (`contextkit watch`) and let them run it themselves in
  a second pane.

Declining is completely fine - the statusline alone is enough for most people, watch is optional
theater for those who want the bigger picture live.

Close the loop: reflect back what actually got set up this session in plain English (skip the
project line if Act 2's seed confirmation failed or was missing - nothing to restate there), then
hand off: **"Want me to `/start` and plan the first real version with you, or, if you've already
got a plan, jump straight to `/step`?"**

## Voice
Warm, fast, direct. Sell the tools in one honest line each, no hype. They should finish thinking
"huh, it set me up AND it actually asked me things instead of guessing", because that is the entire
product.
