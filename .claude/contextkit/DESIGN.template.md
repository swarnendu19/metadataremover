# <Project name> — design source of truth

> Your AI reads this before designing any screen. It is what stops your app from looking
> AI-made. Run `/design-intake` to fill it in by interview, or fill it in yourself.

```yaml
register: product        # "brand" (landing/marketing, design IS the pitch) or "product" (app, design gets out of the way)
colors:                  # use OKLCH or hex. body + muted text must be >= 4.5:1 contrast on bg
  bg: "#______"
  surface: "#______"     # cards/panels (a different value than bg, not pure white-on-white)
  ink: "#______"         # body text
  muted: "#______"       # secondary text (still >= 4.5:1)
  accent: "#______"      # used on AT MOST ~10% of any screen
typography:
  display: { family: "<a font with a voice, NOT Inter/Geist/Roboto>", weight: 700, tracking: "-0.02em" }
  body:    { family: "<paired on a contrast axis>", size: "16px", line_height: 1.5 }
  scale_ratio: 1.25      # >= 1.25, never a flat 14/15/16 ladder
spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96]   # 4pt scale; tight within groups, generous between sections
radius: "12px"
motion: subtle           # still | subtle | lively. feedback 150-250ms, ease-out, no bounce
```

## Creative North Star
<One line for the feel, a metaphor, e.g. "a calm editorial magazine, not a SaaS dashboard.">

## References / anti-references
- **Feels like:** <2-3 named real sites or products>
- **Must NOT feel like:** <named anti-references — be specific. "Generic violet-gradient SaaS" is the most useful line here; it's how the AI avoids its defaults.>

## Named rules (the non-negotiables for this project)
- One accent color, at most ~10% of any screen.
- Body text always >= 4.5:1 contrast.
- No gradients, no glow, no bounce easing, unless this file explicitly says so.
- Spacing comes from the 4pt scale above. No random values.
- <add your own>

## Do's and don'ts
- **Do:** <the moves that fit the North Star>
- **Don't:** <your anti-references, written out, plus the slop tells you keep hitting (see `reference/anti-slop-tells.md`)>
