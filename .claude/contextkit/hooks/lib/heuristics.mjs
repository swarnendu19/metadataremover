// Shared prompt heuristics. Conservative on purpose: a sensor that fires wrongly
// gets the whole kit uninstalled. Used by clarity.mjs (the lock) and tutor.mjs (the coach).

export const BUILD = /\b(build|make|create|add|implement|design|redesign|rewrite|refactor|revamp|develop|set ?up|generate|launch)\b/i;
export const VAGUE = /\b(nice|nicer|better|good|great|modern|clean|simple|cool|pretty|beautiful|professional|awesome|improve|enhance|fancy|sleek|polished)\b/i;
export const SCOPE = /\b(app|application|website|site|page|dashboard|feature|system|platform|tool|bot|store|shop|game|portfolio|landing)\b/i;
export const SPECIFIC = /[\/\\]|\.[a-z]{2,4}\b|`|"[^"]{3,}"|\b\d{2,}\b/i; // paths, filenames, quotes, real numbers
export const QUESTION = /^\s*(how|what|why|where|when|which|should|can|could|is|are|do|does|will|would)\b|\?\s*$/i;

const sentenceCount = (prompt) => prompt.split(/[.!?\n]/).filter((s) => s.trim()).length;

// vague + feature-sized: the clarity engine's trigger
export function isVagueBuild(prompt) {
  if (!prompt || prompt.startsWith("/") || QUESTION.test(prompt)) return false;
  if (SPECIFIC.test(prompt) && prompt.length > 200) return false; // long + concrete = they did the work
  // several plain-English sentences without vague words = they described it; don't lock them
  if (prompt.length > 150 && sentenceCount(prompt) >= 2 && !VAGUE.test(prompt)) return false;
  return BUILD.test(prompt) && (VAGUE.test(prompt) || (SCOPE.test(prompt) && !SPECIFIC.test(prompt)));
}

// big ask, vague or not: the plan-mode lesson's trigger
export function isFeatureSized(prompt) {
  if (!prompt || prompt.startsWith("/") || QUESTION.test(prompt)) return false;
  if (!BUILD.test(prompt)) return false;
  return prompt.length > 200 || (SCOPE.test(prompt) && sentenceCount(prompt) >= 2);
}

// debugging distress: the thinking lesson's trigger
export const STUCK = /\b(still (broken|not working|failing|wrong)|why (doesn'?t|isn'?t|won'?t|is)|can'?t figure|no idea|stuck|keeps? (crashing|failing|breaking))\b/i;

// repeated-failure phrasing: one strike toward the checkpoints lesson
export const FRUSTRATION = /\b(still|again|didn'?t work|not working|same (error|problem|issue)|broke|nope|worse)\b/i;

// describing visuals in words: the screenshot lesson's trigger
export const VISUAL_WORDS = /\b(looks? (wrong|off|bad|weird|ugly|broken)|misaligned|overlap|too (big|small|wide|narrow)|spacing|padding|centered|alignment|layout (is|looks)|font looks)\b/i;
export const MENTIONS_IMAGE = /\b(screenshot|image|picture|photo|attached|pasted)\b/i;

// whole-project sweeps: the subagents lesson's trigger
export const BIG_SWEEP = /\b(search|check|scan|audit|go through|look through|review|find)\b.{0,30}\b(whole|entire|every|all (the )?files|everywhere|codebase|whole project|entire project)\b|\bfind every\b/i;

// named external services: the connect-mcp lesson's trigger
export const EXTERNAL_SERVICE = /\b(stripe|paypal|database|postgres|supabase|firebase|mysql|mongodb|resend|sendgrid|mailchimp|figma|notion|linear|slack|airtable|shopify)\b/i;

// asking for automation: the hooks lesson's trigger
export const AUTOMATION = /\b(automatically (run|check|do|format|test|lint|build|deploy)|auto[- ]?run|can (it|you|claude) always|(make|set) (it|this) up so|(every time|each time|whenever) i \w+[^.?!]{0,40}\b(run|check|format|lint|test|build|deploy|remind|update|back ?up|commit|save)\b(?![^.?!]{0,30}\b(fails?|failing|crash(es|ing)?|breaks?|broken|freez(es|ing)?|errors?|nothing happens)\b))/i;

// describing a repeated ritual: the build-your-own-skill lesson's trigger
export const REPEATED_RITUAL = /\b(like (before|last time)|same as (before|last time)|again,? (like|the way) |the usual (way|routine))\b/i;
