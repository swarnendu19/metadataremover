#!/usr/bin/env node
// bot-2 breakdance, the shipped kit's signature intro. Zero dependencies.
//
//   node bin/dance.mjs          dance until ctrl+c
//   node bin/dance.mjs 8        dance for 8 seconds
//   node bin/dance.mjs --dump   print sample frames across the routine (no animation)
//   node bin/dance.mjs --fps 60 change frame rate (default 30)
//
// The routine (one seamless loop): TOPROCK groove -> a hit + point -> drop ->
// 6-STEP (a real lap and a half around himself) -> a leg SWIPE -> sweep up into
// a FREEZE -> fall into a WINDMILL -> morph into a HEADSPIN -> pop off into a
// BABY FREEZE -> spring up to the finish. End pose flows back to the start.
//
// TRUE 3D: the robot is a 3D skeleton projected to the terminal:
//   - joints live in 3D; a camera slightly above projects them to 2D
//   - limbs z-sort: near legs pass IN FRONT of the body, far ones BEHIND
//     (far limbs draw in a dimmer shade, instant depth)
//   - the 6-step actually circles AROUND him; the toprock steps cross in front
//   - the power move is a real WINDMILL rolling into a HEADSPIN, one
//     continuous rotation, tucking to spin faster (angular momentum)
//   - crisp pure-color pixels (no blending), quadrant glyphs, face acting
// Output: truecolor quadrant blocks over a dark panel.

import { pathToFileURL } from "node:url";

export const W = 64; // world units wide (= terminal columns)
export const H = 44; // world units tall (= 22 terminal lines)
export const QW = W * 2, QH = H; // quadrant subpixel grid (2x2 per cell)
const FLOOR = 40.5;
const CAM = 0.35; // camera tilt: world z (toward viewer) pushes things down-screen

const BPM = 112;
const B = 60 / BPM;
export { B };

// ---- the routine's beat map (every boundary lives here, so it stays readable) ----
const TOPROCK_END = 6; // toprock groove, three kick-cycles
const HIT_END = TOPROCK_END + 0.3; // snap up into the point
const POINT_END = HIT_END + 0.3; // hold the point
const DROP_END = POINT_END + 0.4; // drop to a crouch
const SETTLE_END = DROP_END + 0.3; // the crouch settles
const SIX0 = SETTLE_END + 0.25; // 6-step begins (after a short lean-in)
const SIX1 = SIX0 + 2.45; // 6-step ends (a lap and a half around himself)
const SIX_LAPS = 1.5;
const CC_END = SIX1 + 0.18; // snap-kick out of the 6-step
const CCHOLD_END = CC_END + 0.24; // hold the kick
const SWIPE_END = CCHOLD_END + 0.9; // a long leg SWIPE across the floor
const FREEZE_IN_END = SWIPE_END + 0.8; // sweep up into the freeze
const FREEZE_HOLD_END = FREEZE_IN_END + 1.0; // hold the freeze, trembling
const WIND_END = FREEZE_HOLD_END + 0.3; // load into the windmill
const PWR_IN = WIND_END + 0.6; // windmill fully engaged (the power chain owns it)

// the power chain, in beats SINCE the windmill fully engages (PWR_IN):
const PW = { wind: 3.0, morph: 0.5, accel: 0.35, head: 2.2, brake: 0.5 };
const PWR_WIND_END = PW.wind; // pure windmill (a couple of revs)
const PWR_MORPH_END = PW.wind + PW.morph; // windmill axis tilts up to vertical
const PWR_ACCEL_END = PWR_MORPH_END + PW.accel; // tuck the legs, spin accelerates
const PWR_HEAD_END = PWR_ACCEL_END + PW.head; // fast headspin (several revs)
const PWR_LEN = PWR_HEAD_END + PW.brake; // flare open, brake; total local length
const PWR_OUT = PWR_IN + PWR_LEN; // the windmill/headspin ends (absolute beat)

const POP_END = PWR_OUT + 0.3; // pop off into a tuck
const BABY_IN_END = POP_END + 0.55; // settle into a baby freeze
const BABY_HOLD_END = BABY_IN_END + 0.8; // hold it
const RISE_END = BABY_HOLD_END + 0.7; // spring up to the finish
const BASK_END = RISE_END + 0.5; // bask in it
const LOOP_BEATS = 24; // ...then settle back to the start
export const LOOP = LOOP_BEATS * B;

// ---- colors (pure sRGB, never blended) ---------------------------------------------
const BGP = [24, 19, 43];
const FLOORC = [52, 43, 84];
const SHADOW = [15, 12, 29];
const VIOLET = [108, 77, 246];
const VIOLET_FAR = [78, 55, 186]; // far-side limbs: the depth cue
const VIOLET_BACK = [88, 62, 205];
const VENT = [66, 46, 158];
const CORAL = [255, 106, 77];
const CORAL_FAR = [196, 80, 58];
const FACE = [250, 247, 242];
const INK = [29, 22, 54];
const DUST = [128, 118, 160];
const CONFETTI = [CORAL, FACE, [255, 209, 102], [166, 144, 250]];

// ---- math ------------------------------------------------------------------------------
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const inQuad = (u) => u * u;
const outQuad = (u) => 1 - (1 - u) * (1 - u);
const snap = (u) => 1 - (1 - clamp(u, 0, 1)) ** 4;
const outBack = (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// 3D vectors
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerpV = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));

// orthographic projection, camera slightly above
const P2 = (p) => [p[0], p[1] + p[2] * CAM];

// body basis: up = pelvis→chest, right/forward rotate around it by yaw
function basisFor(P, C, yaw) {
  const up = norm(sub(C, P));
  const ref = Math.abs(up[2]) > 0.94 ? [0, -1, 0] : [0, 0, 1];
  const r0 = norm(cross(ref, up));
  const q = cross(up, r0);
  const right = add(scl(r0, Math.cos(yaw)), scl(q, Math.sin(yaw)));
  const forward = cross(up, right);
  return { up, right, forward };
}

