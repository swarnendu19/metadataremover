#!/usr/bin/env node
// Anti-slop detector — scans a project for the specific code patterns that make a UI look
// AI-made (the catalog in reference/anti-slop-tells.md). Part of the contextkit.
//
// Zero dependencies. Usage:  node detect-slop.mjs [path]   (defaults to ".")
// Exit code 1 if any P1 (strong) tell is found, else 0 — so /design-check and CI can gate on it.
//
// This is the deterministic half. It catches what is measurable from source. The visual half
// (contrast in context, hierarchy, "does it look generic") is /design-check's screenshot pass.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = process.argv[2] || ".";
const MAX_PER_RULE = 40;

const CODE_EXT = new Set([".css", ".scss", ".sass", ".less", ".html", ".htm", ".tsx", ".jsx", ".ts", ".js", ".mjs", ".cjs", ".vue", ".svelte", ".astro"]);
const TEXT_EXT = new Set([".md", ".mdx", ".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".astro"]);
const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", ".next", "out", ".turbo", "coverage", ".cache", "vendor", ".svelte-kit"]);

// Each rule runs per line. `re` is a quick test; `fn(line)` is used when a numeric threshold
// is involved. `scope` decides which files it looks at. `file` rules run once over a whole file.
const LINE_RULES = [
  { id: "gradient-text", sev: "P1", scope: "code",
    re: /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text|\bbg-clip-text\b/i,
    fix: "Use a solid color. Show emphasis with weight or size, not gradient text." },

  { id: "side-stripe-border", sev: "P1", scope: "code",
    fn: (l) => {
      const m = l.match(/border-(?:left|right)\s*:\s*([\d.]+)px/i);
      if (m && parseFloat(m[1]) > 1) return true;
      return /\bborder-(?:l|r)-(?:2|4|8)\b/.test(l); // tailwind colored side stripe
    },
    fix: "Drop the colored side stripe (the #1 tell). Use a full hairline border, a 4-8% background tint, a leading number/glyph, or nothing." },

  { id: "violet-gradient", sev: "P1", scope: "code",
    fn: (l) => {
      if (/(?:linear|radial|conic)-gradient\([^)]*\b(purple|violet|indigo|fuchsia)\b/i.test(l)) return true;
      if (/\b(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d/.test(l)) return true;
      // models usually write hex, not color names - flag violet-hued hex inside a gradient
      if (/(?:linear|radial|conic)-gradient\(/i.test(l)) {
        for (const m of l.matchAll(/#([0-9a-f]{6})\b/gi)) {
          const n = parseInt(m[1], 16);
          const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
          if (!d) continue;
          let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
          h = (h * 60 + 360) % 360;
          if (h >= 245 && h <= 310 && d / max > 0.3) return true; // violet/purple/fuchsia band
        }
      }
      return false;
    },
    fix: "Lose the purple/violet gradient (the default AI palette). Pick one deliberate brand hue." },

  { id: "bounce-easing", sev: "P1", scope: "code",
    fn: (l) => {
      const m = l.match(/cubic-bezier\(\s*[-\d.]+\s*,\s*(-?[\d.]+)\s*,\s*[-\d.]+\s*,\s*(-?[\d.]+)\s*\)/);
      if (m && (parseFloat(m[1]) > 1 || parseFloat(m[1]) < 0 || parseFloat(m[2]) > 1 || parseFloat(m[2]) < 0)) return true;
      return /\b(elastic|easeOutBounce|easeInBounce|\bbounce\b)\b/i.test(l) && /(ease|transition|animat|spring|cubic|duration)/i.test(l);
    },
    fix: "No bounce/elastic. Use an ease-out curve, e.g. cubic-bezier(0.25, 1, 0.5, 1)." },

  { id: "disable-zoom", sev: "P1", scope: "code",
    re: /user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\.0)?\b/i,
    fix: "Never disable zoom. Remove user-scalable=no / maximum-scale=1 from the viewport meta." },

  { id: "zindex-9999", sev: "P1", scope: "code",
    fn: (l) => {
      const m = l.match(/z-index\s*:\s*(\d{4,})/);
      if (m && parseInt(m[1], 10) >= 9999) return true;
      return /\bz-\[\s*9{4,}\s*\]/.test(l);
    },
    fix: "No z-index: 9999. Use a small, semantic z-scale (rail/sticky/overlay/toast)." },

  { id: "overused-font", sev: "P2", scope: "code",
    re: /font-family\s*:[^;{]*\b(Inter|Roboto|Geist|Poppins|Montserrat|Plus Jakarta|Space Grotesk|Fraunces|Playfair|Nunito|Open Sans|Lato)\b|fonts\.googleapis\.com\/css2?\?family=(Inter|Roboto|Poppins|Montserrat|Open\+Sans|Lato|Nunito)|from\s+["']next\/font\/google["']|\b(Inter|Roboto|Poppins|Montserrat|Open_Sans|Lato|Nunito)\s*\(\s*\{/,
    fix: "Swap the reflex font for one with a voice (Pangram Pangram, Klim, Velvetyne). Pick from 3 brand words." },

  { id: "glassmorphism", sev: "P2", scope: "code",
    re: /backdrop-filter\s*:\s*blur|\bbackdrop-blur(?:-|\b)/i,
    fix: "Glass/blur should be rare and purposeful, not a default surface. Usually: remove it." },

  { id: "animate-layout-prop", sev: "P2", scope: "code",
    re: /transition\s*:[^;{]*\b(width|height|top|left|right|bottom|margin)\b|\btransition-all\b/i,
    fix: "Animate only transform/opacity (layout props cause jank). Replace transition-all with specific props." },

  { id: "tiny-font", sev: "P2", scope: "code",
    fn: (l) => {
      const m = l.match(/font-size\s*:\s*(\d{1,2})px/);
      if (m && parseInt(m[1], 10) < 14) return true;
      return /\btext-\[(?:1[0-3])px\]/.test(l); // tailwind text-[10px..13px]
    },
    fix: "Body text should be 16px (14px floor), in rem. Tiny text reads as cramped AI default." },

  { id: "crushed-tracking", sev: "P2", scope: "code",
    fn: (l) => {
      const m = l.match(/letter-spacing\s*:\s*(-0?\.\d+)em/);
      if (m && parseFloat(m[1]) <= -0.05) return true;
      return /tracking-\[-0?\.0[5-9]\d*em\]/.test(l);
    },
    fix: "Tracking tighter than -0.04em makes letters touch. Tighten optically, not destructively." },

  { id: "h-screen", sev: "P2", scope: "code",
    re: /\bh-screen\b|height\s*:\s*100vh\b/i,
    fix: "Use h-dvh / 100dvh, not h-screen / 100vh (which breaks on mobile browser chrome)." },

  { id: "icon-button-no-label", sev: "P2", scope: "code",
    re: /<button(?![^>]*aria-label)(?![^>]*>[^<]*[A-Za-z0-9])[^>]*>\s*<(?:svg|Icon|[A-Z]\w*Icon)/,
    fix: "Icon-only buttons need an aria-label. Add one." },

  { id: "buzzwords", sev: "P2", scope: "text",
    re: /\b(streamline|empower|supercharge|world-class|next-generation|seamless(?:ly)?|cutting-edge|unleash|revolutioni[sz]e|game-chang\w*|elevate your|unlock the power|take it to the next level|robust|leverage)\b/i,
    fix: "Cut the buzzword. Say what it literally does (a specific verb + noun)." },
];

// File-level rule: em-dash overuse in prose-bearing files.
function emDashRule(content) {
  const count = (content.match(/—/g) || []).length;
  return count > 3 ? count : 0;
}

const findings = []; // {sev,id,file,line,snippet,fix}
const truncated = {};
let filesScanned = 0;

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".") { /* allow dotfiles? skip hidden dirs */ }
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name) || e.name.startsWith(".")) continue;
      walk(full);
    } else if (e.isFile()) {
      const ext = extname(e.name).toLowerCase();
      if (!CODE_EXT.has(ext) && !TEXT_EXT.has(ext)) continue;
      scanFile(full, ext);
    }
  }
}

function add(sev, id, file, line, snippet, fix) {
  const n = findings.filter((f) => f.id === id).length;
  if (n >= MAX_PER_RULE) { truncated[id] = (truncated[id] || 0) + 1; return; }
  findings.push({ sev, id, file, line, snippet: snippet.trim().slice(0, 120), fix });
}

function scanFile(file, ext) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { return; }
  filesScanned++;
  const rel = relative(ROOT, file) || file;
  const lines = content.split(/\r?\n/);

  for (const rule of LINE_RULES) {
    if (rule.scope === "code" && !CODE_EXT.has(ext)) continue;
    if (rule.scope === "text" && !TEXT_EXT.has(ext)) continue;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const hit = rule.fn ? rule.fn(l) : rule.re.test(l);
      if (hit) add(rule.sev, rule.id, rel, i + 1, l, rule.fix);
    }
  }
  if (TEXT_EXT.has(ext)) {
    const c = emDashRule(content);
    // heavy em-dash use is the single most recognized "AI wrote this" fingerprint - at
    // volume it gates shipping (P1); light overuse stays a warning (P2)
    if (c >= 6) add("P1", "em-dash-overuse", rel, 0, `${c} em-dashes in this file`, "Em-dash saturation reads as AI prose. Use commas, colons, periods, parentheses.");
    else if (c) add("P2", "em-dash-overuse", rel, 0, `${c} em-dashes in this file`, "More than ~2 em-dashes reads as AI prose. Use commas, colons, periods, parentheses.");
  }
}

