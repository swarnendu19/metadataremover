#!/usr/bin/env node
// SessionStart hook: the contextkit Navigator. Never a blank terminal.
//
// - With a roadmap (.contextkit/journey.json): a HUD - project, progress bar, where you
//   left off, and the next move.
// - With only the install interview (.contextkit/seed.json): points at /start, which
//   already knows the answers.
// - With nothing: the classic mascot greeting + how to begin.
//
// Output goes into the session context, so the last line always re-anchors the rules.
// Fails open: any error falls back to the plain greeting.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  readStdinJson,
  readJson,
  seedPath,
  loadJourney,
  journeyProgress,
  bumpSession,
  appendEvent,
} from "./lib/state.mjs";
import { bar, box } from "./lib/term.mjs";

const RULES =
  "contextkit: ask first . be direct . plan . one step . prove it . review . no slop";
const command = (name) => (process.env.CONTEXTKIT_HOST === "codex" ? "$" + name : "/" + name);

function classicGreeting() {
  let art = "";
  try {
    art = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "mascot.txt"),
      "utf8",
    );
  } catch {}
  if (art.trim()) console.log(art.replace(/\s+$/, ""));
  console.log("\n  CONTEXTKIT  -  build and ship without the AI slop");
  console.log("  " + RULES);
  console.log(`  New thing -> ${command("start")}   New screen -> ${command("design-intake")}   How it works -> ${command("tour")}\n`);
}

function main() {
  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();

  bumpSession();

  const journey = loadJourney(cwd);
  const seed = readJson(seedPath(cwd), null);

  // Snapshot this session's starting done-count so recap.mjs can tell earned progress
  // (done increased since this session opened) apart from a stale card left over from last
  // time. No journey yet: leave `done` absent, same as an old events file predates this field.
  const startEvent = { type: "session-start", source: payload.source || "startup" };
  if (journey && (journey.steps || []).length) startEvent.done = journeyProgress(journey).done;
  appendEvent(cwd, startEvent);

  // First Build course in flight: that is the session's headline. The module files
  // carry their own resume logic; this box just makes sure no learner opens a session
  // and forgets they were mid-course.
  const course = readJson(join(cwd, ".contextkit", "course-progress.json"), null);
  if (course && course.course === "first-build" && !(course.status === "complete" && course.module >= 6)) {
    const resuming = course.status !== "complete";
    const next = resuming ? course.module : course.module + 1;
    console.log(
      "\n" +
        box([
          "CONTEXTKIT  ·  First Build",
          resuming
            ? `Module ${course.module}, beat ${course.beat}: "${course.title}" is where you left off.`
            : `Module ${course.module} done. Module ${next} is ready when you are.`,
          "Say \"continue the course\" or run: contextkit learn",
        ]) +
        "\n  " +
        RULES +
        "\n",
    );
    return;
  }

  if (journey && (journey.steps || []).length) {
    const { done, total, current } = journeyProgress(journey);
    const name = journey.project || "your project";
    const finished = total > 0 && done === total;

    const lines = [
      `CONTEXTKIT  ·  ${name}`,
      finished
        ? `${bar(done, total)}  all ${total} steps done  ·  time to /ship`
        : `${bar(done, total)}  step ${Math.min(done + 1, total)} of ${total}  ·  ${current ? current.title : "pick the next step"}`,
    ];
    if (journey.lastSession?.note) lines.push(`Last time: ${journey.lastSession.note}`);
    lines.push(
      finished
        ? `Next: ${command("ship")} to go live, or ${command("start")} to plan what's next`
        : `Next: ${command("step")} to continue  ·  ${command("check")} to prove the last one`,
    );

    console.log("\n" + box(lines) + "\n  " + RULES + "\n");
    return;
  }

  if (seed) {
    const project = seed.project ? `"${seed.project}"` : "your project";
    console.log(
      "\n" +
        box([
          "CONTEXTKIT  ·  ready when you are",
          `Your install answers are saved. Next up: ${project}.`,
          `Type ${command("start")} - it already knows the basics and will`,
          "ask the few questions that matter, then plan the road.",
        ]) +
        "\n  " +
        RULES +
        "\n",
    );
    return;
  }

  classicGreeting();
}

try {
  main();
} catch {
  try {
    classicGreeting();
  } catch {}
}
