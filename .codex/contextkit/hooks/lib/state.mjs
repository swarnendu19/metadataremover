// contextkit state layer. Zero dependencies on purpose: hooks run from the copied engine
// (~/.claude/contextkit or ./.claude/contextkit) where there is no node_modules.
//
// Three stores, all fail-open (a missing or corrupt file never breaks a session):
//
//   ~/.contextkit/config.json    user toggles     { tutor: true, clarity: "strict" }
//   ~/.contextkit/profile.json   user memory      { installed, sessions, lessonsTaught: {} }
//   ./.contextkit/seed.json      install answers  { agent, level, goal, project }
//   ./.contextkit/journey.json   project roadmap  { project, steps: [], decisions: [], lastSession }
//   ./.contextkit/events.jsonl   live feed for `contextkit watch`

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  appendFileSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";

// ---- paths ----
// CONTEXTKIT_HOME overrides where user-level state lives (used by the benchmark to give
// every test arm a virgin profile; handy for CI too). Default: ~/.contextkit
export const userDir = () => process.env.CONTEXTKIT_HOME || join(homedir(), ".contextkit");
export const projectDir = (cwd = process.cwd()) => join(cwd, ".contextkit");

export const configPath = () => join(userDir(), "config.json");
export const profilePath = () => join(userDir(), "profile.json");
export const seedPath = (cwd) => join(projectDir(cwd), "seed.json");
export const journeyPath = (cwd) => join(projectDir(cwd), "journey.json");
export const eventsPath = (cwd) => join(projectDir(cwd), "events.jsonl");

// ---- primitives ----
export function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJson(path, data) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = path + ".tmp";
    writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
    renameSync(tmp, path);
    return true;
  } catch {
    return false;
  }
}

// Hooks receive a JSON payload on stdin from Claude Code. Never blocks on a TTY.
export function readStdinJson() {
  try {
    if (process.stdin.isTTY) return {};
    const raw = readFileSync(0, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ---- config (user toggles) ----
export const CONFIG_DEFAULTS = { version: 1, tutor: true, clarity: "strict", slop: "notify", cards: true };

export function loadConfig() {
  return { ...CONFIG_DEFAULTS, ...(readJson(configPath(), {}) || {}) };
}

export function saveConfig(patch) {
  const next = { ...loadConfig(), ...patch };
  writeJson(configPath(), next);
  return next;
}

// ---- profile (user memory: teach once, count sessions) ----
export function loadProfile() {
  return {
    version: 1,
    installed: null,
    sessions: 0,
    lessonsTaught: {},
    ...(readJson(profilePath(), {}) || {}),
  };
}

export function saveProfile(profile) {
  return writeJson(profilePath(), profile);
}

export function bumpSession() {
  const p = loadProfile();
  p.sessions = (p.sessions || 0) + 1;
  p.lastSeen = new Date().toISOString().slice(0, 10);
  saveProfile(p);
  return p;
}

export function lessonTaught(id) {
  return Boolean(loadProfile().lessonsTaught?.[id]);
}

export function markLesson(id) {
  const p = loadProfile();
  p.lessonsTaught = p.lessonsTaught || {};
  p.lessonsTaught[id] = new Date().toISOString().slice(0, 10);
  saveProfile(p);
}

// ---- journey (project roadmap the Navigator reads) ----
export function loadJourney(cwd) {
  return readJson(journeyPath(cwd), null);
}

export function saveJourney(cwd, journey) {
  return writeJson(journeyPath(cwd), journey);
}

export function journeyProgress(journey) {
  const steps = journey?.steps || [];
  const done = steps.filter((s) => s.status === "done").length;
  const current =
    steps.find((s) => s.status === "in-progress") ||
    steps.find((s) => s.status === "todo") ||
    null;
  return { done, total: steps.length, current };
}

// ---- clarity flag (read-only mirror of .contextkit/clarity.json's 30-minute-expiry
// semantics). clarity.mjs owns arming/clearing/mutating the flag; this is the ONE place the
// other two readers - the statusline and `contextkit watch` - ask "is the lock armed right
// now", so they never drift into disagreeing with each other about the expiry. ----
const CLARITY_EXPIRE_MS = 30 * 60 * 1000;
export const clarityFlagPath = (cwd) => join(projectDir(cwd), "clarity.json");

export function clarityArmed(cwd) {
  const flag = readJson(clarityFlagPath(cwd), null);
  if (!flag?.pending) return false;
  return Date.now() - (flag.since || 0) <= CLARITY_EXPIRE_MS;
}

// ---- events (the live feed `contextkit watch` renders) ----
export function appendEvent(cwd, event) {
  try {
    const path = eventsPath(cwd);
    mkdirSync(dirname(path), { recursive: true });
    // keep the feed small; watch only needs the recent past
    try {
      if (statSync(path).size > 512 * 1024) writeFileSync(path, "");
    } catch {}
    appendFileSync(path, JSON.stringify({ ts: Date.now(), ...event }) + "\n");
    return true;
  } catch {
    return false;
  }
}
