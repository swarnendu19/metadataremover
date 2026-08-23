#!/usr/bin/env node
// contextkit doctor: is the engine actually alive HERE? One green/red line per check,
// the exact fix for every red. Zero dependencies - runs from the engine copy.
//
//   node .claude/contextkit/bin/doctor.mjs             check this project
//   node .claude/contextkit/bin/doctor.mjs --fix       rewire node paths + place the rule, then re-check
//   node .claude/contextkit/bin/doctor.mjs --cascade   same checks, staggered ~150ms/line (TTY only)
//
// Exit 0 = all green (bench asserts on this). --cascade is a pure presentation affordance: on a
// non-TTY stdout (or without the flag) it does nothing - output and exit code are byte-identical
// to plain doctor. It never changes a check, a fix hint, or the exit code.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { userDir, readJson, loadConfig } from "../hooks/lib/state.mjs";
import { hasRule, upsertRule, markerState, migrateUnfenced, looksLikeOldRule } from "../hooks/lib/rule.mjs";
import { HOOK_EVENTS, wireHooks, isOurStatusLine, statusLineScriptPath, wireStatusLine } from "../hooks/lib/wiring.mjs";

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLAUDE = join(ENGINE, "..");
const CWD = process.cwd();
const FIX = process.argv.includes("--fix");
const CASCADE = process.argv.includes("--cascade") && Boolean(process.stdout.isTTY);

const GREEN = "\x1b[32m", RED = "\x1b[31m", DIM = "\x1b[2m", RESET = "\x1b[0m";
const results = []; // { ok, fixable } - fixable = would `contextkit doctor --fix` actually help?
// Every report/status line goes through `sink` instead of console.log directly, so cascade mode
// can capture the lines and replay them staggered without touching the check logic itself.
let sink = console.log;
function report(name, ok, fixHint, fixable = false) {
  results.push({ ok, fixable });
  sink(`  ${ok ? GREEN + "OK " : RED + "RED"}${RESET}  ${name}${ok ? "" : DIM + "   fix: " + fixHint + RESET}`);
}

function eventsObj(settings) {
  return settings && typeof settings.hooks === "object" && settings.hooks && !Array.isArray(settings.hooks)
    ? settings.hooks
    : {};
}

function kitCommands(settings) {
  const events = eventsObj(settings);
  return Object.values(events)
    .filter(Array.isArray)
    .flat()
    .filter((e) => e && typeof e === "object")
    .flatMap((e) => (Array.isArray(e.hooks) ? e.hooks : []).map((h) => h && h.command))
    .filter((c) => typeof c === "string" && c.includes("contextkit"));
}

// same extraction as kitCommands, but scoped to a single event (for the per-event check)
function kitCommandsForEvent(settings, event) {
  const entries = eventsObj(settings)[event];
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e && typeof e === "object")
    .flatMap((e) => (Array.isArray(e.hooks) ? e.hooks : []).map((h) => h && h.command))
    .filter((c) => typeof c === "string" && c.includes("contextkit"));
}

