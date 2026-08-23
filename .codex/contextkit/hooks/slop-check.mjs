#!/usr/bin/env node
// PostToolUse hook (matcher: Edit|Write). After the agent edits a UI file, scan just that file
// for anti-slop tells and surface them, so the design gets checked automatically, not on demand.
// Fails open: any error and it stays silent. It never blocks an edit.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, basename } from "node:path";
import { appendEvent } from "./lib/state.mjs";

const UI_EXT = new Set([".css", ".scss", ".sass", ".less", ".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".astro"]);

function readStdin() {
  return new Promise((resolve) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => resolve(d));
    process.stdin.on("error", () => resolve(""));
    setTimeout(() => resolve(d), 1500); // never hang the session
  });
}

async function main() {
  let data = {};
  try { data = JSON.parse((await readStdin()) || "{}"); } catch { return; }
  const fp = data?.tool_input?.file_path || data?.tool_input?.path;
  if (fp) appendEvent(data.cwd || process.cwd(), { type: "edit", file: basename(fp) }); // feeds `contextkit watch`
  if (!fp || !UI_EXT.has(extname(fp).toLowerCase())) return;

  const detector = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "detect-slop.mjs");
  let out = "";
  try {
    out = execFileSync(process.execPath, [detector, fp], { encoding: "utf8" });
  } catch (e) {
    out = (e.stdout || "").toString(); // detector exits 1 when P1 found; its report is on stdout
  }
  if (!/Summary:/.test(out) || /Summary: 0 P1, 0 P2/.test(out)) return; // clean, stay quiet

  // surface a concise version as context for the agent
  const body = out.split("\n").filter((l) => l.trim()).slice(0, 30).join("\n");
  console.log(
    `[anti-slop] AI-slop tells detected in ${fp}. Fix every P1 NOW, before anything else. ` +
      `Fix each P2 too unless it is genuinely justified in context (say why in one line if you keep one). ` +
      `Do not call this step done with open tells.\n${body}`,
  );
}

main().catch(() => {});
