# Marquee — design

**Kit, web surface.** An infinite horizontal scrolling ticker — the tactile motion that
makes the marketing page feel alive (TE / Hologram register). Scrolls a row of items
(keywords or small logos) in a seamless loop. Pause on hover, configurable speed +
direction, edge fade-out masks at both ends, respects `prefers-reduced-motion`. CSS-driven
motion, no animation library. Drops into the site.

## The bar

A first-time viewer thinks *"this is a beautiful instrument,"* not *"nice webpage."* The
marquee is the page's heartbeat: a quiet, continuous mono ticker reading off the warm
cream surface, with a small recessed LED dot punctuating each item — the way a piece of
hardware idles. Not a flashy web banner.

## Contract (props)

```ts
interface MarqueeProps {
  items: React.ReactNode[]          // text keywords OR small logo nodes
  speed?: number                    // pixels / second, default 60 — constant velocity
  direction?: 'left' | 'right'      // default 'left'
  pauseOnHover?: boolean            // default true
  size?: 'sm' | 'md'                // default 'md'
  className?: string
  'aria-label'?: string             // default 'Marquee'
}
```

This is a web-surface marketing component — it has no bridge-contract data shape. `items`
is the real shape it consumes: an ordered list of nodes (strings render as the mono ticker
type; arbitrary nodes — e.g. logos — pass through untouched).

## Decisions (resolved headless against KIT-LEAD.md)

1. **Speed = pixels/second (numeric), not a duration or a slow/normal/fast enum.** A
   ticker must hold *constant velocity* regardless of how much content it carries — that's
   the instrument-grade choice. JS measures one content copy's width (`offsetWidth`) in a
   `useLayoutEffect` and sets `--marquee-duration = width / speed` seconds. The animation
   itself runs entirely in CSS (`@keyframes` translateX) — no animation library. Width is
   re-measured on resize via `ResizeObserver` when available (guarded for jsdom).

2. **Seamless loop = duplicated content track.** Items render twice inside one flex track;
   the track animates `translateX(0) → translateX(-50%)` (= exactly one copy's width) and
   restarts invisibly. The second copy is `aria-hidden` so SR reads each item once.

3. **Built-in separator dot between items.** A small recessed→`--accent` LED dot trails
   every item (including the last, so the wrap is continuous). This is the single most
   ticker-like, most Chroma-consistent touch — punctuation that reads as hardware, not a
   bare word list. Decorative, `aria-hidden`.

4. **Default text type = `--font-mono`, uppercase, tracked.** Mono is the kit's digital
   readout / personality layer; a keyword ticker is exactly that register. Logo/node items
   are not restyled.

5. **Edge fade = CSS `mask-image`** (linear-gradient, transparent→opaque→opaque→transparent)
   on the viewport. Alpha mask, so it needs no color token and works in every theme. Fade
   width is a local token defaulting to `--space-12`, narrower at `sm`.

6. **`prefers-reduced-motion` → stop + static.** The scroll is *decorative* motion, so
   under reduced motion it stops entirely: the component renders a **single** static track
   (no clone), `data-reduced` set, animation `none`, edge fades retained. Detected with a
   small inline `matchMedia` hook (no shared hook exists in the kit yet).

7. **Pause on hover via pure CSS** — `:hover .track { animation-play-state: paused }`,
   gated on `data-pause-on-hover`. No JS.

8. **`items` keyed by index.** The list is a static, ordered marketing row (no reorder /
   insert), so index keys are correct and avoid forcing callers to wrap nodes.

## States (gallery)

default (rolling left), rolling right, paused (hover), reduced-motion (static),
fast / slow speed, logo-node items, sm, empty (`items=[]` → renders nothing visible),
long list. Verified Chroma (light) + Ink/Nocturne (dark) + one more via Compare.

## Files

`Marquee.tsx`, `Marquee.module.css`, `Marquee.test.tsx` (render + reduced-motion, fireEvent),
`Marquee.demo.tsx` (all states, dogfooded Toggle/Checkbox controls), `index.ts`.
Auto-registers via `import.meta.glob`. Group `Composites`.