function checkAll() {
  results.length = 0;
  sink("\n  contextkit doctor" + DIM + "  (project: " + CWD + ")" + RESET + "\n");

  const settingsPath = join(CLAUDE, "settings.json");
  const settings = readJson(settingsPath, {}) || {};
  const cmds = kitCommands(settings);

  // 1. node reachable at the recorded path (execute it, don't just stat it)
  let nodeOk = false;
  const first = cmds[0] || "";
  const nodePath = first.startsWith('"') ? first.slice(1, first.indexOf('"', 1)) : first.split(" ")[0];
  if (nodePath) {
    const r = spawnSync(nodePath, ["-e", "process.exit(0)"], { timeout: 10000 });
    nodeOk = r.status === 0;
  }
  report("node reachable from the hooks", nodeOk, "contextkit doctor --fix (rewrites hook paths to this node)", true);

  // 2. every kit hook wired: per-event counts must meet the per-event entry counts, AND
  // every kit command's script path must actually exist on disk (a dead engine can still
  // have the right NUMBER of commands wired if a directory got moved/deleted).
  const expected = Object.values(HOOK_EVENTS).flat().length;
  const perEventOk = Object.entries(HOOK_EVENTS).every(
    ([event, entries]) => kitCommandsForEvent(settings, event).length >= entries.length,
  );
  const scriptPaths = cmds.map((c) => {
    const m = c.match(/"([^"]+)"\s*$/);
    return m ? m[1] : null;
  });
  const scriptsPresent = scriptPaths.length > 0 && scriptPaths.every((s) => s && existsSync(s));
  let hooksDetail = `${cmds.length}/${expected}`;
  hooksDetail += scriptsPresent ? ", scripts present" : ", missing script(s)";
  if (!perEventOk) hooksDetail += ", event mismatch";
  report(
    `hooks wired (${hooksDetail})`,
    cmds.length >= expected && perEventOk && scriptsPresent,
    "contextkit doctor --fix",
    true,
  );

  // 3. the always-on rule in THIS project
  let agents = "";
  try { agents = readFileSync(join(CWD, "AGENTS.md"), "utf8"); } catch {}
  const ruleOk = hasRule(agents);
  let ruleHint = "contextkit doctor --fix (adds the marked section)";
  let ruleFixable = true;
  if (!ruleOk) {
    if (markerState(agents) === "malformed") {
      ruleHint = "stray/reversed contextkit markers - tidy ./AGENTS.md by hand (--fix will not touch it)";
      ruleFixable = false;
    } else if (migrateUnfenced(agents, ENGINE) === null && looksLikeOldRule(agents, ENGINE)) {
      ruleHint = "found an old/edited contextkit rule copy - tidy ./AGENTS.md by hand (--fix will not touch it)";
      ruleFixable = false;
    }
  }
  report("ask-first rule in ./AGENTS.md", ruleOk, ruleHint, ruleFixable);

  // 4. state dirs writable (leave no trace: only clean up dirs doctor itself created)
  let stateOk = true;
  for (const dir of [userDir(), join(CWD, ".contextkit")]) {
    const existedBefore = existsSync(dir);
    try {
      mkdirSync(dir, { recursive: true });
      const probe = join(dir, ".doctor-probe");
      writeFileSync(probe, "ok");
      rmSync(probe, { force: true });
    } catch { stateOk = false; }
    if (!existedBefore) {
      try {
        if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true });
      } catch {}
    }
  }
  report("state dirs writable", stateOk, "check folder permissions for ~/.contextkit and ./.contextkit");

  // 5. skills present per the manifest
  const manifest = readJson(join(ENGINE, "manifest.json"), null);
  const missing = (manifest?.skills || []).filter((s) => !existsSync(join(CLAUDE, "skills", s, "SKILL.md")));
  report(
    manifest ? `skills present (${(manifest.skills.length - missing.length)}/${manifest.skills.length})` : "skills present (no manifest - pre-v0.4 install)",
    manifest ? missing.length === 0 : false,
    "re-run: npx contextkit-cli",
  );

  // 6. the statusline cockpit: never nag - green when wired-and-alive, when the install
  // was declined (config says so), or when the user has their own. Red only when contextkit
  // expects to own it (not declined) and it's actually missing or dead.
  const cfg = loadConfig();
  const oursSL = isOurStatusLine(settings);
  const slScript = statusLineScriptPath(settings);
  const slScriptOk = oursSL && Boolean(slScript) && existsSync(slScript);
  let slDetail, slOk, slHint, slFixable = false;
  if (oursSL && slScriptOk) {
    slDetail = "wired";
    slOk = true;
  } else if (cfg.statusline === "declined") {
    slDetail = "declined";
    slOk = true;
  } else if (settings.statusLine && !oursSL) {
    slDetail = "your own";
    slOk = true;
  } else {
    slDetail = "not wired";
    slOk = false;
    slHint = "contextkit doctor --fix";
    slFixable = true;
  }
  report(`statusline cockpit (${slDetail})`, slOk, slHint, slFixable);

  // 7. version (informational, never red)
  if (manifest?.version) sink(`  ${DIM}engine version ${manifest.version} (installed ${manifest.installedAt || "?"})${RESET}`);

  const allOk = results.every((r) => r.ok);
  const anyFixableRed = results.some((r) => !r.ok && r.fixable);
  sink(
    allOk
      ? `\n  ${GREEN}all green - the engine is alive here${RESET}\n`
      : `\n  ${RED}${results.filter((r) => !r.ok).length} check(s) red${RESET}${DIM}${anyFixableRed ? " - run: contextkit doctor --fix" : ""}${RESET}\n`,
  );
  return allOk;
}

