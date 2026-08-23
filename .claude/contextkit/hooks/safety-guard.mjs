#!/usr/bin/env node
// PreToolUse hook (matcher: Bash). Warns before a destructive command runs. It WARNS, it does
// not block, a kit that hard-blocks your commands gets uninstalled. The point is "did you mean
// this, and did you checkpoint first?" (Rule 3). Fails open.

function readStdin() {
  return new Promise((resolve) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => resolve(d));
    process.stdin.on("error", () => resolve(""));
    setTimeout(() => resolve(d), 1500);
  });
}

const DANGER = [
  [/rm\s+-[rf]{1,2}\s+(\/|~|\$HOME)/, "recursive delete of a root or home path"],
  [/rm\s+-[rf]{1,2}\s+\*/, "recursive delete with a wildcard"],
  [/git\s+push\b.*(--force|-f)\b/, "force-push (can overwrite shared history)"],
  [/git\s+reset\s+--hard/, "hard reset (throws away uncommitted work)"],
  [/git\s+clean\s+-[a-z]*f/, "git clean -f (deletes untracked files)"],
  [/\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b/i, "dropping or truncating a database object"],
  [/\b(mkfs|dd\s+if=)/, "a disk-level operation"],
];

async function main() {
  let data = {};
  try { data = JSON.parse((await readStdin()) || "{}"); } catch { return; }
  const cmd = data?.tool_input?.command || "";
  for (const [re, why] of DANGER) {
    if (re.test(cmd)) {
      console.error(`[contextkit - safety] This looks destructive: ${why}.\n  Rule 3: commit a checkpoint first, and make sure this is really what you want.`);
      break;
    }
  }
  process.exit(0); // warn only, never block
}

main().catch(() => process.exit(0));
