# <Project name> — the one source of truth

> Your AI reads this file first, every time. Keep it short and current. This is the
> single thing that stops your project from turning into spaghetti. Run `/start` and the
> assistant fills this in for you, or fill it in yourself.

## What we're building
<One plain paragraph: what it is, who it's for, and what "done" looks like for the first
useful version.>

## The stack (what it's built with, where it runs)
<The tools / frameworks / where it's hosted. If you don't know, ask the AI to recommend a
sensible default and write it here so it never drifts.>

## Scope
- **In (now):** <the few things the first version must do>
- **Out (not yet):** <everything you're deliberately NOT building yet>

## contextkit — the rules the AI must follow here
0. **Ask me questions before you build.** No code on assumptions. Ask 3-4 questions at once, then more if needed, and ask in multiple choice (2 to 4 options with your pick marked) so I just choose instead of writing from a blank page.
1. **This file is the source of truth.** Read it every time. Keep it current.
2. **Plan, then build one step at a time.** No giant surprise diffs.
3. **Checkpoint after every working step.** Commit often (my undo button). Never run destructive commands (delete, force-push, drop a database) without asking.
4. **Prove it works before you say "done."** Actually run or open it. Evidence, not vibes. If it breaks, find the real cause; after ~3 failed patches, stop and rethink.
5. **Review your own diff against the goal before I accept it.**

**You recommend. I decide.**

## Decisions log
> When we make a real call (a tool, an approach, a tradeoff), add one line here so we never
> re-argue it later.
- <date>: <decision> because <reason>
