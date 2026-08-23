// The core rule as a marker-fenced block. Zero dependencies on purpose: this ships in the
// engine copy (no node_modules) and is shared by the installer, `contextkit remove`, and doctor.
//
// The markers make three things trivially safe: idempotent re-install (replace in place),
// clean uninstall (strip exactly our block), and doctor's "is the rule actually here?" check.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const MARK_START = "<!-- contextkit:rules:start -->";
export const MARK_END = "<!-- contextkit:rules:end -->";

// kitDir: the directory that holds the kit's AGENTS.md (package root or the engine copy)
export function ruleBlock(kitDir) {
  const body = readFileSync(join(kitDir, "AGENTS.md"), "utf8").trim();
  return `${MARK_START}\n${body}\n${MARK_END}`;
}

// How the markers sit in this text: "none" (no markers), "valid" (exactly one start,
// one end, in order), or "malformed" (stray / duplicated / reversed markers).
// Malformed files are NEVER sliced - surgery on bad markers eats user content.
export function markerState(text) {
  if (typeof text !== "string" || !text) return "none";
  const starts = text.split(MARK_START).length - 1;
  const ends = text.split(MARK_END).length - 1;
  if (starts === 0 && ends === 0) return "none";
  if (starts === 1 && ends === 1 && text.indexOf(MARK_START) < text.indexOf(MARK_END)) return "valid";
  return "malformed";
}

export function hasRule(text) {
  return markerState(text) === "valid";
}

export function upsertRule(text, kitDir) {
  const block = ruleBlock(kitDir);
  if (!text || !text.trim()) return block + "\n";
  const state = markerState(text);
  if (state === "malformed") return text; // defense in depth: callers should check first
  if (state === "valid") {
    const start = text.indexOf(MARK_START);
    const end = text.indexOf(MARK_END) + MARK_END.length;
    return text.slice(0, start) + block + text.slice(end);
  }
  return text.replace(/\s*$/, "") + "\n\n" + block + "\n";
}

export function stripRule(text) {
  if (markerState(text) !== "valid") return text;
  const start = text.indexOf(MARK_START);
  const end = text.indexOf(MARK_END) + MARK_END.length;
  const before = text.slice(0, start).replace(/\n+$/, "\n");
  const after = text.slice(end).replace(/^\n+/, "\n");
  const joined = (before + after).trim();
  return joined ? joined + "\n" : "";
}

// Old releases (v0.3 and any future ones we outgrow) shipped the rule as a bare unfenced
// copy of their contemporary kit AGENTS.md. legacy/*.md holds those old bodies byte-exact so
// a match here is still possible after the current AGENTS.md text moves on (e.g. Rule 3
// joining Rule 1 + 2). Read live, not hardcoded, so this stays right if legacy/ grows.
const LEGACY_BODY_FILES = ["agents-0.3.md"];

function legacyBodies(kitDir) {
  const bodies = [];
  for (const name of LEGACY_BODY_FILES) {
    try {
      bodies.push(readFileSync(join(kitDir, "legacy", name), "utf8").replace(/\r\n/g, "\n").trim());
    } catch {
      // fail-open: an engine copy without legacy/ (or missing this one file) just can't
      // match that old body - no crash, migrateUnfenced simply falls through to null.
    }
  }
  return bodies;
}

// Splice `replacementBody`, fenced, in place of the `foundBody` slice at `idx` in `nText`.
function fenceInPlace(nText, idx, foundBody, replacementBody) {
  const before = nText.slice(0, idx).replace(/\n+$/, "\n");
  const after = nText.slice(idx + foundBody.length).replace(/^\n+/, "\n");
  const block = `${MARK_START}\n${replacementBody}\n${MARK_END}`;
  return ((before.trim() ? before + "\n" : "") + block + (after.trim() ? "\n" + after : "")).trim() + "\n";
}

// v0.3 (and older) shipped the rule as a bare unfenced copy of THEIR kit AGENTS.md. If this
// text contains that exact body (CRLF-tolerant), fence it in place - upgrading a legacy body
// to the CURRENT rules as it goes, not just wrapping the old text, so a v0.3 customer's file
// ends up with today's rules (Rule 3 included), not yesterday's. Returns the migrated text,
// or null when no exact copy (current or legacy) is found.
export function migrateUnfenced(text, kitDir) {
  const nText = String(text || "").replace(/\r\n/g, "\n");
  const currentBody = readFileSync(join(kitDir, "AGENTS.md"), "utf8").replace(/\r\n/g, "\n").trim();

  const currentIdx = nText.indexOf(currentBody);
  if (currentIdx !== -1) return fenceInPlace(nText, currentIdx, currentBody, currentBody);

  for (const legacyBody of legacyBodies(kitDir)) {
    const idx = nText.indexOf(legacyBody);
    if (idx !== -1) return fenceInPlace(nText, idx, legacyBody, currentBody);
  }

  return null;
}

// True when the kit AGENTS.md's first line (read live, trimmed) appears in text.
// Catches user-edited old copies that no longer match migrateUnfenced byte-for-byte.
export function looksLikeOldRule(text, kitDir) {
  const firstLine = readFileSync(join(kitDir, "AGENTS.md"), "utf8").split(/\r?\n/)[0].trim();
  if (!firstLine) return false;
  return String(text || "").includes(firstLine);
}