// two-bone IK in 3D: elbow/knee bends toward the pole direction
function ik3(S, T, L1, L2, pole) {
  let d = sub(T, S);
  let dl = vlen(d);
  const maxR = L1 + L2 - 0.2;
  if (dl > maxR) { d = scl(d, maxR / dl); dl = maxR; T = add(S, d); }
  if (dl < 0.1) { d = [0.1, 0, 0]; dl = 0.1; }
  const dn = scl(d, 1 / dl);
  const a = (L1 * L1 - L2 * L2 + dl * dl) / (2 * dl);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const side = sub(pole, scl(dn, dot(pole, dn)));
  const sn = vlen(side) < 0.01 ? cross(dn, [0, 0, 1]) : norm(side);
  return [add(add(S, scl(dn, a)), scl(sn, h)), T];
}

// ---- pure-color rasterizer (2D screen space, world units) --------------------------------
function newBuf() {
  const b = new Uint8ClampedArray(QW * QH * 3);
  for (let i = 0; i < QW * QH; i++) { b[i * 3] = BGP[0]; b[i * 3 + 1] = BGP[1]; b[i * 3 + 2] = BGP[2]; }
  return b;
}

function paint(buf, x0, y0, x1, y1, sdf, rgb) {
  const ix0 = clamp(Math.floor(x0 * 2), 0, QW - 1), ix1 = clamp(Math.ceil(x1 * 2), 0, QW - 1);
  const iy0 = clamp(Math.floor(y0), 0, QH - 1), iy1 = clamp(Math.ceil(y1), 0, QH - 1);
  for (let iy = iy0; iy <= iy1; iy++) {
    const wy = iy + 0.5;
    for (let ix = ix0; ix <= ix1; ix++) {
      if (sdf((ix + 0.5) / 2, wy) >= 0) continue;
      const o = (iy * QW + ix) * 3;
      buf[o] = rgb[0]; buf[o + 1] = rgb[1]; buf[o + 2] = rgb[2];
    }
  }
}

function circle(buf, cx, cy, r, rgb) {
  paint(buf, cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1,
    (px, py) => Math.hypot(px - cx, py - cy) - r, rgb);
}

function capsule(buf, a, b, r, rgb) {
  const ax = a[0], ay = a[1], dx = b[0] - ax, dy = b[1] - ay;
  const len2 = dx * dx + dy * dy || 1;
  paint(buf, Math.min(a[0], b[0]) - r - 1, Math.min(a[1], b[1]) - r - 1,
    Math.max(a[0], b[0]) + r + 1, Math.max(a[1], b[1]) + r + 1,
    (px, py) => {
      const t = clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1);
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)) - r;
    }, rgb);
}

function rrect(buf, cx, cy, hw, hh, ang, r, rgb) {
  const c = Math.cos(-ang), s = Math.sin(-ang);
  const ext = Math.hypot(hw, hh) + 1;
  paint(buf, cx - ext, cy - ext, cx + ext, cy + ext, (px, py) => {
    const dx = px - cx, dy = py - cy;
    const lx = Math.abs(dx * c - dy * s) - (hw - r);
    const ly = Math.abs(dx * s + dy * c) - (hh - r);
    const ox = Math.max(lx, 0), oy = Math.max(ly, 0);
    return Math.min(Math.max(lx, ly), 0) + Math.hypot(ox, oy) - r;
  }, rgb);
}

function ellipse(buf, cx, cy, rx, ry, rgb) {
  const k = Math.min(rx, ry);
  paint(buf, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1,
    (px, py) => (Math.hypot((px - cx) / rx, (py - cy) / ry) - 1) * k, rgb);
}

// ---- key poses (3D: every point is [x, y, z], z+ toward the viewer) ------------------------
// P pelvis, C chest, Hd head center; yaw = facing; hYaw = extra head turn;
// headA = screen-plane head tilt; squash; face; look = eye offset
const STAND = {
  P: [32, 33, 0], C: [32, 26.8, 0], Hd: [32, 17.5, 0],
  lh: [23, 36, 1], rh: [41, 36, 1], lf: [25, 40, 0.8], rf: [39, 40, 0.8],
  yaw: 0, hYaw: 0, headA: 0, squash: 0,
};
const POINT = { ...STAND, C: [32, 26, 0], Hd: [32, 16.2, 0], lh: [25, 31, 2], rh: [45, 15, 1.5], rf: [38, 39.5, 0.8], yaw: 0.25, headA: -0.13 };
const CROUCH = { ...STAND, P: [32, 37.2, 0], C: [32, 32.6, 0], Hd: [32, 25, 0], lh: [19, 40, 1.5], rh: [45, 40, 1.5], lf: [24, 40, 0.8], rf: [40, 40, 0.8], squash: 0.5 };
const SIX = { ...STAND, P: [32, 36.8, 0], C: [32, 32.2, 0], Hd: [32, 25.5, 0], lh: [27, 39.5, 2], rh: [37, 39.5, 2], squash: 0.35, headA: 0.08 };
const CCK = { ...SIX, P: [30, 36.8, 0], C: [30.5, 32.2, 0], Hd: [31, 25.5, 0], lh: [24, 39.5, 2], rh: [37, 39.5, 2], lf: [27, 38.5, 1], rf: [47, 39.5, 2.5], headA: -0.1, yaw: 0.2 };
// SWIPE: a long, low leg sweep. One leg fires across the floor, the body leans
// over a planted hand. Reached with an arc so the foot really rakes the ground.
const SWIPE = { ...CROUCH, P: [33, 37, 0], C: [32.5, 32.4, 0], Hd: [29.5, 25.6, 0], lh: [16.5, 38.5, 2.5], rh: [44, 33, 1.5], lf: [21, 40, 1], rf: [50, 38.5, 3], squash: 0.42, headA: -0.14 };
const FREEZE = {
  ...STAND, P: [31, 30, 0], C: [30, 24.2, 0], Hd: [22, 15.5, 0],
  lh: [12, 25, 0.5], rh: [40, 40, 1], lf: [44, 17, -1.5], rf: [48, 25, -0.5],
  yaw: -0.3, headA: -0.5,
};
const WIND = { ...FREEZE, P: [31, 31.5, 0], C: [30, 26, 0], Hd: [22, 17.5, 0], lf: [40, 27, -1], rf: [43, 32, -0.5], squash: 0.15 };
const TUCK = { ...STAND, P: [32, 26.5, 0], C: [32, 22, 0], Hd: [32, 15.5, 0], lh: [24, 28, 1], rh: [40, 28, 1], lf: [27, 32, 1], rf: [37, 32, 1], squash: -0.1 };
// BABY: an inverted baby freeze. Head and hands low on the floor, hips and legs
// stacked up above. C sits BELOW P on screen, so the whole body reads upside-down.
const BABY = { ...STAND, P: [31.5, 30, 0], C: [31.5, 33.4, 0.4], Hd: [31, 36.6, 1], lh: [26.5, 39.6, 1.6], rh: [36, 39.6, 1.6], lf: [27.5, 25, 1], rf: [35.5, 25, 1], yaw: 0, headA: 0, squash: 0.12, face: "grit" };
const VICT = { ...STAND, C: [32, 26.5, 0], Hd: [32, 16.5, 0], lh: [18, 16, 1.5], rh: [46, 16, 1.5], headA: -0.08, face: "joy" };

