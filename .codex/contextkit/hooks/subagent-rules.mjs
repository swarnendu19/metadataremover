#!/usr/bin/env node
// SubagentStart hook: re-inject the kit's working rules into every subagent.
// SessionStart context never reaches Task() subagents, so without this, every
// subagent an agent spawns runs unguarded - leaner rules die at the Task boundary.
// (Hole documented publicly by ponytail issue #252; same fix.) Fails open.

try {
  console.log(
    [
      "[contextkit] You are a subagent; the kit's working rules apply to you too:",
      "- Build the smallest thing that works: reuse what exists, stdlib/platform before dependencies, no speculative abstractions.",
      "- No AI-slop tells in UI work (no em-dash prose, no glassmorphism-by-default, no tiny fonts, body 16px).",
      "- Report straight: if something failed or is unverified, say so plainly. Never claim done without checking.",
    ].join("\n"),
  );
} catch {}
