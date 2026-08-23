#!/usr/bin/env node
// The contextkit tutor: teaches a Claude Code power move at the exact moment it is needed,
// once each, then stays quiet forever. The engineered "I didn't know it could do this."
//
// Sensors (UserPromptSubmit + PreCompact + SessionStart):
//   plan-mode              feature-sized request
//   checkpoints            3+ frustrated prompts in a row
//   thinking               stuck-on-a-hard-bug phrasing
//   screenshots            visual bug described in words
//   subagents              whole-project sweep language
//   connect-mcp            external service mention
//   hooks                  automation / workflow ask
//   build-your-own-skill   describing a repeated ritual
//   context-hygiene        session about to compact (PreCompact)
//   resume-memory          3+ sessions with a roadmap (SessionStart)
//
// Discipline (this is what keeps it magic instead of a nag):
//   - at most ONE lesson per prompt, and never on a prompt the clarity engine is handling
//   - each lesson fires ONCE per user, ever (tracked in ~/.contextkit/profile.json)
//   - lesson text lives in curriculum/*.md - editable words, no code changes
//   - `contextkit tutor off` silences everything
//   - fails open: any error means silence, never a broken session

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  readStdinJson,
  readJson,
  writeJson,
  projectDir,
  loadConfig,
  lessonTaught,
  markLesson,
  appendEvent,
} from "./lib/state.mjs";
import {
  isVagueBuild,
  isFeatureSized,
  STUCK,
  FRUSTRATION,
  VISUAL_WORDS,
  MENTIONS_IMAGE,
  BIG_SWEEP,
  EXTERNAL_SERVICE,
  AUTOMATION,
  REPEATED_RITUAL,
} from "./lib/heuristics.mjs";
import { loadProfile, loadJourney } from "./lib/state.mjs";
import { recordConcept } from "./lib/concepts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const memoPath = (cwd) => join(projectDir(cwd), "tutor.json"); // rolling counters, per project

// Each moment-lesson is also a concept in the learner's knowledge graph. This table maps the 10
// lesson ids to their human name and a couple of related concepts, so a taught lesson lands in
// .contextkit/concepts.json the same way a course concept does (see hooks/lib/concepts.mjs).
const LESSON_CONCEPTS = {
  "plan-mode": { name: "Plan Mode", related: ["Think Harder"] },
  thinking: { name: "Think Harder", related: ["Plan Mode"] },
  checkpoints: { name: "Rewind", related: ["Interrupt & Steer"] },
  "context-hygiene": { name: "Fresh Head", related: ["Pick Up Where You Left Off"] },
  screenshots: { name: "Paste Screenshots", related: [] },
  "resume-memory": { name: "Pick Up Where You Left Off", related: ["Permanent Notes"] },
  "connect-mcp": { name: "Connect Your Tools", related: ["Subagents"] },
  subagents: { name: "Subagents", related: ["Web Search"] },
  hooks: { name: "Hooks", related: ["Save It As A Skill"] },
  "build-your-own-skill": { name: "Save It As A Skill", related: ["Hooks"] },
};

function teach(cwd, id) {
  let text = "";
  try {
    const codexLesson = join(HERE, "..", "curriculum", "codex", `${id}.md`);
    const lesson = process.env.CONTEXTKIT_HOST === "codex" && existsSync(codexLesson)
      ? codexLesson
      : join(HERE, "..", "curriculum", `${id}.md`);
    text = readFileSync(lesson, "utf8").trim();
  } catch {
    return false; // no words, no lesson
  }
  markLesson(id);
  appendEvent(cwd, { type: "lesson", id });
  // record it in the knowledge graph too (fail-open: a graph error never breaks the lesson)
  const concept = LESSON_CONCEPTS[id];
  if (concept) recordConcept(cwd, concept.name, { related: concept.related });
  console.log(text);
  return true;
}

function onPrompt(payload, cwd) {
  const prompt = String(payload.prompt || "");
  if (!prompt || prompt.startsWith("/")) return;
  if (isVagueBuild(prompt)) return; // the clarity engine owns this prompt; never stack voices

  // rolling frustration counter (per project)
  const memo = readJson(memoPath(cwd), {}) || {};
  memo.frustration = FRUSTRATION.test(prompt) ? (memo.frustration || 0) + 1 : 0;
  writeJson(memoPath(cwd), memo);

  // one lesson max, most specific first
  if (memo.frustration >= 3 && !lessonTaught("checkpoints")) return void teach(cwd, "checkpoints");
  if (STUCK.test(prompt) && !lessonTaught("thinking")) return void teach(cwd, "thinking");
  if (VISUAL_WORDS.test(prompt) && !MENTIONS_IMAGE.test(prompt) && !lessonTaught("screenshots"))
    return void teach(cwd, "screenshots");
  if (BIG_SWEEP.test(prompt) && !lessonTaught("subagents")) return void teach(cwd, "subagents");
  if (EXTERNAL_SERVICE.test(prompt) && !lessonTaught("connect-mcp")) return void teach(cwd, "connect-mcp");
  if (AUTOMATION.test(prompt) && !lessonTaught("hooks")) return void teach(cwd, "hooks");
  if (REPEATED_RITUAL.test(prompt) && !lessonTaught("build-your-own-skill"))
    return void teach(cwd, "build-your-own-skill");
  if (isFeatureSized(prompt) && !lessonTaught("plan-mode")) return void teach(cwd, "plan-mode");
}

// third-or-later session in a project with a roadmap: teach continuity once
function onSessionStart(cwd) {
  if (lessonTaught("resume-memory")) return;
  if ((loadProfile().sessions || 0) < 3) return;
  if (!loadJourney(cwd)) return;
  teach(cwd, "resume-memory");
}

try {
  const payload = readStdinJson();
  const cwd = payload.cwd || process.cwd();
  if (!loadConfig().tutor) process.exit(0);

  if (payload.hook_event_name === "UserPromptSubmit") onPrompt(payload, cwd);
  else if (payload.hook_event_name === "SessionStart") onSessionStart(cwd);
  else if (payload.hook_event_name === "PreCompact" && !lessonTaught("context-hygiene"))
    teach(cwd, "context-hygiene");
} catch {
  // fail open
}
