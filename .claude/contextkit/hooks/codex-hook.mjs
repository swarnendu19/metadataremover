#!/usr/bin/env node
// Codex hook adapter. The core kit hooks were written against Claude Code's output
// protocol; Codex has the same lifecycle names but a different JSON response shape.
// Keep the coaching logic in one place and translate at the boundary.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const [target] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const allowed = new Set([
  "session-start.mjs",
  "tutor.mjs",
  "clarity.mjs",
  "subagent-rules.mjs",
  "safety-guard.mjs",
  "slop-check.mjs",
  "cards.mjs",
  "stop-reminder.mjs",
]);

function readInput() {
  try {
    return process.stdin.isTTY ? "" : readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function payloadFrom(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function clean(output) {
  return String(output || "").trim();
}

function emit(payload, output) {
  const text = clean(output);
  if (!text) return;

  // Claude's strict Stop response is a block decision. Codex Stop hooks do support
  // `continue: false`, but do not expose Claude's loop-prevention signal. Translate it
  // to a warning so a strict slop check can never trap a Codex task in a stop loop.
  try {
    const parsed = JSON.parse(text);
    if (parsed?.decision === "block") {
      const reason = String(parsed.reason || "contextkit needs one more check before stopping");
      console.log(JSON.stringify({ systemMessage: reason }));
      return;
    }
    if (parsed?.hookSpecificOutput?.permissionDecision === "deny") {
      // Codex currently exposes a warning-only PreToolUse hook. Preserve the reason
      // instead of emitting Claude-only fields that Codex would reject.
      console.log(JSON.stringify({ systemMessage: String(parsed.hookSpecificOutput.permissionDecisionReason || "contextkit check required") }));
      return;
    }
  } catch {}

  const event = payload.hook_event_name;
  if (event === "SessionStart" || event === "SubagentStart") {
    console.log(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: event, additionalContext: text },
      }),
    );
  } else {
    console.log(JSON.stringify({ systemMessage: text }));
  }
}

if (!allowed.has(target)) process.exit(0);
const raw = readInput();
const payload = payloadFrom(raw);
const child = spawnSync(process.execPath, [join(here, target)], {
  input: raw,
  encoding: "utf8",
  timeout: 15000,
  env: { ...process.env, CONTEXTKIT_HOST: "codex" },
});
emit(payload, child.stdout);
