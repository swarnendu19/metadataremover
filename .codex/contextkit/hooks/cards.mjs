#!/usr/bin/env node
// PostToolUse hook (matcher: Edit|Write). After the agent lands a MEANINGFUL code change in ANY
// codebase, inject a short meta-prompt asking it to append one compact "learning card" to its
// current reply: WHAT IT DOES / WHY THIS WAY / the single teachable Concept. Teach-once aware via
// the concept graph. Like tutor.mjs, the hook never writes the card itself - it shapes ONE reply,
// and the words live in curriculum/learning-card.md (editable, no code change).
//
// Discipline (what keeps it a gift, not a nag). ALL must hold or it stays silent:
//   - config.cards is not false
//   - the edited file is source code (ts/tsx/js/py/... , not md/json/css/config)
//   - the change is meaningful: >= ~15 changed lines, or a fresh write of >= ~20 lines
//   - cooldown: at most one card per 10 minutes (lastCard stamp in .contextkit/cards.json)
//   - silent while First Build is mid-beat: the course does its own teaching
//   - fails open: any error, or no diff info to judge, means silence, never a broken session

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, basename } from "node:path";
import {
  readStdinJson,
  readJson,
  writeJson,
  projectDir,
  loadConfig,
  appendEvent,
} from "./lib/state.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const memoPath = (cwd) => join(projectDir(cwd), "cards.json"); // rolling cooldown stamp, per project

const COOLDOWN_MS = 10 * 60 * 1000; // at most one card every ten minutes
const MIN_EDIT_LINES = 15; // a change worth teaching from
const MIN_WRITE_LINES = 20; // a fresh file worth teaching from

// Source code only: a code choice is teachable, a doc/config/style tweak is not. Kept as an
// allow-list on purpose (a new extension defaults to silent, never a wrong card).
const SOURCE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".rb", ".go", ".rs", ".java", ".kt",
  ".swift", ".c", ".h", ".cc", ".cpp", ".hpp", ".cs", ".php", ".scala", ".ex", ".exs", ".sh",
  ".sql", ".vue", ".svelte",
]);

const countLines = (s) => (typeof s === "string" && s.length ? s.split("\n").length : 0);

// How many lines this change touched, from whatever the PostToolUse payload gives us. Returns 0
// when there is nothing to judge (unknown tool shape), which the caller treats as "skip".
function changedLines(payload) {
  const input = payload.tool_input || {};
  if (typeof input.content === "string") return countLines(input.content); // Write: the whole file
  if (typeof input.new_string === "string" || typeof input.old_string === "string") {
    return Math.max(countLines(input.new_string), countLines(input.old_string)); // Edit: the hunk
  }
  return 0;
}

// Silent while a First Build beat is open - the course teaches its own concepts, in its own voice.
function courseMidBeat(cwd) {
  const p = readJson(join(projectDir(cwd), "course-progress.json"), null);
  return p?.status === "in-progress";
}

function main() {
  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();
  if (loadConfig().cards === false) return; // off

  const fp = payload.tool_input?.file_path || payload.tool_input?.path;
  if (!fp || !SOURCE_EXT.has(extname(fp).toLowerCase())) return; // not source code

  const isWrite = typeof payload.tool_input?.content === "string";
  const threshold = isWrite ? MIN_WRITE_LINES : MIN_EDIT_LINES;
  if (changedLines(payload) < threshold) return; // too small to teach from

  if (courseMidBeat(cwd)) return; // the course owns the teaching right now

  const memo = readJson(memoPath(cwd), {}) || {};
  if (Date.now() - (memo.lastCard || 0) < COOLDOWN_MS) return; // one card per ten minutes

  let text = "";
  try {
    text = readFileSync(join(HERE, "..", "curriculum", "learning-card.md"), "utf8").trim();
  } catch {
    return; // no words, no card
  }

  memo.lastCard = Date.now();
  writeJson(memoPath(cwd), memo);
  appendEvent(cwd, { type: "card", file: basename(fp) });
  console.log(text);
}

try {
  main();
} catch {
  // fail open: never a broken session over a learning card
}
