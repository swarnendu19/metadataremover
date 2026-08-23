#!/usr/bin/env node
// The clarity engine: ask-first, enforced by code instead of markdown.
//
// One script, two hook events (dispatched on the payload's hook_event_name):
//
//   UserPromptSubmit  a vague, feature-sized prompt ARMS the lock and injects the
//                     clarity-round instruction. An explicit user approval ("yes",
//                     "go ahead", "option B... go") or "just do it" CLEARS it.
//   PreToolUse        while armed (strict mode only), file edits are DENIED, so the
//                     agent physically cannot build before the goal is confirmed.
//                     Planning files (CLAUDE.md, AGENTS.md, DESIGN.md, .contextkit/*)
//                     stay writable - the clarity round itself produces those.
//
// Modes (contextkit clarity strict|relaxed|off):
//   strict   arm + block           relaxed   instruct, never block         off   silent
//
// The lock auto-expires after 30 minutes so a stale flag can never wedge a project.
// Fails open: any error means "allow".

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  readStdinJson,
  readJson,
  writeJson,
  projectDir,
  loadConfig,
  appendEvent,
} from "./lib/state.mjs";

const EXPIRE_MS = 30 * 60 * 1000;
const flagPath = (cwd) => join(projectDir(cwd), "clarity.json");

function loadFlag(cwd) {
  const flag = readJson(flagPath(cwd), null);
  if (!flag?.pending) return null;
  if (Date.now() - (flag.since || 0) > EXPIRE_MS) {
    writeJson(flagPath(cwd), { pending: false });
    return null;
  }
  return flag;
}

const arm = (cwd, reason) => writeJson(flagPath(cwd), { pending: true, since: Date.now(), reason });
const clear = (cwd) => writeJson(flagPath(cwd), { pending: false });

// ---- prompt heuristics (shared with the tutor so the two never disagree) ----
import { isVagueBuild } from "./lib/heuristics.mjs";

const OVERRIDE = /\b(just do it|skip the questions|no questions|stop asking|jfdi)\b/i;

// An approval is a SHORT message with an explicit yes-word and no reservation.
// Deliberately not: bare option letters ("B") - those are mid-round answers, not sign-off.
const APPROVAL_WORD =
  /\b(yes|yep|yeah|yup|sure|ok(ay)?|correct|exactly|perfect|approved?|confirmed?|lgtm|looks good|sounds good|go ahead|go for it|let'?s go|proceed|do it|ship it|build it|that'?s (it|right)|go)\b/i;
const RESERVATION = /\b(no|not|don'?t|wait|hold|hmm|but|except|change|instead|actually|almost)\b/i;

function isApproval(prompt) {
  const t = prompt.trim();
  return t.length <= 60 && !RESERVATION.test(t) && APPROVAL_WORD.test(t);
}

function clarityInstruction(mode, engineHooksDir) {
  const codex = process.env.CONTEXTKIT_HOST === "codex";
  const lockLine =
    mode === "strict" && !codex
      ? "File edits are LOCKED until the user explicitly approves (the lock lifts on their approval message). If they approved in unusual wording and the lock is still on, run: node \"" +
        join(engineHooksDir, "clarity.mjs").replace(/\\/g, "/") +
        "\" --confirm  - only ever after a real approval."
      : mode === "strict"
        ? "Codex will put this ask-first instruction in the task and warn before a file edit. Its current PreToolUse hook API cannot dynamically deny an edit, so do not write files until the user explicitly approves."
      : "This is advisory: ask before building, but nothing is blocked.";
  return [
    "[contextkit clarity] This request is not specific enough to build safely. Before writing any code:",
    "1. Ask 3-4 clarifying questions AT ONCE (a focused batch, not one at a time), each in multiple choice (2-4 options, your recommendation marked), then follow up with another small batch only if gaps remain.",
    "2. Keep asking until you could restate the goal with no gaps: what exactly, for whom, what does done look like, what's out of scope.",
    "3. Reflect the goal back in plain English and get an explicit yes.",
    lockLine,
    "The user can always say 'just do it' to skip this.",
  ].join("\n");
}

// ---- event handlers ----
function onPrompt(payload, cwd, config) {
  const prompt = String(payload.prompt || "");
  const armed = loadFlag(cwd);

  if (OVERRIDE.test(prompt)) {
    if (armed) {
      clear(cwd);
      appendEvent(cwd, { type: "clarity-override" });
      console.log("[contextkit clarity] Override heard. Building without the clarity round - their call.");
    }
    return;
  }

  if (armed) {
    if (isApproval(prompt)) {
      clear(cwd);
      appendEvent(cwd, { type: "clarity-cleared" });
      console.log("[contextkit clarity] Goal confirmed by the user. Locks off - build exactly what was agreed, nothing extra.");
    }
    return; // mid-round answers: the instruction from arming still stands
  }

  if (isVagueBuild(prompt)) {
    if (config.clarity === "strict") arm(cwd, prompt.slice(0, 120));
    appendEvent(cwd, { type: "clarity-armed", mode: config.clarity });
    console.log(clarityInstruction(config.clarity, dirname(fileURLToPath(import.meta.url))));
  }
}

function onPreToolUse(payload, cwd, config) {
  if (config.clarity !== "strict") return;
  if (!loadFlag(cwd)) return;

  // planning artifacts stay writable during the clarity round
  const file = String(payload.tool_input?.file_path || payload.tool_input?.notebook_path || "");
  const fwd = file.replace(/\\/g, "/");
  if (/\/(CLAUDE|AGENTS|DESIGN)\.md$|^(CLAUDE|AGENTS|DESIGN)\.md$|\.contextkit\//.test(fwd)) return;

  appendEvent(cwd, { type: "clarity-block", tool: payload.tool_name, file: fwd });
  if (process.env.CONTEXTKIT_HOST === "codex") {
    console.log(
      "[contextkit] The goal is not confirmed yet. Codex must finish the clarity round and get an explicit yes before editing this file.",
    );
    return;
  }
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "⛔ contextkit: the goal isn't confirmed yet, so building is locked. Finish the clarity round: a batch of 3-4 multiple-choice questions up front, reflect the goal back, get an explicit yes from the user. The lock lifts on their approval.",
      },
    }),
  );
}

// ---- main ----
try {
  if (process.argv.includes("--confirm")) {
    clear(process.cwd());
    appendEvent(process.cwd(), { type: "clarity-cleared", via: "confirm" });
    console.log("[contextkit clarity] Confirmed. Locks off.");
    process.exit(0);
  }

  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();
  const config = loadConfig();
  if (config.clarity === "off") process.exit(0);

  if (payload.hook_event_name === "UserPromptSubmit") onPrompt(payload, cwd, config);
  else if (payload.hook_event_name === "PreToolUse") onPreToolUse(payload, cwd, config);
} catch {
  // fail open: never break a session over a coaching feature
}
