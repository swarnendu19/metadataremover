// Codex hook wiring. Codex discovers project hooks in .codex/hooks.json and
// user-wide hooks in ~/.codex/hooks.json. We merge rather than replace, and only
// remove handlers whose command contains our marker.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MARKER = "contextkit";
const fwd = (path) => path.replace(/\\/g, "/");

export const CODEX_HOOK_EVENTS = {
  SessionStart: [
    { matcher: "startup|resume|clear|compact", file: "session-start.mjs" },
    { matcher: "startup|resume|clear|compact", file: "tutor.mjs" },
  ],
  UserPromptSubmit: [{ file: "clarity.mjs" }, { file: "tutor.mjs" }],
  PreCompact: [{ matcher: "manual|auto", file: "tutor.mjs" }],
  SubagentStart: [{ file: "subagent-rules.mjs" }],
  PreToolUse: [
    { matcher: "Bash", file: "safety-guard.mjs" },
    { matcher: "apply_patch|Edit|Write", file: "clarity.mjs" },
  ],
  PostToolUse: [
    { matcher: "apply_patch|Edit|Write", file: "slop-check.mjs" },
    { matcher: "apply_patch|Edit|Write", file: "cards.mjs" },
  ],
  Stop: [{ file: "stop-reminder.mjs" }],
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readHooks(path) {
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return isPlainObject(parsed) && (parsed.hooks === undefined || isPlainObject(parsed.hooks)) ? parsed : null;
  } catch {
    return null;
  }
}

function withoutContextkit(groups) {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((group) => {
      if (!isPlainObject(group) || !Array.isArray(group.hooks)) return group;
      const hooks = group.hooks.filter((hook) => !(typeof hook?.command === "string" && hook.command.includes(MARKER)));
      return hooks.length ? { ...group, hooks } : null;
    })
    .filter(Boolean);
}

export function wireCodexHooks(codexDir, engineDir, nodePath) {
  const path = join(codexDir, "hooks.json");
  const config = readHooks(path);
  if (config === null) return false;
  config.hooks = isPlainObject(config.hooks) ? config.hooks : {};
  const command = (file) => `"${fwd(nodePath)}" "${fwd(join(engineDir, "hooks", "codex-hook.mjs"))}" "${file}"`;

  for (const [event, entries] of Object.entries(CODEX_HOOK_EVENTS)) {
    const next = withoutContextkit(config.hooks[event]);
    for (const { matcher, file } of entries) {
      const group = { hooks: [{ type: "command", command: command(file), timeout: 15, statusMessage: "contextkit" }] };
      if (matcher) group.matcher = matcher;
      next.push(group);
    }
    config.hooks[event] = next;
  }
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  return true;
}

export function removeCodexHooks(codexDir) {
  const path = join(codexDir, "hooks.json");
  const config = readHooks(path);
  if (config === null || !isPlainObject(config.hooks)) return false;
  let changed = false;
  for (const event of Object.keys(config.hooks)) {
    const before = JSON.stringify(config.hooks[event]);
    const next = withoutContextkit(config.hooks[event]);
    if (JSON.stringify(next) !== before) changed = true;
    if (next.length) config.hooks[event] = next;
    else delete config.hooks[event];
  }
  if (changed) writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
  return changed;
}

export function codexHookCommands(codexDir) {
  const config = readHooks(join(codexDir, "hooks.json"));
  if (!config || !isPlainObject(config.hooks)) return [];
  return Object.values(config.hooks)
    .filter(Array.isArray)
    .flat()
    .flatMap((group) => (Array.isArray(group?.hooks) ? group.hooks : []))
    .map((hook) => hook?.command)
    .filter((command) => typeof command === "string" && command.includes(MARKER));
}