function tween(A, Bs, u) {
  const out = {};
  for (const k of Object.keys(A)) {
    if (!(k in Bs)) continue;
    const a = A[k], b = Bs[k];
    if (typeof a === "number") out[k] = lerp(a, b, u);
    else if (Array.isArray(a)) out[k] = lerpV(a, b, u);
    else out[k] = u < 0.5 ? a : b;
  }
  return out;
}

// limbs travel in ARCS: bow the xy path perpendicular to travel (z stays linear)
function arcLerp(a, b, u, h) {
  const p = lerpV(a, b, u);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const bow = h * 4 * u * (1 - u);
  return [p[0] - (dy / len) * bow, p[1] + (dx / len) * bow, p[2]];
}

const jit = (t, k) => 0.5 * Math.sin(t * 43 + k) + 0.3 * Math.sin(t * 29 + k * 2);

// ---- toprock: cross-steps with weight shift + body turn (beats 0..TOPROCK_END) ---------------
function toprockState(tb) {
  const w = smooth(tb / 0.4) * smooth((TOPROCK_END - tb) / 0.4);
  const c = tb % 2;
  const rightKick = c < 1;
  const ph = rightKick ? c : c - 1;

  let kick;
  if (ph < 0.38) kick = smooth(ph / 0.38);
  else if (ph < 0.52) kick = 1;
  else kick = 1 - smooth((ph - 0.52) / 0.4);
  const kw = kick * w;

  const lean = (rightKick ? -1 : 1) * kw;
  const bounce = Math.abs(Math.sin(Math.PI * tb)) * w;

  const st = { ...STAND, face: "groove" };
  const bx = 32 + 2.2 * lean, dy = -1.3 * bounce + 0.5 * kw;
  st.P = [bx, 33 + dy, 0];
  st.C = [bx + 0.6 * lean, 26.8 + dy, 0];
  st.Hd = [32 + 2.7 * lean, 17.5 - 1.7 * bounce + 0.5 * kw, 0];
  st.yaw = 0.3 * lean; // he turns into the step
  st.hYaw = 0.25 * lean;
  st.headA = -0.11 * lean;
  st.squash = 0.12 * bounce;
  st.look = [(rightKick ? 0.7 : -0.7) * kw, 0.15];

  if (rightKick) { // kicking foot crosses IN FRONT (z toward the camera)
    st.rf = [...arcLerp([39, 40, 0.8], [33, 36.8, 3.2], kw, -2)];
    st.lf = [25 + 0.6 * lean, 40, 0.8];
  } else {
    st.lf = [...arcLerp([25, 40, 0.8], [31, 36.8, 3.2], kw, 2)];
    st.rf = [39 + 0.6 * lean, 40, 0.8];
  }
  st.lh = lerpV([23 + 1.5 * lean, 36 - bounce, 1], [24, 26.5, 2.5], smooth(rightKick ? kw : 0));
  st.rh = lerpV([41 + 1.5 * lean, 36 - bounce, 1], [40, 26.5, 2.5], smooth(rightKick ? 0 : kw));
  return st;
}

// ---- 6-step: feet on a TRUE floor circle around him, body pivoting (beats SIX0..SIX1) --------
function sixStepState(tb) {
  const u = clamp((tb - SIX0) / (SIX1 - SIX0), 0, 1);
  const ramp = smooth(u / 0.15) * smooth((1 - u) / 0.15);
  const phi = SIX_LAPS * 2 * Math.PI * smooth(u); // a lap and a half AROUND himself

  const foot = (a) => [
    32 + (10.5 * ramp + 1.8) * Math.cos(a),
    40.2 - 0.4 * ramp,
    (8.5 * ramp + 1) * Math.sin(a), // depth: front of the circle is toward the camera
  ];
  const p1 = foot(phi), p2 = foot(phi + Math.PI);
  const [lf, rf] = p1[0] <= p2[0] ? [p1, p2] : [p2, p1];

  const liftL = (Math.max(0, -Math.cos(phi) - 0.35) / 0.65) * ramp;
  const liftR = (Math.max(0, Math.cos(phi) - 0.35) / 0.65) * ramp;

  const bx = 32 - 1.8 * Math.sin(phi) * ramp;
  return {
    ...SIX,
    lf, rf,
    lh: [27 - 1.5 * liftL, 39.5 - 3 * liftL, 2],
    rh: [37 + 1.5 * liftR, 39.5 - 3 * liftR, 2],
    P: [bx, 36.8, -0.5],
    C: [bx + 0.5 * Math.sin(phi) * ramp, 32.2, -0.3],
    Hd: [bx + 1 * Math.sin(phi) * ramp, 25.5, 0.3],
    yaw: 0.85 * Math.sin(phi) * ramp, // his body pivots with the sweep
    hYaw: -0.3 * Math.sin(phi) * ramp, // ...but his head keeps spotting the camera
    face: "groove",
    look: [Math.cos(phi) * 0.8, 0.5],
  };
}

