# Before / After

Concrete fixes for the tells the detector flags most. `/polish` works in this direction.

## 1. The side-stripe border (the #1 tell)
```css
/* BEFORE — screams "AI generated this card" */
.note { border-left: 4px solid #7c3aed; padding-left: 16px; }

/* AFTER — a real edge, or none */
.note { border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
/* or even simpler: a 6% tint and no border at all */
.note { background: color-mix(in oklab, var(--accent) 6%, transparent); padding: 16px; }
```

## 2. Gradient text
```css
/* BEFORE — the default "make it pop" move */
.h1 { background: linear-gradient(90deg, #8b5cf6, #ec4899); -webkit-background-clip: text; color: transparent; }

/* AFTER — one solid color; emphasis from weight and size */
.h1 { color: var(--ink); font-weight: 800; letter-spacing: -0.02em; }
```

## 3. Reflex font + flat hierarchy
```css
/* BEFORE — Inter at three muddy sizes is the AI house style */
body { font-family: Inter, sans-serif; }
.h1 { font-size: 20px; } .h2 { font-size: 18px; } .p { font-size: 16px; }

/* AFTER — a display face with a voice, a real scale (>=1.25), size + weight together */
:root { --display: "Hanken Grotesk", system-ui; --body: "Hanken Grotesk", system-ui; }
.h1 { font-family: var(--display); font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
.h2 { font-size: 1.25rem; font-weight: 700; }
.p  { font-family: var(--body); font-size: 1rem; line-height: 1.55; }
```

## 4. Gray text on a tinted surface (fails contrast and looks AI-default)
```css
/* BEFORE — muted gray on warm cream, ~3:1, hard to read and generic */
.card { background: #faf7f2; }
.card p { color: #9b9b9b; }

/* AFTER — text is a darker shade of the surface's own hue, >= 4.5:1 */
.card { background: oklch(98% 0.01 95); }
.card p { color: oklch(38% 0.02 95); }
```

## 5. The identical card grid
```html
<!-- BEFORE — icon-tile + heading + text, three times, the generated-landing-page look -->
<div class="grid">
  <div class="card"><div class="icon-tile">⚡</div><h3>Fast</h3><p>...</p></div>
  <div class="card"><div class="icon-tile">🔒</div><h3>Secure</h3><p>...</p></div>
  <div class="card"><div class="icon-tile">📈</div><h3>Scalable</h3><p>...</p></div>
</div>

<!-- AFTER — vary weight, let one item lead, use dividers and rhythm instead of three boxes -->
<section class="features">
  <div class="feature feature--lead"><h3>Fast</h3><p>The thing it actually does, specifically.</p></div>
  <hr />
  <div class="feature"><h3>Secure</h3><p>...</p></div>
  <div class="feature"><h3>Scalable</h3><p>...</p></div>
</section>
```

## 6. Bounce easing + animating layout
```css
/* BEFORE — overshoot easing on a layout property = toy-like and janky */
.panel { transition: width 300ms cubic-bezier(0.34, 1.56, 0.64, 1); }

/* AFTER — ease-out on transform/opacity only */
.panel { transition: transform 200ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms; }
```
