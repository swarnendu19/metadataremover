---
name: claude-tips
description: Use to surface the Claude Code features the user isn't using but should, tuned to what they're actually doing or struggling with. Trigger when the user says "/claude-tips", "what can claude code do", "is there a better way to do this", "i didn't know it could do that", or seems to be doing manually something Claude Code has a built-in for.
---

# /claude-tips — unlock the 90% of Claude Code you're not using

Most people install Claude Code and use a sliver of it. This points them at the built-in feature
that solves whatever they're doing the hard way. (Claude Code specific. The full list is in
`reference/claude-code-cheatsheet.md`.)

## Ask first
- **What's clunky, or what are you trying to do?** ("I keep re-explaining my project", "it forgot
  what we were doing", "it ran off and edited a bunch of files", "I want to connect my database".)
- If they just want the tour, give the **5 must-knows** below, not the whole list.

## Match the pain to the feature (recommend ONE, in plain English)
- Re-explaining the project every time -> a `CLAUDE.md` (loads every session).
- It forgot / got slow / lost the thread -> `/clear` or `/compact` (context management).
- It ran off and built the wrong thing -> **plan mode** (`Shift+Tab`): approve before it edits.
- Doing the same workflow over and over -> a custom command in `.claude/skills/`.
- Needs live web, docs, a database, GitHub -> MCP (`/connect-mcp`).
- Big research bloating the chat -> "use a subagent to..." (fresh context, summary back).
- Wants a rule enforced every time -> a hook in `.claude/settings.json` (`/hooks`).
- Lost their session -> `claude --continue` / `--resume`.
- Showing a visual bug -> paste the screenshot (`Ctrl+V`, or `Alt+V` if your terminal grabs it).
- Wants a friendlier or terser voice -> `/output-style` (this kit adds teaching/buddy).

## The 5 must-knows (if they want the quick tour)
1. `CLAUDE.md` loads every session, write your rules once.
2. `Shift+Tab` -> plan mode: approve before it edits.
3. `/clear` and `/compact` keep context clean.
4. `.claude/skills/<name>/SKILL.md` -> your own `/command`.
5. MCP connects real tools (`/connect-mcp`).

## Stay accurate
Claude Code updates often. Recommend the feature, but tell them to run `/help` for the exact
command on their version, never assert a flag you're not sure is current. Don't dump all 40
features; surface the one that fixes their actual problem.

## Red flags, stop and correct
| You're about to... | Don't. Instead... |
| --- | --- |
| Dump the whole feature list | Recommend the ONE that fits what they're doing. |
| Assert a command you're unsure is current | Point them to `/help`; flag it might have changed. |
| Teach features they don't need yet | Match the tip to their actual pain. |

## Voice
Direct and useful, like a teammate going "oh, you don't have to do that by hand, there's a thing
for it." One good tip they'll actually use beats a wall of commands.