// ---- the power chain: WINDMILL rolling into a HEADSPIN, one continuous rotation --------------
// All phases are expressed in beats SINCE the windmill fully engages (L = tb - PWR_IN),
// so PWR_IN is the single knob that positions the whole move in the routine.
function pwrRate(tb) { // revolutions per second over the chain
  const L = tb - PWR_IN;
  if (L < 0) return 1.1 * smooth((L + 0.6) / 0.6); // spin-up during the fall-in
  if (L < PWR_WIND_END) return 1.1; // windmill
  if (L < PWR_MORPH_END) return lerp(1.1, 1.6, smooth((L - PWR_WIND_END) / PW.morph));
  if (L < PWR_ACCEL_END) return lerp(1.6, 3.0, smooth((L - PWR_MORPH_END) / PW.accel)); // TUCK → spin fast
  if (L < PWR_HEAD_END) return 3.0; // headspin
  return lerp(3.0, 0.7, smooth((L - PWR_HEAD_END) / PW.brake)); // flare → brake
}
function pwrExt(tb) { // leg extension (1 wide, 0.28 tucked)
  const L = tb - PWR_IN;
  if (L < PWR_MORPH_END) return 1; // legs wide through the windmill + morph
  if (L < PWR_ACCEL_END) return 1 - 0.72 * smooth((L - PWR_MORPH_END) / PW.accel); // tuck in
  const flare0 = PWR_HEAD_END - 0.15; // flare open just before the brake
  if (L < flare0) return 0.28;
  return 0.28 + 0.72 * smooth((L - flare0) / (PW.brake + 0.15));
}
const TH_TABLE = (() => {
  const arr = [0];
  let th = 0;
  const dt = 1 / 240;
  for (let t = (PWR_IN - 0.6) * B; t < PWR_OUT * B + 0.1; t += dt) {
    th += 2 * Math.PI * pwrRate(t / B) * dt;
    arr.push(th);
  }
  return arr;
})();
const thetaAt = (t) => {
  const i = clamp((t - (PWR_IN - 0.6) * B) * 240, 0, TH_TABLE.length - 2);
  const f = Math.floor(i);
  return lerp(TH_TABLE[f], TH_TABLE[f + 1], i - f);
};

function powerState(t) {
  const tb = t / B;
  const L = tb - PWR_IN;
  const th = thetaAt(t);
  const e = pwrExt(tb);
  // s: how horizontal the body axis is (windmill 0.78 → headspin 0, vertical)
  const s = L < PWR_WIND_END ? 0.78 : 0.78 * (1 - smooth((L - PWR_WIND_END) / PW.morph));
  const lift = Math.sqrt(1 - s * s);
  const dir = [Math.cos(th) * s, -lift, Math.sin(th) * s]; // pelvis direction from chest
  const chestY = lerp(36.8, 31, smooth((L - PWR_WIND_END) / PW.morph));
  const C = [32, L < PWR_WIND_END ? 36.8 : chestY, 0];
  const P = add(C, scl(dir, 5.8));
  const Hd = add(C, scl(dir, -5.2));
  Hd[1] = Math.min(Hd[1], 39.6); // the head grazes the floor, never clips it

  const { right } = basisFor(P, C, th); // legs + arms ride the rotation
  // LONG legs: in a windmill the sweeping V is the whole move
  const spread = 2.2 + 6.3 * e;
  const out = 2.5 + 5.5 * e;
  const mkFoot = (sgn) => {
    const f = add(add(P, scl(dir, out)), scl(right, sgn * spread));
    f[1] = Math.min(f[1], 40.6);
    return f;
  };
  const f1 = mkFoot(1), f2 = mkFoot(-1);
  const [lf, rf] = f1[0] <= f2[0] ? [f1, f2] : [f2, f1];

  const handIn = smooth((1 - e) / 0.72);
  const mkHand = (sgn) => add(add(C, scl(right, sgn * lerp(6.5, 3.2, handIn))), scl(dir, -1));
  const h1 = mkHand(1), h2 = mkHand(-1);
  const [lh, rh] = h1[0] <= h2[0] ? [h1, h2] : [h2, h1];

  // yaw = th: the body ROLLS with the rotation, so his face and chest sweep
  // past the camera every revolution, which is what sells the spin
  return { ...STAND, P, C, Hd, lf, rf, lh, rh, yaw: th, hYaw: 0, headA: 0, squash: 0, face: "spin" };
}

