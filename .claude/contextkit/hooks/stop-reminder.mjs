#!/usr/bin/env node
// Stop hook: "done" must be proven, not promised - and P1 slop tells never ship SILENTLY.
//
// 1. If any UI file edited this session still has P1 anti-slop tells, the reaction follows
//    `contextkit slop <mode>`:
//      notify (default)  say it plainly and let the user decide - maybe they LIKE the gradient
//      strict            block the stop once and send the agent back to fix (never loops:
//                        stop_hook_active means we already blocked - let it through)
//      off               don't even scan
// 2. Otherwise: the usual light nudge (/check, /review, journey freshness).
// Also feeds the live HUD. Fails open.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, isAbsolute } from "node:path";
import {
  readStdinJson,
  loadJourney,
  journeyProgress,
  appendEvent,
  eventsPath,
  loadConfig,
} from "./lib/state.mjs";

const UI_EXT = new Set([".css", ".scss", ".sass", ".less", ".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".astro"]);

function recentUiEdits(cwd, limit = 3) {
  try {
    const lines = readFileSync(eventsPath(cwd), "utf8").trim().split("\n").slice(-80);
    const seen = new Set();
    for (const l of lines.reverse()) {
      try {
        const e = JSON.parse(l);
        if (e.type === "session-start") break; // only this session's edits
        if (e.type === "edit" && e.file && UI_EXT.has(extname(e.file).toLowerCase())) seen.add(e.file);
      } catch {}
    }
    return [...seen].slice(0, limit);
  } catch {
    return [];
  }
}

function p1Tells(cwd, files) {
  const detector = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "detect-slop.mjs");
  const hits = [];
  for (const f of files) {
    const full = isAbsolute(f) ? f : join(cwd, f);
    if (!existsSync(full)) continue;
    let out = "";
    try {
      out = execFileSync(process.execPath, [detector, full], { encoding: "utf8", timeout: 5000 });
    } catch (e) {
      out = (e.stdout || "").toString();
    }
    const m = out.match(/Summary:\s*(\d+)\s*P1/);
    if (m && Number(m[1]) > 0) hits.push(`${f} (${m[1]} P1)`);
  }
  return hits;
}

try {
  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();

  appendEvent(cwd, { type: "stop" });

  // the P1 reaction - mode-dependent, and never loops in strict mode
  const slopMode = loadConfig().slop;
  if (slopMode !== "off") {
    const hits = p1Tells(cwd, recentUiEdits(cwd));
    if (hits.length) {
      if (slopMode === "strict" && !payload.stop_hook_active) {
        appendEvent(cwd, { type: "slop-block", files: hits });
        console.log(
          JSON.stringify({
            decision: "block",
            reason:
              `[contextkit] P1 anti-slop tells are still open in: ${hits.join(", ")}. ` +
              `These are the "an AI made this" fingerprints - they don't ship in strict mode. ` +
              `Fix every P1, then finish. (The user can switch modes: contextkit slop notify)`,
          }),
        );
        process.exit(0);
      }
      // notify: say it straight, their call - maybe the gradient is a deliberate choice
      appendEvent(cwd, { type: "slop-notice", files: hits });
      console.log(
        `[contextkit] Heads up: strong AI-slop tells are open in ${hits.join(", ")} - the kind ` +
          `people recognize as machine-made. /polish fixes them; keeping them is your call. ` +
          `(Make this a hard gate: contextkit slop strict)`,
      );
    }
  }

  const journey = loadJourney(cwd);
  const inProgress = journey ? journeyProgress(journey).current : null;
  const staleNote =
    inProgress && inProgress.status === "in-progress"
      ? ` And "${inProgress.title}" is still marked in-progress in .contextkit/journey.json - update it if that changed.`
      : "";

  console.log(
    "[contextkit] Before you call it done: did you /check it actually runs, and /review the diff against the goal?" +
      staleNote,
  );
} catch {
  console.log(
    "[contextkit] Before you call it done: did you /check it actually runs, and /review the diff against the goal?",
  );
}
