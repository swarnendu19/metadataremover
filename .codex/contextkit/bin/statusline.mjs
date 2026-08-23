#!/usr/bin/env node
// contextkit statusline: the navigator, always on screen.
//
// Claude Code spawns this on event-driven updates (after each assistant message, /compact,
// permission-mode changes - debounced at 300ms; we deliberately leave refreshInterval unset
// per the docs' own guidance, since everything this line shows changes on those same events)
// and prints whatever it writes to stdout, verbatim, in the terminal's status line. It receives
// a JSON payload on stdin (model, workspace incl. current dir, cost, context_window...).
//
// Color note: this process's own stdout is a pipe (not a tty), so term.mjs's isTTY-gated
// wrappers - correctly conservative for hooks, whose stdout can land in the model's context -
// would always render plain here. That's the wrong call for a line a human reads in their
// own terminal, so color here is decided by the same environment truecolor hints install.mjs
// already uses (COLORTERM, Windows Terminal's WT_SESSION), not isTTY.
//
// Fail open, always: config off, no journey, or any error all mean an empty line - never a
// broken status line.
//
//   echo '{"workspace":{"current_dir":"..."}}' | node bin/statusline.mjs
import {
  readStdinJson,
  loadConfig,
  loadJourney,
  journeyProgress,
  clarityArmed,
} from "../hooks/lib/state.mjs";
import { bar } from "../hooks/lib/term.mjs";

const NO_COLOR = Boolean(process.env.NO_COLOR) || process.env.TERM === "dumb";
const TRUECOLOR =
  !NO_COLOR && (/truecolor|24bit/i.test(process.env.COLORTERM || "") || Boolean(process.env.WT_SESSION));

const VIOLET = [0x6c, 0x4d, 0xf6];
const CORAL = [0xff, 0x6a, 0x4d];
const paint = ([r, g, b], s) => (TRUECOLOR ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m` : s);
const dimmed = (s) => (TRUECOLOR ? `\x1b[2m${s}\x1b[22m` : s);

function render() {
  const payload = readStdinJson();
  const cwd = payload.workspace?.current_dir || payload.cwd || process.cwd();
  const config = loadConfig();
  if (config.statusline === false) return "";

  const glyph = paint(VIOLET, "⬢");
  const journey = loadJourney(cwd);
  const hasSteps = Boolean(journey && Array.isArray(journey.steps) && journey.steps.length > 0);

  let body;
  if (!hasSteps) {
    body = "ready · /start to plan";
  } else {
    const { done, total, current } = journeyProgress(journey);
    const project = journey.project || "project";
    if (!current) {
      body = `${project} · all ${total} steps done · time to /ship`;
    } else {
      const step = done + 1;
      const title = String(current.title || "").slice(0, 24);
      body = `${project} · ${bar(done, total)} step ${step} of ${total} · ${title}`;
    }
  }

  let line = `${glyph} contextkit · ${body}`;
  if (clarityArmed(cwd)) line += paint(CORAL, " · asking first");
  if (config.tutor === false) line += dimmed(" · tutor off");
  return line;
}

try {
  const line = render();
  if (line) process.stdout.write(line);
} catch {
  // fail open: never a broken status line
}