// ---- the routine (tb = time in beats) ----------------------------------------------------------
function coreState(t) {
  t = ((t % LOOP) + LOOP) % LOOP;
  const tb = t / B;

  if (tb < TOPROCK_END) return toprockState(tb);
  if (tb < HIT_END) { // HIT: snap up into the point
    const u = snap((tb - TOPROCK_END) / 0.3);
    const st = tween(STAND, POINT, u);
    st.rh = arcLerp(STAND.rh, POINT.rh, u, -3);
    st.look = [0.8, -0.5];
    return st;
  }
  if (tb < POINT_END) { // hold it: half a beat of swagger
    const st = { ...POINT, look: [0.8, -0.5] };
    st.rh = [POINT.rh[0] + jit(t, 2) * 0.4, POINT.rh[1] + jit(t, 6) * 0.4, POINT.rh[2]];
    return st;
  }
  if (tb < DROP_END) { const st = tween(POINT, CROUCH, inQuad((tb - POINT_END) / 0.4)); st.face = "oof"; return st; }
  if (tb < SETTLE_END) {
    const st = { ...CROUCH, face: "oof" };
    st.squash = 0.5 + 0.3 * Math.exp(-(tb - DROP_END) * B * 14);
    return st;
  }
  if (tb < SIX0) return tween(CROUCH, sixStepState(SIX0), smooth((tb - SETTLE_END) / 0.25));
  if (tb < SIX1) return sixStepState(tb); // 6-step, a real lap and a half around himself
  if (tb < CC_END) { // CC: snap-kick out to the side
    const u = snap((tb - SIX1) / 0.18);
    const st = tween(sixStepState(SIX1), CCK, u);
    st.rf = arcLerp(sixStepState(SIX1).rf, CCK.rf, u, -1.8);
    st.look = [0.9, 0.2];
    return st;
  }
  if (tb < CCHOLD_END) return { ...CCK, look: [0.9, 0.2] };
  if (tb < SWIPE_END) { // the leg SWIPE: fire the front foot across the floor in a big arc
    const u = smooth((tb - CCHOLD_END) / (SWIPE_END - CCHOLD_END));
    const st = tween(CCK, SWIPE, u);
    st.rf = arcLerp(CCK.rf, SWIPE.rf, smooth(clamp(u * 1.15, 0, 1)), -3);
    st.lh = arcLerp(CCK.lh, SWIPE.lh, u, 2);
    st.face = "grit";
    st.look = [-0.6, 0.3];
    return st;
  }
  if (tb < FREEZE_IN_END) { // sweep up into the freeze: feet lead, head lands last
    const u = (tb - SWIPE_END) / (FREEZE_IN_END - SWIPE_END);
    const st = tween(SWIPE, FREEZE, smooth(u));
    const uFeet = smooth(clamp(u * 1.25, 0, 1));
    const uHead = smooth(clamp((u - 0.2) / 0.8, 0, 1));
    st.lf = arcLerp(SWIPE.lf, FREEZE.lf, uFeet, -3.2);
    st.rf = arcLerp(SWIPE.rf, FREEZE.rf, uFeet, -2.4);
    st.Hd = lerpV(SWIPE.Hd, FREEZE.Hd, uHead);
    st.headA = lerp(SWIPE.headA, FREEZE.headA, uHead);
    st.face = "grit";
    return st;
  }
  if (tb < FREEZE_HOLD_END) { // hold the freeze, trembling
    const st = { ...FREEZE, face: "grit" };
    st.lh = [FREEZE.lh[0] + jit(t, 1) * 0.8, FREEZE.lh[1] + jit(t, 5) * 0.5, FREEZE.lh[2]];
    st.lf = [FREEZE.lf[0] + jit(t, 2) * 0.6, FREEZE.lf[1] + jit(t, 6) * 0.6, FREEZE.lf[2]];
    st.rf = [FREEZE.rf[0] + jit(t, 3) * 0.6, FREEZE.rf[1] + jit(t, 7) * 0.6, FREEZE.rf[2]];
    st.P = [FREEZE.P[0] + jit(t, 4) * 0.35, FREEZE.P[1], 0];
    return st;
  }
  if (tb < WIND_END) { const st = tween(FREEZE, WIND, smooth((tb - FREEZE_HOLD_END) / 0.3)); st.face = "grit"; return st; }
  if (tb < PWR_IN) { // fall into the windmill: legs arc up and over
    const u = smooth((tb - WIND_END) / (PWR_IN - WIND_END));
    const st = tween(WIND, powerState(PWR_IN * B), u);
    st.lf = arcLerp(WIND.lf, powerState(PWR_IN * B).lf, u, -4);
    st.rf = arcLerp(WIND.rf, powerState(PWR_IN * B).rf, u, -4);
    st.face = "spin";
    return st;
  }
  if (tb < PWR_OUT) return powerState(t); // WINDMILL → morph → HEADSPIN, one rotation
  if (tb < POP_END) { // pop off into a tucked hop
    const pw = powerState(PWR_OUT * B);
    pw.yaw = ((pw.yaw % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // nearest turn home
    const st = tween(pw, TUCK, smooth((tb - PWR_OUT) / 0.3));
    st.face = "spin";
    return st;
  }
  if (tb < BABY_IN_END) { // set the hands down into a baby freeze
    const u = smooth((tb - POP_END) / (BABY_IN_END - POP_END));
    const st = tween(TUCK, BABY, u);
    st.lh = arcLerp(TUCK.lh, BABY.lh, u, -1.5);
    st.rh = arcLerp(TUCK.rh, BABY.rh, u, -1.5);
    st.face = "grit";
    return st;
  }
  if (tb < BABY_HOLD_END) { // hold the baby freeze, trembling
    const st = { ...BABY };
    st.lf = [BABY.lf[0] + jit(t, 1) * 0.5, BABY.lf[1] + jit(t, 5) * 0.5, BABY.lf[2]];
    st.rf = [BABY.rf[0] + jit(t, 2) * 0.5, BABY.rf[1] + jit(t, 6) * 0.5, BABY.rf[2]];
    st.P = [BABY.P[0] + jit(t, 4) * 0.3, BABY.P[1] + jit(t, 3) * 0.2, BABY.P[2]];
    return st;
  }
  if (tb < RISE_END) { // spring UP: arms whip outward with overshoot
    const u = (tb - BABY_HOLD_END) / (RISE_END - BABY_HOLD_END);
    const st = tween(BABY, VICT, outQuad(u));
    st.lh = arcLerp(BABY.lh, VICT.lh, outBack(u), 2.5);
    st.rh = arcLerp(BABY.rh, VICT.rh, outBack(u), -2.5);
    st.headA = -0.08 * outBack(u);
    st.face = "joy";
    return st;
  }
  if (tb < BASK_END) { // bask
    const w = smooth((tb - RISE_END) / 0.1) * smooth((BASK_END - tb) / 0.1);
    const bob = Math.sin(2 * Math.PI * (tb - RISE_END)) * w;
    const st = { ...VICT, face: "joy" };
    st.P = [32, 33 + 0.7 * bob, 0];
    st.Hd = [32, 16.5 + 1.1 * bob, 0];
    st.lh = [VICT.lh[0] - 1.2 * bob, VICT.lh[1] + 0.7 * bob, VICT.lh[2]];
    st.rh = [VICT.rh[0] + 1.2 * bob, VICT.rh[1] + 0.7 * bob, VICT.rh[2]];
    st.headA = -0.08 + 0.06 * bob;
    return st;
  }
  return tween(VICT, STAND, smooth((tb - BASK_END) / (LOOP_BEATS - BASK_END)));
}

// ---- particles ----------------------------------------------------------------------------------
function burst(list, t, t0, n, seed, origin, spread, vy0, g, life, kind) {
  const dt = t - t0;
  if (dt < 0.07 || dt > life) return;
  for (let i = 0; i < n; i++) {
    const r1 = rnd(seed + i), r2 = rnd(seed + i + 50);
    const x = origin[0] + (r1 - 0.5) * 8 + (r1 - 0.5) * spread * dt;
    const y = origin[1] + (vy0 - r2 * 2.5) * dt + 0.5 * g * dt * dt;
    if (y > FLOOR + 1.5) continue;
    const fade = 1 - dt / life;
    list.push([x, y, kind, i, dt, fade]);
  }
}

function particlesAt(t) {
  const list = [];
  burst(list, t, DROP_END * B, 6, 11, [32, 40], 30, -3, 30, 0.5, "dust"); // the drop kicks up dust
  burst(list, t, POP_END * B, 6, 23, [32, 40], 30, -3, 30, 0.5, "dust"); // the pop-off lands
  // a dust trail all through the windmill + headspin
  for (let k = 0; k < 15; k++) burst(list, t, (PWR_IN + 0.1 + k * 0.4) * B, 6, 100 + k * 7, [32, 41], 34, -4, 24, 0.45, "dust");
  burst(list, t, (RISE_END - 0.15) * B, 18, 300, [32, 11], 44, -7, 26, 1.4, "confetti"); // the finish
  return list;
}

// ---- face -----------------------------------------------------------------------------------------
const BLINKS = [1.6 * B, 3.4 * B, (BASK_END - 0.2) * B];
function drawFace(buf, st, base, eR, eU, t, facing) {
  // base = head center on screen; eR/eU = projected head axes (they carry both
  // foreshortening AND orientation, so an upside-down head flips automatically).
  // local coords: +lx toward head-right, +ly toward head-TOP (along eU).
  const at = (lx, ly) => [base[0] + eR[0] * lx + eU[0] * ly, base[1] + eR[1] * lx + eU[1] * ly];
  const hwF = Math.hypot(eR[0], eR[1]);
  const ang = Math.atan2(eR[1], eR[0]);

  if (facing < 0.15) { // back of the head
    const q = at(0, 0);
    rrect(buf, q[0], q[1], 6 * hwF, 3.5, ang, 1, VIOLET_BACK);
    capsule(buf, at(-3, -1), at(3, -1), 0.4, VENT);
    capsule(buf, at(-3, 1), at(3, 1), 0.4, VENT);
    return;
  }
  const q = at(0, 0);
  rrect(buf, q[0], q[1], 6 * hwF, 3.5, ang, 1, FACE);

  let eyeH = 1.05;
  for (const b of BLINKS) if (t > b && t < b + 0.12) eyeH = 0.22;
  const look = st.look || [0, 0];
  const par = clamp(-Math.sin((st.yaw || 0) + (st.hYaw || 0)) * 1.6, -2, 2); // eyes slide as he turns
  const ey = 1.4; // eyes sit toward the head-top

  if (st.face === "spin") {
    capsule(buf, at(-4 + par, ey), at(-2 + par, ey + 0.7), 0.5, INK);
    capsule(buf, at(2 + par, ey + 0.7), at(4 + par, ey), 0.5, INK);
  } else {
    const sq = st.face === "grit" ? 0.55 : 1;
    for (const sx of [-1, 1]) {
      const p = at(sx * 3 + look[0] + par, ey - look[1]);
      ellipse(buf, p[0], p[1], 1.05, eyeH * sq, INK);
    }
  }

  const my = -2; // mouth toward the head-bottom
  if (st.face === "joy") {
    const p = at(par * 0.6, my - 0.2);
    ellipse(buf, p[0], p[1], 1.7, 1.3, INK);
  } else if (st.face === "oof") {
    const p = at(par * 0.6, my);
    circle(buf, p[0], p[1], 1.0, INK);
  } else if (st.face === "grit") {
    capsule(buf, at(-2.2 + par * 0.6, my), at(2.2 + par * 0.6, my), 0.75, INK);
    capsule(buf, at(-0.4 + par * 0.6, my + 0.55), at(0.4 + par * 0.6, my + 0.55), 0.5, FACE);
  } else { // smile
    capsule(buf, at(-1.9 + par * 0.6, my + 0.3), at(par * 0.6, my - 0.45), 0.55, INK);
    capsule(buf, at(par * 0.6, my - 0.45), at(1.9 + par * 0.6, my + 0.3), 0.55, INK);
  }
}

// ---- the full frame: build 3D, z-sort, draw far→near ------------------------------------------------
export function frameRGBAt(t) {
  const st = coreState(t);
  const prev1 = coreState(t - 0.022), prev2 = coreState(t - 0.044);

  const buf = newBuf();
  capsule(buf, [1, FLOOR + 1.6], [W - 2, FLOOR + 1.6], 0.7, FLOORC); // floor line

  const { P, C, Hd } = st;
  const { up, right, forward } = basisFor(P, C, st.yaw || 0);
  const facing = forward[2];

  // shadow under the pelvis
  const spreadS = clamp(10 + (P[1] - 23) * 0.5, 6, 15);
  ellipse(buf, P[0], FLOOR + 1.6, spreadS, 2.6, SHADOW);

  const ops = []; // {z, fn} painter's algorithm
  const shade = (z, near, far) => (z < -1.2 ? far : near);

  // limbs: 3D IK, each segment drawn with depth shade
  const bh = 4.6 * (1 - 0.4 * clamp(st.squash, -0.3, 0.8));
  const bwWorld = 4.4 * (1 + 0.3 * clamp(st.squash, -0.3, 0.8));
  const shoulderOf = (sgn) => add(add(C, scl(right, sgn * (bwWorld - 0.9))), scl(up, -0.6));
  const hipOf = (sgn) => add(add(P, scl(right, sgn * (bwWorld - 1.3))), scl(up, 0.5));

  const limb = (S, T, L, polePush, rNear, rEnd, endNear, endFar) => {
    const pole = add(scl(polePush, 1), scl(forward, 0.55));
    const [E, T2] = ik3(S, T, L, L, pole);
    const segs = [[S, E], [E, T2]];
    for (const [a, b2] of segs) {
      const zm = (a[2] + b2[2]) / 2;
      ops.push({ z: zm, fn: () => capsule(buf, P2(a), P2(b2), rNear, shade(zm, VIOLET, VIOLET_FAR)) });
    }
    ops.push({ z: T2[2] + 0.01, fn: () => circle(buf, ...P2(T2), rEnd, shade(T2[2], endNear, endFar)) });
  };

  limb(shoulderOf(-1), st.lh, 6.4, scl(right, -1), 1.15, 1.7, CORAL, CORAL_FAR);
  limb(shoulderOf(1), st.rh, 6.4, scl(right, 1), 1.15, 1.7, CORAL, CORAL_FAR);
  limb(hipOf(-1), st.lf, 6.8, scl(right, -0.8), 1.25, 1.8, CORAL, CORAL_FAR);
  limb(hipOf(1), st.rf, 6.8, scl(right, 0.8), 1.25, 1.8, CORAL, CORAL_FAR);

  // torso (billboard along the projected body axis)
  {
    const M = lerpV(P, C, 0.5);
    const m2 = P2(M);
    const eU2 = sub2(P2(add(M, up)), m2), eR2 = sub2(P2(add(M, right)), m2);
    const ang = Math.atan2(eU2[0], -eU2[1]);
    const hw = bwWorld * Math.hypot(eR2[0], eR2[1]);
    const hh = Math.max(2.2, vlen(sub(C, P)) * 0.62 + bh * 0.3);
    const zm = M[2];
    ops.push({ z: zm, fn: () => rrect(buf, m2[0], m2[1], Math.max(2, hw), hh, ang, 2, VIOLET) });
    if (facing > 0.15) {
      const cl = P2(add(lerpV(P, C, 0.45), scl(forward, 0.6)));
      ops.push({ z: zm + 0.02, fn: () => rrect(buf, cl[0], cl[1], 1.9 * Math.max(0.4, Math.hypot(eR2[0], eR2[1])), 1.4, ang, 0.8, CORAL) });
    }
  }

  // neck
  ops.push({ z: (C[2] + Hd[2]) / 2, fn: () => capsule(buf, P2(C), P2(Hd), 1.5, VIOLET) });

  // head + face + antenna
  {
    const hb = basisFor(sub(Hd, up), Hd, (st.yaw || 0) + (st.hYaw || 0)); // head shares the body axis + extra turn
    const base = P2(Hd);
    let eR2 = sub2(P2(add(Hd, hb.right)), base);
    let eU2 = sub2(P2(add(Hd, up)), base);
    // screen-plane head tilt
    const ca = Math.cos(st.headA || 0), sa = Math.sin(st.headA || 0);
    eR2 = [eR2[0] * ca - eR2[1] * sa, eR2[0] * sa + eR2[1] * ca];
    eU2 = [eU2[0] * ca - eU2[1] * sa, eU2[0] * sa + eU2[1] * ca];
    const hwF = Math.max(0.42, Math.hypot(eR2[0], eR2[1]));
    const hFace = hb.forward[2];
    const ang = Math.atan2(eR2[1], eR2[0]);
    const zh = Hd[2] + 0.05;
    ops.push({
      z: zh, fn: () => {
        rrect(buf, base[0], base[1], 8 * hwF, 5.3, ang, 2.2, VIOLET);
        drawFace(buf, st, base, eR2, eU2, t, hFace);
      },
    });
    // antenna springs against head motion; clamped so the ball rides ON the
    // floor when he is inverted (he spins on it)
    const vx1 = (st.Hd[0] - prev1.Hd[0]) / 0.022, vx2 = (prev1.Hd[0] - prev2.Hd[0]) / 0.022;
    const antW = clamp(-0.16 * vx1 - 0.05 * (vx1 - vx2), -3.2, 3.2);
    const capY = (p) => [p[0], Math.min(p[1], FLOOR + 0.9), p[2]];
    const aBase = capY(add(Hd, scl(up, 5.2)));
    const aMid = capY(add(add(Hd, scl(up, 6.6)), [antW * 0.5, 0, 0]));
    const aTip = capY(add(add(Hd, scl(up, 8.6)), [antW, 0, 0]));
    ops.push({
      z: aTip[2], fn: () => {
        capsule(buf, P2(aBase), P2(aMid), 0.55, VIOLET);
        capsule(buf, P2(aMid), P2(aTip), 0.5, VIOLET);
        circle(buf, ...P2(aTip), 1.7, CORAL);
      },
    });
  }

  ops.sort((a, b) => a.z - b.z);
  for (const op of ops) op.fn();

  for (const [x, y, kind, i, dt, fade] of particlesAt(t)) {
    if (kind === "dust") circle(buf, x, y, 0.9, fade > 0.3 ? DUST : BGP);
    else rrect(buf, x, y, 1.1, 0.6, t * 9 + i * 1.7, 0.25, fade > 0.15 ? CONFETTI[i % CONFETTI.length] : BGP);
  }

  return buf;
}

const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];

// ---- ANSI quadrant renderer --------------------------------------------------------------------------
const RESET = "\x1b[0m";
const GLYPHS = [" ", "▘", "▝", "▀", "▖", "▌", "▞", "▛", "▗", "▚", "▐", "▜", "▄", "▙", "▟", "█"];

export function renderAnsi(rgb) {
  const key = (x, y) => { const o = (y * QW + x) * 3; return (rgb[o] << 16) | (rgb[o + 1] << 8) | rgb[o + 2]; };
  const rgbOf = (k) => [k >> 16, (k >> 8) & 255, k & 255];
  const lines = [];
  for (let r = 0; r < QH / 2; r++) {
    let out = "", curF = "", curB = "";
    for (let c = 0; c < QW / 2; c++) {
      const cell = [key(c * 2, r * 2), key(c * 2 + 1, r * 2), key(c * 2, r * 2 + 1), key(c * 2 + 1, r * 2 + 1)];
      const counts = new Map();
      for (const k of cell) counts.set(k, (counts.get(k) || 0) + 1);
      let glyph, fgK, bgK;
      if (counts.size === 1) {
        glyph = " "; fgK = bgK = cell[0];
      } else {
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map((e) => e[0]);
        const [ka, kb] = top;
        const ca = rgbOf(ka), cb = rgbOf(kb);
        let bits = 0;
        for (let i = 0; i < 4; i++) {
          let k = cell[i];
          if (k !== ka && k !== kb) {
            const cc = rgbOf(k);
            const da = (cc[0] - ca[0]) ** 2 + (cc[1] - ca[1]) ** 2 + (cc[2] - ca[2]) ** 2;
            const db = (cc[0] - cb[0]) ** 2 + (cc[1] - cb[1]) ** 2 + (cc[2] - cb[2]) ** 2;
            k = da <= db ? ka : kb;
          }
          if (k === ka) bits |= 1 << i;
        }
        glyph = GLYPHS[bits]; fgK = ka; bgK = kb;
        if (bits === 15) { glyph = " "; bgK = ka; }
      }
      const f = rgbOf(fgK), b = rgbOf(bgK);
      const nf = `\x1b[38;2;${f[0]};${f[1]};${f[2]}m`;
      const nb = `\x1b[48;2;${b[0]};${b[1]};${b[2]}m`;
      if (glyph !== " " && nf !== curF) { out += nf; curF = nf; }
      if (nb !== curB) { out += nb; curB = nb; }
      out += glyph;
    }
    lines.push(out + RESET);
  }
  return lines.join("\n");
}

// ---- player --------------------------------------------------------------------------------------------
// the moves in beat order, used by --dump so a reviewer can see each one
const MOVES = [
  [1.5, "toprock groove"],
  [TOPROCK_END + 0.15, "the hit + point"],
  [(SIX0 + SIX1) / 2, "6-step"],
  [(CCHOLD_END + SWIPE_END) / 2, "leg swipe"],
  [(FREEZE_IN_END + FREEZE_HOLD_END) / 2, "the freeze"],
  [PWR_IN + PW.wind * 0.5, "windmill"],
  [PWR_ACCEL_END + PWR_IN + PW.head * 0.4, "headspin"],
  [(BABY_IN_END + BABY_HOLD_END) / 2, "baby freeze"],
  [(RISE_END + BASK_END) / 2, "the finish"],
];

function main() {
  const args = process.argv.slice(2);
  const fpsIx = args.indexOf("--fps");
  const FPS = fpsIx >= 0 ? clamp(parseFloat(args[fpsIx + 1]) || 30, 5, 60) : 30;
  const rest = args.filter((a, i) => a !== "--fps" && i !== fpsIx + 1);

  if (rest[0] === "--dump" || !process.stdout.isTTY) {
    for (const [tb, label] of MOVES) {
      process.stdout.write(`beat ${tb.toFixed(2)}  ${label}\n${renderAnsi(frameRGBAt(tb * B))}\n\n`);
    }
    return;
  }

  const seconds = rest[0] ? parseFloat(rest[0]) : Infinity;
  const caption = `\x1b[2m  bot-2 · toprock → 6-step → windmill → headspin → freeze at ${FPS}fps · ctrl+c to stop\x1b[0m`;
  const blockLines = H / 2 + 2;

  const cleanup = () => {
    process.stdout.write("\x1b[?25h" + RESET + "\n  \x1b[2mkeep breakin'.\x1b[0m\n");
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  process.stdout.write("\x1b[?25l\n");
  const started = Date.now();
  let first = true;

  const step = () => {
    const t = (Date.now() - started) / 1000;
    if (t >= seconds) return cleanup();
    const frame = renderAnsi(frameRGBAt(t));
    let out = "\x1b[?2026h";
    if (!first) out += `\x1b[${blockLines}A`;
    first = false;
    out += frame + "\n\n" + caption + "\n\x1b[?2026l";
    process.stdout.write(out);
    const el = (Date.now() - started) % (1000 / FPS);
    setTimeout(step, Math.max(0, 1000 / FPS - el));
  };
  step();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
