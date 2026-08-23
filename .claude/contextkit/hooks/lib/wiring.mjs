// Hook wiring, shared by the installer and doctor --fix. Zero dependencies (ships in the
// engine copy). The node path is explicit and absolute: hooks wired as bare "node" die
// silently when Claude Code's shell has a different PATH - the baseline proved it.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MARKER = "contextkit";
const fwd = (p) => p.replace(/\\/g, "/");

// every hook the kit wires: event -> entries (matcher optional)
export const HOOK_EVENTS = {
  SessionStart: [{ file: "session-start.mjs" }, { file: "tutor.mjs" }],
  UserPromptSubmit: [{ file: "clarity.mjs" }, { file: "tutor.mjs" }],
  PreCompact: [{ file: "tutor.mjs" }],
  SubagentStart: [{ file: "subagent-rules.mjs" }],
  PreToolUse: [
    { matcher: "Bash", file: "safety-guard.mjs" },
    { matcher: "Edit|Write|MultiEdit|NotebookEdit", file: "clarity.mjs" },
  ],
  PostToolUse: [
    { matcher: "Edit|Write", file: "slop-check.mjs" },
    { matcher: "Edit|Write", file: "cards.mjs" },
  ],
  Stop: [{ file: "stop-reminder.mjs" }],
  SessionEnd: [{ file: "recap.mjs" }],
};

function setHooks(hooksObj, event, entries, cmd) {
  const existing = Array.isArray(hooksObj[event]) ? hooksObj[event] : [];
  const keep = existing.filter(
    (e) =>
      !(
        e &&
        typeof e === "object" &&
        Array.isArray(e.hooks) &&
        e.hooks.some((h) => h && typeof h.command === "string" && h.command.includes(MARKER))
      ),
  );
  for (const { matcher, file } of entries) {
    keep.push(
      matcher
        ? { matcher, hooks: [{ type: "command", command: cmd(file) }] }
        : { hooks: [{ type: "command", command: cmd(file) }] },
    );
  }
  hooksObj[event] = keep;
}

export function wireHooks(claudeDir, engineDir, nodePath) {
  const settingsPath = join(claudeDir, "settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      return false; // never clobber a file we can't parse
    }
  }
  if (settings.hooks === undefined || settings.hooks === null) {
    settings.hooks = {};
  } else if (typeof settings.hooks !== "object" || Array.isArray(settings.hooks)) {
    return false; // hooks present but not a plain object: never clobber
  }
  const cmd = (hook) => `"${fwd(nodePath)}" "${fwd(join(engineDir, "hooks", hook))}"`;
  for (const [event, entries] of Object.entries(HOOK_EVENTS)) {
    setHooks(settings.hooks, event, entries, cmd);
  }
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  return true;
}

// ---- the statusline cockpit: one settings key, not a per-event hook. Wired/checked
// separately from HOOK_EVENTS so a user's own statusLine is never silently replaced. ----
export function statusLineCommand(engineDir, nodePath) {
  return `"${fwd(nodePath)}" "${fwd(join(engineDir, "bin", "statusline.mjs"))}"`;
}

export function isOurStatusLine(settings) {
  const cmd = settings && settings.statusLine && settings.statusLine.command;
  return typeof cmd === "string" && cmd.includes(MARKER);
}

// the script path is the last quoted token in the command string (see statusLineCommand)
export function statusLineScriptPath(settings) {
  const cmd = settings && settings.statusLine && settings.statusLine.command;
  if (typeof cmd !== "string") return null;
  const m = cmd.match(/"([^"]+)"\s*$/);
  return m ? m[1] : null;
}

// unconditional write: callers (installer with consent, doctor --fix in the safe cases)
// decide WHETHER to call this; this function just does it.
export function wireStatusLine(claudeDir, engineDir, nodePath) {
  const settingsPath = join(claudeDir, "settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      return false; // never clobber a file we can't parse
    }
  }
  settings.statusLine = {
    type: "command",
    command: statusLineCommand(engineDir, nodePath),
    padding: 0,
    // refreshInterval deliberately unset: everything this line shows changes on the same
    // events Claude Code already refreshes on; a timer would just spawn node for nothing
  };
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  return true;
}

// remove restores nothing it didn't place: only ever deletes OUR statusLine
export function removeStatusLine(claudeDir) {
  const settingsPath = join(claudeDir, "settings.json");
  if (!existsSync(settingsPath)) return false;
  try {
    const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    if (!isOurStatusLine(settings)) return false;
    delete settings.statusLine;
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}
