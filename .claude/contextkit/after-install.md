# contextkit: installed

You're set. Here's the 30-second version.

**Run `/tour`** for the 2-minute opening night: doctor's checks light up live, then it hands you
one build prompt and lets the clarity lock actually fire in front of you, before showing you the
cockpit. Otherwise:

- **New project or feature:** `/start` (it already knows your install answers, asks the few
  questions that matter, then plans and writes `CLAUDE.md` + your roadmap).
- **Every session after that** opens with your position: project, progress bar, next step.
- **New screen or a fresh look:** `/design-intake` (decide the design on purpose, writes `DESIGN.md`).
- **While building:** `/step` -> `/check`. **Broke?** `/fix`. **Before you accept:** `/review`.
- **Too much code?** `/lean`. **Looks AI-made?** `/design-check` -> `/polish`.
- **Need web/docs?** `/connect-mcp`.
- **Going live?** `/secrets` then `/ship`. **Broke it or lost work?** `/recover`. **Confused by the code?** `/explain`.
- **Underusing Claude Code?** `/claude-tips` surfaces the built-ins you're not using (full list: `reference/claude-code-cheatsheet.md`).
- **Want a teaching or buddy tone?** Turn it on in `/config` → Output style. The default stays direct.

**Running on its own (the engine):**
- **The clarity lock:** a vague build request can't touch your files until you've confirmed the
  goal. The agent asks multiple-choice questions, reflects the goal back, and your "yes" unlocks
  it. Say "just do it" any time to skip. Tune it: `contextkit clarity strict|relaxed|off`.
- **The tutor:** when the moment calls for it (big request, stuck on a bug, describing a visual
  problem in words), it teaches you the Claude Code power move for exactly that moment. Once,
  ever. Toggle: `contextkit tutor on|off`.
- After the AI edits a screen, it's auto-scanned for AI-slop tells and told to `/polish`.
- Before destructive commands (recursive delete, force-push, drop a database), you get a warning.
- A wrap-up nudge checks that "done" was proven, not promised.
- **The statusline cockpit:** the bottom line of Claude Code itself shows where you are, all
  session: project, progress bar, step N of M, and an "asking first" light while the clarity
  round runs. If you already had your own status line, we left it alone. Toggle:
  `contextkit statusline on|off`.
- **Session receipts:** when a session actually earned something (a lesson taught, a blind
  build caught, a step shipped), a short card appears at session end. It also saves to
  `.contextkit/last-recap.txt` in case your terminal doesn't show it - re-read it any time with
  `contextkit recap`. Nothing fires on a session with nothing to show. Toggle: `contextkit recap on|off`.

**The live HUD:** open a second terminal pane in your project and run `contextkit watch`:
your roadmap, status lights, and the agent's activity, live.

**Check where things stand any time:** `contextkit status`.

**`contextkit doctor`** — is the engine alive here? green/red per check; `--fix` repairs paths + places the rule.

**Updates:** re-run `npx contextkit-cli@latest` in the project. It upgrades in place and never
touches your project files or roadmap.

**Beyond Claude Code:** the rules are portable. `AGENTS.md` is read by Codex, Cursor, OpenCode,
Antigravity and others, so contextkit holds there too. The hook engine (clarity lock, tutor,
navigator) is Claude Code's superpower.

**Hooks are wired to an absolute node path at install time,** so they don't depend on your
PATH. If the engine ever goes quiet (node moved, was upgraded, or the path changed), run
`contextkit doctor --fix` to rewire them.

Questions or a team license: <YOUR CONTACT>.