const CASCADE_DELAY_MS = 150;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cascade mode: run the exact same synchronous checkAll() (same checks, same exit code), but
// capture its output lines instead of printing them, then replay them staggered. The check
// logic and its return value are untouched - only when the lines hit the terminal changes.
async function checkAllCascade() {
  const queue = [];
  sink = (line) => queue.push(line);
  let allOk;
  try {
    allOk = checkAll();
  } finally {
    sink = console.log;
  }
  for (let i = 0; i < queue.length; i++) {
    if (i > 0) await sleep(CASCADE_DELAY_MS);
    console.log(queue[i]);
  }
  return allOk;
}

if (FIX) {
  const notes = [];
  const wired = wireHooks(CLAUDE, ENGINE, process.execPath);
  notes.push(wired ? "hooks rewired to this node" : "hooks NOT rewired (settings.json is not valid JSON - fix it by hand)");
  const agentsPath = join(CWD, "AGENTS.md");
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, "utf8") : "";
  if (markerState(current) === "malformed") {
    notes.push("rule NOT placed (AGENTS.md has stray/reversed contextkit markers - tidy them by hand; the file was left untouched)");
  } else if (markerState(current) === "valid") {
    // already fenced correctly: refresh in place. Do NOT run migrateUnfenced here - the kit
    // AGENTS.md body it searches for is always present inside our OWN valid marker block too,
    // so on a healthy install it would false-match and duplicate the markers (bug, fixed here).
    writeFileSync(agentsPath, upsertRule(current, ENGINE));
    notes.push("rule refreshed in ./AGENTS.md (was already marked)");
  } else {
    const migrated = migrateUnfenced(current, ENGINE);
    if (migrated !== null) {
      writeFileSync(agentsPath, migrated);
      notes.push("upgraded your v0.3-era rules to the marked format (no duplicate added)");
    } else if (looksLikeOldRule(current, ENGINE)) {
      notes.push("rule NOT placed (found an old/edited contextkit rule copy - tidy ./AGENTS.md by hand)");
    } else {
      writeFileSync(agentsPath, upsertRule(current, ENGINE));
      notes.push("rule placed in ./AGENTS.md");
    }
  }
  const settingsForSL = readJson(join(CLAUDE, "settings.json"), {}) || {};
  if (isOurStatusLine(settingsForSL)) {
    const slFixed = wireStatusLine(CLAUDE, ENGINE, process.execPath); // refresh the node path, same as hooks
    notes.push(slFixed ? "statusline cockpit wired" : "statusline NOT wired (settings.json is not valid JSON)");
  } else if (!settingsForSL.statusLine && loadConfig().statusline !== "declined") {
    const slFixed = wireStatusLine(CLAUDE, ENGINE, process.execPath);
    notes.push(slFixed ? "statusline cockpit wired" : "statusline NOT wired (settings.json is not valid JSON)");
  } else if (settingsForSL.statusLine) {
    notes.push("statusline left alone (you have your own - to use ours: remove yours from settings.json, then contextkit statusline on)");
  } else {
    notes.push("statusline left declined (enable it with: contextkit statusline on)");
  }

  console.log("  --fix: " + notes.join("; ") + ". Re-checking...");
}

// Sync path (default, or --cascade without a TTY): identical to every prior version of this
// file. Async path (--cascade on a real TTY) only staggers the replay; process.exit still
// receives the same boolean checkAll() would have returned synchronously.
if (CASCADE) {
  checkAllCascade().then((ok) => process.exit(ok ? 0 : 1));
} else {
  process.exit(checkAll() ? 0 : 1);
}
