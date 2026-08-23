# Claude Code: the features you're not using

Most people install Claude Code and use maybe 10% of it. Here's the high-leverage 90% they miss,
beginner-first. (Claude Code moves fast, so for exact syntax on your version, run `/help`.)
`/claude-tips` surfaces the right one for whatever you're stuck on.

## The 5 must-knows
1. **`CLAUDE.md` is your secret weapon.** Write your project's rules once; it loads every session. Stop re-explaining your stack and conventions.
2. **Plan before code: press `Shift+Tab` until the input says plan.** Claude proposes the whole change without editing; you approve first. Two minutes, saves hours of wrong work.
3. **Manage your context: `/clear` and `/compact`.** A bloated conversation makes Claude slower and forgetful. `/clear` = fresh slate; `/compact` = summarize and keep going.
4. **Make your own commands.** Drop a markdown file in `.claude/skills/` and you've got a `/yourcommand`. Reusable workflows, no copy-paste.
5. **Connect real tools with MCP.** `claude mcp add ...` (flags change - `claude mcp add --help`) gives Claude live web, docs, your database, GitHub. (See `/connect-mcp`.)

## Context (you're probably drowning it)
- `/clear` - wipe the conversation, keep the project loaded. Use between unrelated tasks.
- `/compact [note]` - summarize the convo down to the essentials and continue. Use before a big new task.
- `/context` - see what's filling your context window right now (diagnose "why did it forget that").

## Plan before code
- `Shift+Tab` cycles permission modes; press it until the input says **plan**: Claude reads and proposes, edits nothing, you approve. Best habit for not letting it run off and build the wrong thing.

## Memory (stop re-explaining yourself)
- `./CLAUDE.md` - project rules, shared via git, loaded every session.
- `~/.claude/CLAUDE.md` - your personal defaults across all projects.
- `/memory` - browse what Claude has auto-learned about your project.
- Just say "remember X" or "add this to CLAUDE.md." (A `#` shortcut isn't in current docs - use `/memory` or edit CLAUDE.md directly.)

## Your own commands and skills
- `.claude/skills/<name>/SKILL.md` -> invoke as `/<name>` (or Claude auto-invokes it when it fits). Personal ones go in `~/.claude/skills/<name>/SKILL.md`.
- Check them into git and your whole team gets them. (This kit is exactly this.)

## Point at files, run shell inline
- `@path/to/file` - drop a file's contents into your prompt (also works to import files inside CLAUDE.md).
- `!git status` - run a shell command yourself and feed the output to Claude. Grounds it in real state.

## Hand off the big stuff (subagents)
- Just ask: "use a subagent to research X." It gets a fresh context, does the heavy reading, and hands back a summary, your main window stays clean.

## Automate rules (hooks)
- Lifecycle hooks in `.claude/settings.json` run scripts automatically (e.g. format on every edit, block `rm -rf`). No LLM judgment, runs every time. `/hooks` shows what's wired. (This kit ships several.)

## Pick up where you left off
- `claude --continue` - resume the last session here. `claude --resume` - pick from past sessions. Sessions auto-save; just come back.

## Other quiet power
- **Paste a screenshot** right in with `Ctrl+V` (some terminals grab that - try `Alt+V` if nothing happens). Claude sees the image (great for "why does this look broken").
- **Toggle extended thinking with `Alt+T`** (Mac: `Option+T`) before sending a hard question, gives Claude more reasoning time. A few models ignore the toggle.
- `/output-style` - switch Claude's voice (concise / explanatory / your own). This kit adds `teaching` and `buddy`.
- **Switch models** for the task (`/model` or `--model` - check `/help` for your version's syntax): a fast one for easy work, the strongest for hard problems.

> Things change between releases. If a command here doesn't match, run `/help`, don't trust a stale cheatsheet (this one included).
