---
name: codex-tips
description: Use to surface Codex features the user is not using but should, tuned to the friction they describe. Trigger when the user says "what can Codex do", "is there a better way", "I didn't know Codex could do that", or wants a Codex tour.
---

# Codex tips

Match one Codex feature to the user's actual pain. Do not dump a product manual.

- Re-explaining project rules -> `AGENTS.md` in the repository, or `~/.codex/AGENTS.md` for personal defaults.
- Wants a proposed approach before edits -> Plan mode, or ask Codex to plan before implementing.
- Repeating a workflow -> a `SKILL.md` inside `.agents/skills/<name>/`.
- Needs a check to run every time -> `.codex/hooks.json`; tell them to use `/hooks` to review and trust it.
- Needs current docs, a browser, GitHub, or another system -> MCP, then use `/mcp` to inspect connections.
- A broad audit is making the task noisy -> focused subagents, then a concise summary back to the main task.
- A task is bloated or stale -> start a new task with a short summary and keep durable rules in `AGENTS.md`.

For a quick tour, give only these five: `AGENTS.md`, Plan mode, skills, MCP, and hooks. Tell the user that Codex changes quickly, so `/help`, `/hooks`, and `/mcp` are the source for the exact interface in their client.
