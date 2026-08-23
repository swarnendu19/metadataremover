# contextkit

**The tutor layer for Claude Code and Codex.**

Most people hit a blank terminal, don't know what to ask for, and never touch the powerful stuff
(plan mode, thinking, subagents, checkpoints). contextkit is a stateful engine that installs
alongside your agent and fixes that: it always tells you where you are and what's next, it forces
ambiguity out of a build before any code gets written, and it teaches you the right agent power
move at the exact moment you need it, once, ever. It works in Claude Code, Codex, and Antigravity,
and any tool that reads `AGENTS.md`. Claude Code and Codex both get the stateful hook engine.

## The three engines

1. **Navigator** - never a blank terminal. The install interview (`.contextkit/seed.json`) feeds
   `/start`, which plans your project and writes `.contextkit/journey.json`. Every session after
   that opens with a HUD: project, progress bar, step N of M, what you finished last time, what's
   next. `/step` keeps it current.
2. **Clarity engine** - ask ask ask, enforced. A vague build prompt arms a lock: the agent can't
   touch your files until you've confirmed the goal through multiple-choice questions. Say "just
   do it" any time to skip. Tune it: `contextkit clarity strict|relaxed|off`.
3. **Tutor** - moment-triggered lessons on the tool itself, not general coding craft. Big request,
   stuck on a bug, describing a visual problem in words: the tutor recognizes the moment and
   teaches the matching agent power move, 4-6 lines, once, ever. Toggle:
   `contextkit tutor on|off`.

All three run on a small state layer (`~/.contextkit` for what you and your profile know,
`.contextkit/` in each project for the roadmap and decisions) that fails open: missing or corrupt
state never breaks a session, the kit just behaves like plain AGENTS.md rules.

Codex's current hook API can inject the clarity round and warn before a write, but cannot deny a
write dynamically. In Codex, `strict` therefore means a durable ask-first instruction plus a
write warning. Its anti-slop strict check is also a final warning, because Codex does not expose
the loop-prevention signal needed for a safe stop block. Claude Code keeps the physical locks.

## First Build: the course
`contextkit learn` starts (or resumes) **First Build**: a 7-module guided course where the
agent becomes your tutor and takes you from an empty folder to YOUR OWN app idea, live on
the internet, understood end to end. Not a demo project: you bring the idea, the course
brings the rails. Modules: your idea becomes a plan; your first page; where your data
lives (watch your own data travel browser to server to database, animated inside your own
app); make it do more; when it breaks, and you fix it; ship it; graduation, with a boss
exam about your own code and a shareable ship page. Every lesson is hand-written, taught
at the moment it matters, and never repeated once you know it (`.contextkit/concepts.json`
remembers). Works in Claude Code, Codex, and any agent that can read files. Both Claude Code and
Codex get the hook-backed navigator, tutor, safety checks, and learning cards.

## What else is in the kit
Built on the same spine:
- **17 skills**: `/start`, `/tour`, `/step`, `/check`, `/fix`, `/review`, `/lean`,
  `/design-intake`, `/design-check`, `/polish`, `/ship`, `/secrets`, `/recover`, `/explain`,
  `/connect-mcp`, `/claude-tips`, `/codex-tips`.
- **Anti-slop**: `bin/detect-slop.mjs`, a real detector for AI-slop tells (flat gradients written
  as hex, fonts loaded wrong, em-dash saturation, and more), auto-scanned after edits. The Stop
  hook reacts by mode: `contextkit slop notify|strict|off` (default `notify`: it names open tells
  at wrap-up, shipping them stays your call; `strict` blocks the agent from finishing once, it
  never loops).
- **Learning cards**: after the agent lands a real code change in any project, a two-line card
  appears in the reply - WHAT IT DOES in your own words, and WHY THIS WAY (the choice made and the
  road not taken). Teach-once aware: it checks `.contextkit/concepts.json` and never cards the same
  concept twice, skips trivial edits, and holds a ten-minute cooldown. (`contextkit cards on|off`.)
- **The statusline cockpit**: Claude Code's own bottom line becomes the navigator - project,
  progress bar, step N of M, an "asking first" light while the clarity round runs. On screen
  every session, no second terminal needed. (`contextkit statusline on|off`; your own status
  line, if you have one, is never replaced.)
- **Session receipts**: a short card at session end with what the engine earned you - lessons
  taught, blind builds caught, steps shipped. Re-read any time: `contextkit recap`.
- **The ship celebration**: `/ship` verifies your live URL, then marks the moment with the mascot
  and your URL in a box, plus an honest tally. Run `contextkit celebrate --url <url>` yourself in
  a terminal for the full animated version (fireworks included).
- **`contextkit watch`**: the second-pane theater - a live terminal HUD with the roadmap,
  clarity/tutor status lights, and the agent's activity feed, animated.
- **`contextkit powers`**: the 20-power Claude Code map, what you've been taught vs. not yet.
- **Voices**: opt-in output styles `teaching` and `buddy` that swap the tone (default stays
  direct). Switch via `/config` -> Output style.
- A safety-guard hook before destructive commands, and a session greeting on start.

## Install
```
npx contextkit-cli verify --email you@example.com  # confirm your lifetime license
npx contextkit-cli --email you@example.com         # install Claude Code + Codex support in this project
npx contextkit-cli --global --email you@example.com # install globally for both agents
```
Interactive terminals get the animated install, then a 60-second interview whose answers seed
`/start` so the agent never re-asks the basics. Then run **`/tour`** in Claude Code or **`$tour`** in Codex.

## Use it
- Run **`/tour`** first, it sets you up by asking.
- New project or feature: **`/start`**.
- Check where things stand any time: `contextkit status`.
- Clean uninstall: `contextkit remove` (keeps your `AGENTS.md`, `CLAUDE.md`, and `.contextkit/`
  roadmap; those are yours).

---
© contextkit. Commercial kit, see LICENSE.
