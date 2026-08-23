#!/usr/bin/env node
// A small Codex-specific health check. Claude's doctor remains independent because its
// configuration and status line are different surfaces.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { hasRule } from "../hooks/lib/rule.mjs";
import { CODEX_HOOK_EVENTS, codexHookCommands, wireCodexHooks } from "../hooks/lib/codex-wiring.mjs";

const ENGINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const CODEX = join(ENGINE, "..");
const CWD = process.cwd();
const fix = process.argv.includes("--fix");
if (fix) wireCodexHooks(CODEX, ENGINE, process.execPath);

const commands = codexHookCommands(CODEX);
const expected = Object.values(CODEX_HOOK_EVENTS).flat().length;
const engineOk = existsSync(join(ENGINE, "hooks", "codex-hook.mjs"));
const hooksOk = commands.length >= expected && commands.every((command) => {
  const parts = [...command.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return parts.length >= 2 && existsSync(parts[1]);
});
let agents = "";
const globalInstall = CODEX === join(homedir(), ".codex");
try { agents = readFileSync(globalInstall ? join(CODEX, "AGENTS.md") : join(CWD, "AGENTS.md"), "utf8"); } catch {}
const skillsDir = globalInstall ? join(homedir(), ".agents", "skills") : join(CWD, ".agents", "skills");
let manifest = null;
try { manifest = JSON.parse(readFileSync(join(ENGINE, "manifest.json"), "utf8")); } catch {}
const skillsOk = Boolean(manifest) && manifest.skills.every((name) => existsSync(join(skillsDir, name, "SKILL.md")));
const rows = [
  ["Codex engine copied", engineOk],
  [`Codex hooks wired (${commands.length}/${expected})`, hooksOk],
  ["ask-first rule in ./AGENTS.md", hasRule(agents)],
  ["Codex skills present", skillsOk],
];
console.log("\n  contextkit doctor (Codex)\n");
for (const [label, ok] of rows) console.log(`  ${ok ? "OK " : "RED"}  ${label}${ok ? "" : "   fix: contextkit doctor --fix"}`);
const healthy = rows.every(([, ok]) => ok);
console.log(healthy ? "\n  all green - Codex integration is alive\n" : "\n  run: contextkit doctor --fix\n");
process.exit(healthy ? 0 : 1);
