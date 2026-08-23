#!/usr/bin/env node
// SessionEnd hook: the receipts card. The engine's invisible saves, made visible for a
// moment at the end of a session - then it's gone until the next one earns its own.
//
// Whether SessionEnd's stdout is actually shown to a human at exit is NOT verified across
// terminals (see the plan's platform-facts header), so this hook never depends on stdout
// being seen: it ALWAYS persists the rendered card to .contextkit/last-recap.txt (and prints
// best-effort too). `contextkit recap` re-renders the saved card on demand.
//
// Contract:
//   - config.recap === false -> exit silently, write nothing.
//   - Scans events.jsonl for everything AFTER the last session-start entry (this session's
//     activity only): lesson (with ids), clarity-block, clarity-armed -> clarity-cleared
//     pairs ("blind builds caught"), clarity-override.
//   - Reads journey.json for steps done + lastSession.note. The journey stat line ("step D
//     of M shipped") and the lastSession.note closing line are shown ONLY when THIS session
//     earned them: done increased vs. the done-count session-start.mjs snapshotted when this
//     session opened (when that snapshot exists), or - fallback for events files that predate
//     the snapshot - at least one counted event fired this session. A do-nothing session in a
//     mid-journey project must never reprint stale journey progress.
//   - Zero counted events AND no earned journey progress -> print nothing, write nothing (the
//     earned card from last time survives untouched). Receipts exist only when earned - never
//     a nag.
//   - Otherwise: a <=8-line box() card ("CONTEXTKIT . session receipts", one plain-English
//     line per non-zero stat, a closing line from lastSession.note if present). Printed AND
//     written to .contextkit/last-recap.txt.
//   - Fails open: any error means silence, exit 0.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  readStdinJson,
  loadConfig,
  loadJourney,
  journeyProgress,
  eventsPath,
  projectDir,
} from "./lib/state.mjs";
import { box } from "./lib/term.mjs";

export const recapPath = (cwd) => join(projectDir(cwd), "last-recap.txt");

function readEvents(cwd) {
  let raw = "";
  try {
    raw = readFileSync(eventsPath(cwd), "utf8");
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// events strictly AFTER the last session-start marker: this session's activity only.
// No session-start on file at all (a pre-recap events.jsonl): treat the whole file as
// "this session" rather than showing nothing.
function thisSession(events) {
  let lastStart = -1;
  events.forEach((e, i) => {
    if (e.type === "session-start") lastStart = i;
  });
  return events.slice(lastStart + 1);
}

// the session-start event that opened THIS session (the last one on file) - its `done`
// field, if present, is the done-count snapshot recap compares against.
function lastSessionStart(events) {
  let last = null;
  for (const e of events) if (e.type === "session-start") last = e;
  return last;
}

function countStats(events) {
  const lessonIds = events.filter((e) => e.type === "lesson" && e.id).map((e) => e.id);
  const cards = events.filter((e) => e.type === "card").length;
  const clarityBlocks = events.filter((e) => e.type === "clarity-block").length;
  const overrides = events.filter((e) => e.type === "clarity-override").length;
  // armed -> cleared pairs: only counts a clear that actually followed an arm, so a
  // clear firing with nothing pending (shouldn't happen, but fail-open by intent) never
  // inflates the count.
  let armed = false;
  let pairs = 0;
  for (const e of events) {
    if (e.type === "clarity-armed") armed = true;
    else if (e.type === "clarity-cleared") {
      if (armed) pairs++;
      armed = false;
    } else if (e.type === "clarity-override") armed = false; // skipped the round - not a caught pair, and stops a later unrelated --confirm's clarity-cleared from double-counting it
  }
  return { lessonIds, cards, clarityBlocks, overrides, pairs };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function buildLines(cwd) {
  const allEvents = readEvents(cwd);
  const events = thisSession(allEvents);
  const { lessonIds, cards, clarityBlocks, overrides, pairs } = countStats(events);

  const journey = loadJourney(cwd);
  const { done, total } = journey ? journeyProgress(journey) : { done: 0, total: 0 };

  const zeroCounted =
    pairs === 0 && clarityBlocks === 0 && overrides === 0 && lessonIds.length === 0 && cards === 0;

  // Earned-only gate for the journey line: done increased since this session's own
  // session-start snapshot, or - no snapshot on file (an older events.jsonl) - fall back to
  // "at least one counted event fired this session".
  const startEvent = lastSessionStart(allEvents);
  const hasSnapshot = Boolean(startEvent) && typeof startEvent.done === "number";
  const journeyEarned = hasSnapshot ? done > startEvent.done : !zeroCounted;
  const showJourney = journeyEarned && journey && total > 0;
  const note = showJourney ? journey?.lastSession?.note : null;

  if (zeroCounted && !showJourney) return null; // receipts only when earned

  const stats = [];
  if (pairs > 0)
    stats.push(`${plural(pairs, "blind build")} caught before ${pairs === 1 ? "it" : "they"} started`);
  if (clarityBlocks > 0) stats.push(`${plural(clarityBlocks, "edit")} paused until the goal was confirmed`);
  if (overrides > 0)
    stats.push(`${plural(overrides, "time")} you said "just do it" and skipped the round`);
  if (lessonIds.length > 0)
    stats.push(`${plural(lessonIds.length, "power move")} learned: ${lessonIds.join(", ")}`);
  if (cards > 0) stats.push(`${plural(cards, "learning card")} on what you built and why`);
  if (showJourney)
    stats.push(total > 0 && done === total ? `all ${total} steps shipped` : `step ${done} of ${total} shipped`);

  if (!stats.length && !note) return null; // nothing to actually show, even if a journey exists

  // safety cap: title + border top/bottom = 3 lines already, so keep stat/note lines to
  // 5 or fewer (total stays <=8) even in the rare session where every stat fires at once.
  let lines = ["CONTEXTKIT · session receipts", ...stats];
  if (note) {
    if (lines.length >= 6) lines = lines.slice(0, 5);
    lines.push(note);
  } else if (lines.length > 6) {
    lines = lines.slice(0, 6);
  }
  return lines;
}

function main() {
  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();
  const config = loadConfig();
  if (config.recap === false) return;

  const lines = buildLines(cwd);
  if (!lines) return;

  const card = box(lines);
  try {
    mkdirSync(projectDir(cwd), { recursive: true });
    writeFileSync(recapPath(cwd), card + "\n");
  } catch {
    // best-effort persistence; still print below if we can
  }
  console.log("\n" + card + "\n");
}

try {
  main();
} catch {
  // fail open: never a broken session over a recap card
}