// ---- run ----
let st;
try { st = statSync(ROOT); } catch { console.error(`Path not found: ${ROOT}`); process.exit(2); }
if (st.isFile()) {
  const ext = extname(ROOT).toLowerCase();
  if (CODE_EXT.has(ext) || TEXT_EXT.has(ext)) scanFile(ROOT, ext);
} else {
  walk(ROOT);
}

const p1 = findings.filter((f) => f.sev === "P1");
const p2 = findings.filter((f) => f.sev === "P2");

function printGroup(title, list) {
  if (!list.length) return;
  console.log(`\n${title}`);
  const byId = {};
  for (const f of list) (byId[f.id] ||= []).push(f);
  for (const id of Object.keys(byId)) {
    console.log(`\n  ${id}  (${byId[id].length})`);
    for (const f of byId[id]) {
      console.log(`    ${f.file}:${f.line}`);
      if (f.snippet) console.log(`      ${f.snippet}`);
    }
    console.log(`    -> ${byId[id][0].fix}`);
    if (truncated[id]) console.log(`    (+${truncated[id]} more not shown)`);
  }
}

console.log(`Anti-slop scan: ${ROOT}  (${filesScanned} files)`);
printGroup("P1 - strong tells (these openly say 'AI made it'):", p1);
printGroup("P2 - likely tells (check in context):", p2);

console.log(`\nSummary: ${p1.length} P1, ${p2.length} P2 across ${new Set(findings.map((f) => f.file)).size} files.`);
if (!findings.length) console.log("Clean on the measurable tells. Now run the visual pass (/design-check) for hierarchy, contrast-in-context, and 'does it look generic'.");
else console.log("Fix P1 first (run /polish). Then re-run this, then do the visual pass.");

process.exit(p1.length ? 1 : 0);
