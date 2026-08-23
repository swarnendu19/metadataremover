// Tiny terminal styling for hook output. Zero dependencies (hooks run without node_modules).
//
// Colors auto-disable when stdout is not a TTY. Hook stdout is piped into Claude Code
// (and can land in the model's context), so in practice hooks emit clean plain text with
// unicode structure (boxes, bars), and colors only light up when a human runs them directly.

const on =
  process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";

const wrap = (open, close) => (s) => (on ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const violet = wrap(35, 39); // brand-ish in 16-color land
export const coral = wrap(91, 39);
export const green = wrap(32, 39);
export const red = wrap(31, 39);

// ▓▓▓▓░░░░ progress bar
export function bar(done, total, width = 14) {
  if (!total) return "░".repeat(width);
  const filled = Math.round((done / total) * width);
  return "▓".repeat(Math.min(filled, width)) + "░".repeat(Math.max(width - filled, 0));
}

// A clean box. Lines are plain strings; long lines are truncated, short ones padded.
export function box(lines, innerWidth = 56) {
  const clip = (s) =>
    s.length > innerWidth ? s.slice(0, innerWidth - 1) + "…" : s.padEnd(innerWidth);
  const top = "┌" + "─".repeat(innerWidth + 2) + "┐";
  const bottom = "└" + "─".repeat(innerWidth + 2) + "┘";
  return [top, ...lines.map((l) => "│ " + clip(l) + " │"), bottom].join("\n");
}
