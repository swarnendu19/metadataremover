#!/usr/bin/env node
// contextkit celebrate: the outcome machine's climax. /ship calls this ONLY after the live
// URL has actually returned 200, so every time this runs it means something real just
// happened - their thing is on the internet.
//
//   contextkit celebrate --url <live-url>
//
// TTY: a short fireworks burst (fixed count of setTimeout frames, ~1.5s total - never a
// loop that could hang a terminal), then the mascot + the URL in a box + one honest stat
// line if there's a journey to point at.
// Non-TTY (piped, CI, called as a subprocess from /ship or a script): the exact same final
// content as a single static frame, no timers - cheap and deterministic to call from
// anywhere. Always exits 0 once a URL is given.
//
// --url is required. Missing it is the one usage error: one line, exit 1.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { box, bold, dim, violet, coral } from "../hooks/lib/term.mjs";
import { loadJourney, journeyProgress, loadProfile } from "../hooks/lib/state.mjs";

const args = process.argv.slice(2);
const urlAt = args.indexOf("--url");
const url = urlAt > -1 ? args[urlAt + 1] : null;

if (!url) {
  console.log("usage: contextkit celebrate --url <live-url>");
  process.exit(1);
}

const NO_COLOR = Boolean(process.env.NO_COLOR) || process.env.TERM === "dumb";
const TTY = Boolean(process.stdout.isTTY) && !NO_COLOR;
const TRUECOLOR =
  TTY && (/truecolor|24bit/i.test(process.env.COLORTERM || "") || Boolean(process.env.WT_SESSION));

// the real mascot: bot-2 as truecolor half-block pixel art, same asset watch.mjs and
// install.mjs read. Falls back to the plain ASCII render on terminals without truecolor,
// or when there's no TTY to paint into at all.
let BOT = null;
try {
  BOT = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "bot.json"), "utf8"),
  );
} catch {
  // no mascot asset: the celebration still works, it's just a little quieter
}

function mascotLines() {
  if (!BOT) return [];
  if (TRUECOLOR) return BOT.small?.frames?.pulse || BOT.small?.frames?.idle || [];
  return BOT.mono || [];
}

// One honest stat line, only when there's a real journey and profile to point at.
// Fails open: missing or corrupt state just means no stat line, never a crash.
function statLine(cwd) {
  try {
    const journey = loadJourney(cwd);
    if (!journey) return null;
    const { done, total } = journeyProgress(journey);
    if (!total) return null;
    const sessions = loadProfile().sessions || 0;
    if (!sessions) return null;
    const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
    const stepLine = done === total ? plural(total, "step") : `${done} of ${total} steps`;
    return `${plural(sessions, "session")} · ${stepLine} · built with contextkit`;
  } catch {
    return null;
  }
}

function finalFrame() {
  const lines = [...mascotLines()];
  if (lines.length) lines.push("");
  lines.push(bold(violet("It's live.")));
  lines.push(box([url]));
  const stat = statLine(process.cwd());
  if (stat) lines.push(dim(stat));
  return lines.join("\n");
}

function printFinal() {
  console.log("\n" + finalFrame() + "\n");
}

if (!TTY) {
  printFinal();
  process.exit(0);
}

// ---- TTY: a short fireworks burst, then the same final frame everyone else sees ----
const SPARKS = ["·", "✦", "✧", "*", "'", "+"];
const COLORS = [violet, coral];

function sparkLine(seed) {
  const width = Math.min(process.stdout.columns || 60, 60);
  let line = "";
  for (let i = 0; i < width; i++) {
    if (Math.random() < 0.14) {
      const ch = SPARKS[(seed + i) % SPARKS.length];
      const paint = COLORS[(seed + i) % COLORS.length];
      line += paint(ch);
    } else {
      line += " ";
    }
  }
  return line;
}

const FRAMES = 9;
const FRAME_MS = 170; // 9 frames * ~170ms ~= 1.5s total, then it settles

function tick(n) {
  if (n >= FRAMES) {
    process.stdout.write("\x1b[2K\r");
    printFinal();
    process.exit(0);
    return;
  }
  process.stdout.write("\x1b[2K\r" + sparkLine(n));
  setTimeout(() => tick(n + 1), FRAME_MS);
}

// A short celebratory dance before the fireworks. Truecolor TTYs only; a plainer
// terminal just skips to the sparks. Ctrl+C aborts cleanly, cursor restored. It is
// self-contained: if the dance module is missing for any reason, we still celebrate.
async function celebrationDance() {
  if (!TRUECOLOR) return;
  let dance;
  try {
    dance = await import("./dance.mjs");
  } catch {
    return;
  }
  const { frameRGBAt, renderAnsi, H: DH } = dance;
  const fps = 30, seconds = 2.4;
  const blockLines = DH / 2;
  const onSig = () => { process.stdout.write("\x1b[?25h\n"); process.exit(0); };
  process.once("SIGINT", onSig);
  process.stdout.write("\x1b[?25l");
  const started = Date.now();
  let first = true;
  try {
    while (true) {
      const t = (Date.now() - started) / 1000;
      if (t >= seconds) break;
      let out = "\x1b[?2026h";
      if (!first) out += `\x1b[${blockLines}A`;
      first = false;
      out += renderAnsi(frameRGBAt(t)) + "\n\x1b[?2026l";
      process.stdout.write(out);
      await new Promise((r) => setTimeout(r, Math.max(0, 1000 / fps - ((Date.now() - started) % (1000 / fps)))));
    }
  } finally {
    process.removeListener("SIGINT", onSig);
    process.stdout.write("\x1b[?25h\n"); // restore cursor; the sparks print below
  }
}

await celebrationDance();
tick(0);
