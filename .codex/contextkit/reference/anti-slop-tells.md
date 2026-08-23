# The Anti-Slop Catalog

The 37 specific things that make a site look AI-made, and exactly what to do instead.
Distilled from `impeccable` + `baseline-ui`. `/design-check` scans for these; `/polish` fixes them.

> **The governing test:** if someone could look at your screen and say "AI made that" with no
> doubt, it failed. The bar is not "looks fine," it's "you can't tell how it was made."

## Typography
1. **Overused font** (Inter, Roboto, Geist, Plus Jakarta, Space Grotesk, Fraunces) → pick a font with a voice from a real catalog (Pangram Pangram, Klim, Velvetyne). Choose from 3 brand words, reject the reflex pick.
2. **One font for everything** (no hierarchy) → pair on a contrast axis (serif + sans, geometric + humanist), or one family across many weights. Never two similar sans.
3. **Flat hierarchy** (14/15/16px muddy steps) → fewer sizes, ratio ≥1.25, combine size + weight + color + space.
4. **Italic serif display hero** (oversized Playfair/Fraunces italic) → set it roman, or non-serif; keep only if literally editorial.
5. **Oversized H1** (a whole sentence blown to display size) → shrink it or cut the words; display size is for 1-2 words.
6. **Crushed tracking** (tighter than -0.04em, letters touching) → tighten optically, not destructively.
7. **Hero eyebrow / pill chip** (tiny uppercase label above the headline) → fold it into the headline or drop it.
8. **Repeated section kickers** ("ABOUT / PROCESS / PRICING" over every section) → use structure or imagery, not the same eyebrow each time.
9. **Numbered markers (01/02/03)** on every section → numbers only when it's a real sequence.
10. **All-caps or wide-tracked body** (>0.05em) → reserve caps + wide tracking for short labels only.
11. **Tiny body text** (<14px) → 16px body, 14px floor, always `rem`.

## Color
12. **AI palette** (purple/violet gradients, cyan-on-dark) → one deliberate hue, not blue-by-reflex.
13. **Cream/beige default surface** (the warm near-white `--paper/--sand`) → a saturated brand body, a true off-white, or a brand-tinted mid-tone; carry warmth via accent/type/imagery.
14. **Gradient text** (`background-clip: text`) → solid color; emphasis via weight/size.
15. **Dark mode with glowing accents** (colored box-shadow glows) → depth from lighter surfaces, not glow.
16. **Gray text on a colored background** (washed out) → a darker shade of the background's own hue, or near-white.
17. **Reflex-tinted neutrals** (always-warm gray) → tint toward *this brand's* hue, or stay truly neutral.

Rules under the hood: use **OKLCH**, body contrast **≥4.5:1** (large/bold ≥3:1, placeholders 4.5:1), pick a color *strategy* first (restrained / committed / full / drenched), accents work because they're rare (~10%).

## Layout & components
18. **Side-stripe border** (a colored `border-left`/`border-right`) → the single most recognizable tell. Use a full hairline border, a 4-8% tint, a leading number/glyph, or nothing.
19. **Border accent on a rounded card** (stripe fighting the radius) → remove one.
20. **Nested cards / identical card grids** (icon + heading + text, repeated forever) → spacing, dividers, and type instead; vary sizes, span columns, mix in non-card content. Nested cards are always wrong.
21. **Icon-tile-above-heading** (a rounded-square icon box over every heading) → icon beside the heading, or in the flow.
22. **Hero-metric template** (big number / small label / gradient) → only with real data, and rework the composition.
23. **Monotonous spacing** (same gap everywhere) → tight within groups (8-12px), generous between sections (48-96px), from a **4pt scale** (4/8/12/16/24/32/48/64/96).
24. **Cramped padding / content on the viewport edge** → ≥12-16px inside containers, 24-32px page padding or `max-width` + center.
25. **Glassmorphism by default** (decorative blur) → rare and purposeful, or none.
26. **Hairline border + wide diffuse shadow together** (the generated-UI signature) → commit to one: a defined edge OR soft elevation.

## Motion
27. **Bounce / elastic easing** → ease-out curves (`cubic-bezier(0.25,1,0.5,1)`).
28. **Uniform fade-on-scroll on every section** → reserve scroll motion for moments that earn it; a small stagger in a list is fine.
29. **Animating layout props** (width/height/top/margin = jank) → animate only `transform`/`opacity`.
30. **Image hover scale/rotate** → let imagery sit still, or use something subtler.

Rules: 150-250ms for feedback, exit ~75% of enter, never exceed 200ms for micro-feedback, `prefers-reduced-motion` is not optional.

## Copy
31. **Em-dash overuse** (more than ~2 in body text) → commas, colons, periods, parentheses.
32. **Marketing buzzwords** (streamline, empower, supercharge, world-class, next-generation) → a specific verb + noun that says what it literally does.
33. **Aphoristic cadence** ("Not a feature. A platform." / "X. Just Y." on repeat) → once is fine; vary the rhythm.
34. **Theater framing** (copy that performs instead of informs) → say plainly what it does and doesn't do.

## Imagery & icons
35. **Broken/placeholder image, or a colored `<div>` where a photo belongs** → real assets, or verified Unsplash; search the *physical object* ("handmade pasta on scratched wood," not "Italian food"); one decisive photo beats five mediocre ones.
36. **Mixed icon styles / unlabeled icon-only buttons** → one icon family; `aria-label` on every icon button.
37. **Repeating-gradient decorative stripes** → deliberate texture or a plain surface.
