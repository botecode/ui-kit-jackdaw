# Jackdaw UI Kit — Phase 1: Scaffold + Foundations

**Date:** 2026-06-17
**Scope:** Project scaffold, token system, ThemeProvider, motion primitives, gallery shell, Tokens page, Design Language page.
**Not in scope:** Any component implementation. `components/` exists as an empty directory with the convention established.
**Next phase:** Phase 2 — Primitive controls (Fader, PanKnob, MuteSoloToggle, ArmButton, Meter, TransportBar/Clock, SnapToggle, Toggle/Stepper, Badge, icons).

---

## 1. What Phase 1 delivers

A working Vite + React + TypeScript project at `ui-jackdaw/` containing:

- The complete token system (14 themes, structural globals, reset)
- A `ThemeProvider` that makes any subtree theme-switchable
- A three-layer motion system (CSS / rAF / custom spring)
- A gallery shell (sidebar + stage, hash routing, auto-discovery, compare mode)
- Two live pages: Tokens (visual token reference) and Design Language (the "what makes a Jackdaw control" doc)
- `DemoShell` and `StatesGrid` gallery utilities, ready for Phase 2 components

The Tokens page rendering correctly under live theme-switching is the Phase 1 proof. If every swatch updates instantly and the motion demos feel right, the foundation holds.

---

## 2. Project structure

```
ui-jackdaw/
├── src/
│   ├── tokens/
│   │   ├── types.ts              # ThemeTokens interface + ThemeId (the contract, isolated)
│   │   ├── themes/
│   │   │   ├── index.ts          # THEMES registry (ThemeMeta[])
│   │   │   ├── default.ts
│   │   │   ├── bowie.ts
│   │   │   ├── bubble-gum-pop.ts
│   │   │   ├── buckley.ts
│   │   │   ├── gil.ts
│   │   │   ├── golden-hour.ts
│   │   │   ├── ink.ts
│   │   │   ├── manuscript.ts
│   │   │   ├── nocturne.ts
│   │   │   ├── pine.ts
│   │   │   ├── reaper.ts
│   │   │   ├── songwriter.ts
│   │   │   ├── techno.ts
│   │   │   └── tropicalia.ts
│   │   ├── global.css            # structural tokens in :root + prefers-reduced-motion
│   │   └── reset.css             # minimal reset (box-sizing, margin, font-smoothing)
│   ├── theme/
│   │   └── ThemeProvider.tsx     # applies per-theme CSS vars inline; data-theme for overrides
│   ├── motion/
│   │   └── spring.ts             # ~30-line critically-damped spring hook
│   ├── components/               # empty in Phase 1 — convention established here
│   │   └── .gitkeep
│   ├── gallery/
│   │   ├── App.tsx               # root: sidebar (fixed default theme) + stage (active theme)
│   │   ├── App.css
│   │   ├── Sidebar.tsx           # nav generated from glob registry + planned list
│   │   ├── Sidebar.css
│   │   ├── Stage.tsx             # renders active page; compare mode
│   │   ├── Stage.css
│   │   ├── registry.ts           # import.meta.glob auto-discovery of *.demo.tsx
│   │   ├── planned.ts            # static list of planned-but-not-yet-built items
│   │   ├── useHashRoute.ts       # 10-line hash router hook
│   │   ├── pages/
│   │   │   ├── Tokens.tsx        # Phase 1 deliverable: visual token reference
│   │   │   ├── Tokens.css
│   │   │   ├── DesignLanguage.tsx
│   │   │   └── DesignLanguage.css
│   │   └── ui/
│   │       ├── DemoShell.tsx     # demo wrapper: receives meta, theme prop, compare-aware
│   │       ├── DemoShell.css
│   │       ├── StatesGrid.tsx    # renders the 9-state grid (DoD check surface)
│   │       ├── StatesGrid.css
│   │       ├── Playground.tsx    # prop controls container
│   │       └── ThemeSwitcher.tsx # native <select> for Phase 1; replaced in Phase 2
│   └── main.tsx
├── public/
│   └── fonts/                    # self-hosted: Cabinet Grotesk, General Sans, Space Mono
├── schema.json                   # reference only (read-only bridge contract)
├── types.ts                      # reference only (bridge TypeScript types)
├── MARKETING.md                  # reference only (brand voice)
├── vite.config.ts                # path aliases: @bridge → ./types.ts, @tokens → ./src/tokens
├── tsconfig.json                 # strict: true
└── package.json                  # deps: react, react-dom, vite, typescript — nothing else
```

---

## 3. Styling method (written decision)

**CSS Modules + CSS custom properties. No Tailwind. No CSS-in-JS.**

Every component's own styles live in a co-located `.css` file, imported as a CSS Module. Component styles reference only `var(--token-name)` — never a hardcoded color, size, duration, or font. This is the approach that will replace Tailwind in the real `ui/` progressively as components land there.

This is an explicit decision, not an emergent one. The shelf defines the new UI approach; its method wins.

---

## 4. Per-component folder convention

Established in Phase 1, before the first component is built.

```
src/components/<ComponentName>/
├── <ComponentName>.tsx       # the component
├── <ComponentName>.css       # CSS Module — travels with the component into ui/
├── <ComponentName>.demo.tsx  # gallery demo — stays in the shelf, never drops into ui/
└── index.ts                  # re-exports the component (not the demo)
```

When a component moves to `ui/`, the `index.ts`, `.tsx`, and `.css` files travel together. The `.demo.tsx` is shelf-only and is never part of the drop-in.

---

## 5. Token system

### 5a. `tokens/types.ts` — the contract

Identical interface to the real app's `ThemeTokens`. Zero changes to the real app. This is the shared contract that makes components drop-in.

```ts
export interface ThemeTokens {
  // Theme-identity tokens — vary per theme (color + radius)
  "--bg": string;
  "--surface": string;
  "--surface-2": string;
  "--rail-bg": string;
  "--panel-bg": string;
  "--arrange-bg": string;
  "--strip-bg": string;
  "--strip-mini-timeline": string;
  "--menu-bg": string;
  "--footer-bg": string;
  "--meter-track-bg": string;
  "--border": string;
  "--border-strong": string;
  "--text": string;
  "--text-muted": string;
  "--text-dim": string;
  "--accent": string;
  "--accent-contrast": string;
  "--accent-green": string;
  "--accent-green-dim": string;
  "--rail-indicator": string;
  "--radius": string;  // radius is theme-identity: techno=2px, tropicália=12px
}

export type ThemeId =
  | "default" | "bowie" | "bubble-gum-pop" | "buckley" | "gil"
  | "golden-hour" | "ink" | "manuscript" | "nocturne" | "pine"
  | "reaper" | "songwriter" | "techno" | "tropicalia";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tokens: ThemeTokens;
}
```

### 5b. `tokens/themes/*.ts` — 14 per-theme maps

Values copied verbatim from the real app. Each file exports a plain `ThemeTokens` object. When the real app changes a theme, the shelf mirrors it. Long-term plan: generate both from a shared source to prevent drift.

### 5c. `tokens/global.css` — structural tokens

Structural tokens are fixed across themes. They live in `:root` and are not part of `ThemeTokens`. A theme may override a structural token via the `[data-theme]` selector — but only color/radius changes belong in the theme object.

```css
/* tokens/global.css */

/* Self-hosted fonts — bundled, no CDN dependency (desktop WebView) */
/* Variable fonts need the weight axis range declared or font-weight tokens silently no-op */
@font-face {
  font-family: "Cabinet Grotesk";
  src: url("/fonts/CabinetGrotesk-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "General Sans";
  src: url("/fonts/GeneralSans-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
/* Space Mono is static (not variable) — two separate face declarations */
@font-face {
  font-family: "Space Mono";
  src: url("/fonts/SpaceMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Space Mono";
  src: url("/fonts/SpaceMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}

:root {
  /* Type roles — three distinct purposes */
  --font-display: "Cabinet Grotesk", system-ui, sans-serif;  /* wordmark, headings, project title */
  --font-ui:      "General Sans", system-ui, sans-serif;      /* labels, body, controls */
  --font-mono:    "Space Mono", ui-monospace, monospace;      /* dB, clock, BPM, readouts */

  /* Type scale */
  --text-xs:      10px; --leading-xs: 1.2;   /* meter labels, tiny callouts */
  --text-sm:      11px; --leading-sm: 1.3;   /* secondary labels */
  --text-base:    13px; --leading-base: 1.5; /* primary UI text */
  --text-md:      15px; --leading-md: 1.4;
  --text-lg:      18px; --leading-lg: 1.3;   /* section headings */
  --text-display: 24px; --leading-display: 1.1; /* project title, feature heads */

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-bold:   600;

  /* Spacing — 4px base grid */
  --space-1:  4px;  --space-2:  8px;  --space-3:  12px;
  --space-4:  16px; --space-5:  20px; --space-6:  24px;
  --space-8:  32px; --space-10: 40px; --space-12: 48px;

  /* Motion — decorative layer (zeroed by prefers-reduced-motion) */
  --dur-fast:    80ms;   /* hover, toggle */
  --dur-base:    120ms;  /* most state transitions */
  --dur-slow:    200ms;  /* panel open, dialog */
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Elevation — dark-surface shadows */
  --shadow-sm: 0 1px 3px  hsl(0 0% 0% / 0.4);
  --shadow-md: 0 4px 12px hsl(0 0% 0% / 0.5);
  --shadow-lg: 0 8px 24px hsl(0 0% 0% / 0.6);

  /* Track color palette — cyclic spine assignment */
  --track-color-1: #e8a87c;  /* amber  */
  --track-color-2: #7ec8a4;  /* sage   */
  --track-color-3: #7eb8d4;  /* slate  */
  --track-color-4: #c4a0e4;  /* lavender */
  --track-color-5: #e4c84a;  /* gold   */
  --track-color-6: #e47a7a;  /* rose   */
}

/*
  Per-theme structural overrides — cascade escape hatch.
  Use only when a theme genuinely earns a structural difference.
  Color and radius belong in the theme's ThemeTokens object, not here.
  Examples (not yet active):
    [data-theme="manuscript"] { --font-ui: "Lora", Georgia, serif; }
    [data-theme="ink"]        { --font-ui: var(--font-mono); }
*/

/* prefers-reduced-motion: zero decorative durations; keep functional motion (playhead, meters) */
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast:  0ms;
    --dur-base:  0ms;
    --dur-slow:  0ms;
  }
}
```

### 5d. `tokens/reset.css`

Minimal reset: `box-sizing: border-box`, zero default margins, `-webkit-font-smoothing: antialiased`. Body `line-height` defaults to `1.5` — never `1` globally, which clips descenders on anything not explicitly overridden. `line-height: 1` is reserved for specific single-line controls (dB readout, button label) applied locally in the component's own CSS.

---

## 6. ThemeProvider

Applies the active theme's `ThemeTokens` as inline CSS custom properties. Inline styles are the highest-specificity source — this means `[data-theme]` overrides in `global.css` only affect **structural tokens** (which live in `:root`, not inline). Color and radius are changed in the theme object, not via `[data-theme]` selectors.

```tsx
// theme/ThemeProvider.tsx
import { THEMES } from '../tokens/themes';
import { defaultTheme } from '../tokens/themes/default';
import type { ThemeId } from '../tokens/types';

interface Props {
  theme: ThemeId;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: Props) {
  // Inline vars = highest specificity. data-theme enables structural overrides in global.css
  // only — color/radius are always changed in the theme object, never via [data-theme] rules.
  const tokens = THEMES.find(t => t.id === theme)?.tokens ?? defaultTheme;
  return (
    <div data-theme={theme} style={tokens as React.CSSProperties}>
      {children}
    </div>
  );
}
```

---

## 7. Motion system

Three layers with distinct responsibilities. No animation library dependencies.

### Layer 1 — CSS transitions (state changes)

Hover, focus, active, toggle, disabled, panel open/close. Authored in component CSS modules referencing `--dur-*` and `--ease-*` tokens. The `prefers-reduced-motion` block in `global.css` zeroes all `--dur-*` values — one declaration covers every component automatically, no per-component media queries.

```css
/* example — in a component's .css */
.cap { transition: transform var(--dur-fast) var(--ease-out); }
```

### Layer 2 — rAF (real-time + drag)

Playhead sweep, meter levels, waveform scroll, clip dragging — all `value → transform` mappings. No easing, no library. Each frame reads from a ref (not a closure const, which goes stale) and writes a GPU transform. Always cancel the loop on unmount.

Pattern (used directly in each component that needs it, not a shared hook):
```ts
const posRef = useRef(seconds);
posRef.current = seconds;

useEffect(() => {
  let id: number;
  const tick = () => {
    el.current!.style.transform = `translateX(${posRef.current * pxPerSecond}px)`;
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}, [pxPerSecond]);
```

Implementation note: the loop currently re-writes the transform every frame even when the value hasn't changed (a paused playhead re-writes the same pixel 60×/s). Pause the loop when there's nothing to animate — cancel on value stability, restart on value change. Small battery/perf win on a desktop app.

Future note: if visible meters multiply, a single shared ticker with subscribers is cleaner than many independent loops.

### Layer 3 — custom spring (settle with weight)

Used for the 2–3 moments that need physical weight: clip easing to snap position, knob settling to detent, resize divider releasing. Critically damped — zero overshoot is the rule. **Weight ≠ bounce. An instrument settles with authority.**

```ts
// motion/spring.ts
import { useState, useRef, useEffect } from 'react';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Config { stiffness?: number; damping?: number; }

export function useSpring(target: number, { stiffness = 200, damping = 30 }: Config = {}) {
  // damping 30 at stiffness 200 → ζ ≈ 1.06 (just past critical: firm, zero overshoot)
  // For heavier settles (resize divider): { stiffness: 120, damping: 22 } → ζ ≈ 1.0
  //
  // UNIT CONTRACT: target must be in pixels. The settle epsilon (0.01) assumes pixel
  // values — it would cause ~1% early settle on a normalized 0–1 input. If you ever
  // need to spring a normalized value, scale to pixels first (e.g. multiply by track
  // height) and convert back after reading the return value.
  const [value, setValue] = useState(target);
  const state = useRef({ pos: target, vel: 0 });
  const rafId = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      state.current = { pos: target, vel: 0 };
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30); // cap: 30fps minimum
      last = now;
      // Symplectic (semi-implicit) Euler — more stable than explicit for springs
      const force = stiffness * (target - state.current.pos) - damping * state.current.vel;
      state.current.vel += force * dt;   // velocity first
      state.current.pos += state.current.vel * dt; // position with new velocity
      if (Math.abs(target - state.current.pos) < 0.01 && Math.abs(state.current.vel) < 0.01) {
        setValue(target);
        state.current = { pos: target, vel: 0 };
        return;
      }
      setValue(state.current.pos);
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, stiffness, damping]);

  return value;
}
```

---

## 8. Gallery shell

### 8a. Layout and chrome/stage split

The sidebar always renders on the fixed `default` theme — a stable neutral frame. Only the stage is theme-switchable. This lets you judge a component's appearance without the whole tool re-skinning.

```tsx
// gallery/App.tsx
export function App() {
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem('jd-gallery-theme') as ThemeId) ?? 'default'
  );
  const handleThemeChange = (t: ThemeId) => {
    setTheme(t);
    localStorage.setItem('jd-gallery-theme', t);
  };
  return (
    <>
      <ThemeProvider theme="default">          {/* sidebar: always neutral */}
        <Sidebar theme={theme} onThemeChange={handleThemeChange} />
      </ThemeProvider>
      <ThemeProvider theme={theme}>            {/* stage: active theme */}
        <Stage />
      </ThemeProvider>
    </>
  );
}
```

```css
/* gallery/App.css */
#root {
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100vh;
  overflow: hidden;
}
```

Implementation note: the two `ThemeProvider` divs are direct children of `#root` and become the grid items. Make sure `height: 100%` and `overflow-y: auto` flow through them to the actual scroll containers. If layout gets awkward, `display: contents` on the provider div makes `Sidebar`/`Stage` the grid items directly — custom properties still inherit through `display: contents`.

### 8b. Hash routing

```ts
// gallery/useHashRoute.ts
export function useHashRoute() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/tokens');
  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/tokens');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return path;
}
```

Default route: `/tokens`. Navigation is plain `<a href="#/fader">` links — no JS router, fully bookmarkable.

### 8c. Auto-discovery registry

```ts
// gallery/registry.ts
const modules = import.meta.glob('../components/**/*.demo.tsx', { eager: true });

export interface DemoMeta {
  name: string;
  group: 'Foundations' | 'Primitives' | 'Composites';
  route: string;
  order: number;
}
export interface DemoModule {
  meta: DemoMeta;
  default: React.ComponentType;
}

export const DEMOS = Object.values(modules) as DemoModule[];
export const DEMO_MAP: Record<string, React.ComponentType> =
  Object.fromEntries(DEMOS.map(d => [d.meta.route, d.default]));
```

```ts
// gallery/planned.ts — items not yet built, rendered as dim non-links in the sidebar
export const PLANNED: Array<Pick<DemoMeta, 'name' | 'group' | 'route'>> = [
  { name: 'Fader',          group: 'Primitives',  route: '/fader' },
  { name: 'PanKnob',        group: 'Primitives',  route: '/pan-knob' },
  { name: 'Meter',          group: 'Primitives',  route: '/meter' },
  { name: 'MuteSoloToggle', group: 'Primitives',  route: '/mute-solo' },
  { name: 'ArmButton',      group: 'Primitives',  route: '/arm-button' },
  { name: 'TransportBar',   group: 'Primitives',  route: '/transport' },
  { name: 'Clip',           group: 'Primitives',  route: '/clip' },
  { name: 'TimelineRuler',  group: 'Primitives',  route: '/timeline-ruler' },
  { name: 'InputSelect',    group: 'Primitives',  route: '/input-select' },
  { name: 'FXChip',         group: 'Primitives',  route: '/fx-chip' },
  { name: 'ContextMenu',    group: 'Primitives',  route: '/context-menu' },
  { name: 'Dialog',         group: 'Primitives',  route: '/dialog' },
  { name: 'Tooltip',        group: 'Primitives',  route: '/tooltip' },
  { name: 'Toggle',         group: 'Primitives',  route: '/toggle' },
  { name: 'Badge',          group: 'Primitives',  route: '/badge' },
  { name: 'TrackHeader',    group: 'Composites',  route: '/track-header' },
  { name: 'FolderTrackHeader', group: 'Composites', route: '/folder-track-header' },
  { name: 'TrackLane',      group: 'Composites',  route: '/track-lane' },
  { name: 'FocusedTrackDetailPanel', group: 'Composites', route: '/focus-panel' },
  { name: 'ThemeSwitcher',  group: 'Composites',  route: '/theme-switcher' },
  { name: 'ProjectPicker',  group: 'Composites',  route: '/project-picker' },
];
```

Sidebar merges `DEMOS` (live links) with `PLANNED` (dim, no `href`). No registry file to maintain — adding a `.demo.tsx` file is all it takes for a component to appear.

### 8d. Demo contract (established before first component)

Every `.demo.tsx` must export `meta` and a default component following this shape:

```tsx
// src/components/<Name>/<Name>.demo.tsx
import type { DemoMeta } from '../../gallery/registry';
import { DemoShell } from '../../gallery/ui/DemoShell';
import { StatesGrid, State } from '../../gallery/ui/StatesGrid';
import { Playground } from '../../gallery/ui/Playground';

export const meta: DemoMeta = {
  name: 'Fader',
  group: 'Primitives',
  route: '/fader',
  order: 1,
};

export default function FaderDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesGrid>
        <State label="default">  {/* ... */} </State>
        <State label="hover">    {/* ... */} </State>
        <State label="focus">    {/* ... */} </State>
        <State label="active">   {/* ... */} </State>
        <State label="disabled"> {/* ... */} </State>
        <State label="selected"> {/* ... */} </State>
        <State label="error">    {/* ... */} </State>
        <State label="empty">    {/* ... */} </State>
        <State label="loading">  {/* ... */} </State>
      </StatesGrid>
      <Playground>
        {/* prop controls */}
      </Playground>
    </DemoShell>
  );
}
```

The states grid is the mechanical DoD check surface. All 9 states must be present before a component is considered done.

### 8e. Stage — normal and compare modes

```tsx
// gallery/Stage.tsx (abridged)
export function Stage() {
  const route = useHashRoute();
  const [compareMode, setCompareMode] = useState(false);
  const COMPARE_THEMES: ThemeId[] = ['default', 'bowie', 'tropicalia', 'manuscript', 'ink'];

  const Page = DEMO_MAP[route] ?? pageFallback(route);

  if (compareMode) {
    return (
      <div className={styles.compareGrid}>
        {COMPARE_THEMES.map(t => (
          <div key={t} className={styles.compareCell}>
            <div className={styles.compareLabel}>{t}</div>
            <ThemeProvider theme={t}><Page /></ThemeProvider>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.stage}>
      <header className={styles.stageHeader}>
        <button onClick={() => setCompareMode(true)}>Compare themes</button>
      </header>
      <Page />
    </div>
  );
}
```

Compare mode tiles the active component under 5 themes simultaneously. This is the "looks crafted in every theme" check made mechanical.

---

## 9. Tokens page (Phase 1 deliverable)

Seven sections, all live-updating on theme switch. This page is the proof the foundation works.

1. **Color** — every `ThemeTokens` key rendered as a labelled swatch with the token name, current hex value, and a readable/unreadable sample (`--text` on `--bg`/`--surface`, `--accent-contrast` on `--accent`). Catches unreadable theme combinations.

2. **Type scale** — each `--text-*` size shown in all three font roles (`--font-display`, `--font-ui`, `--font-mono`) with a representative sample string. The mono samples use numeric characters (`1234567890 dB`).

3. **Spacing** — each `--space-*` rendered as a filled bar at the exact pixel width so the rhythm is visible and the scale reads as intentional.

4. **Radius** — the current theme's `--radius` applied to a row of sample boxes (surface color fill). Makes the techno/tropicália character difference immediately visible.

5. **Elevation** — three boxes showing `--shadow-sm/md/lg` against the current `--surface` color.

6. **Motion** — three boxes, each animating on click with one `--dur-*` value (fast/base/slow). Includes the two easing tokens as side-by-side visual comparisons. A live badge shows whether `prefers-reduced-motion` is active so the zeroed path is testable without OS settings.

7. **Track palette** — six `--track-color-*` swatches. Simple, shows the per-track spine palette.

---

## 10. Design Language page

A living reference rendered in the gallery. The seven rules that define a Jackdaw control:

1. **No default browser inputs.** Every control is bespoke. A `<input type="range">` is never a fader.
2. **Tokens only — no hardcoded values.** No color, radius, duration, or font is literal in a component stylesheet.
3. **Hairline top-highlight.** Every raised surface implies a single soft light source above it. A `1px` highlight on the top edge, slightly lighter than the surface, is the tell.
4. **Recessed groove for readouts.** Meters, dB displays, clock, BPM — all sit in an inset (inset `box-shadow`) that reads as recessed into the surface. Depth without bevels.
5. **Weight ≠ bounce.** Motion settles with authority. Critically damped, zero overshoot. A bouncy spring is the tell of a toy; an instrument settles once and stops.
6. **The "why isn't this a webpage?" check.** Before shipping any control, ask the question. If you can't answer it, the control needs more craft.
7. **Every control acknowledges input.** Micro-interactions: hover, active, focus states are non-negotiable. Tiny, fast, purposeful — the control is alive under your hand.

---

## 11. Definition of done for Phase 1

- [ ] `npm run dev` starts the gallery with no errors
- [ ] `npm run build` produces a clean build (TypeScript strict, no errors)
- [ ] All 14 theme maps present, values matching the real app's themes verbatim
- [ ] Tokens page renders all seven sections; live theme switch updates every swatch instantly
- [ ] `prefers-reduced-motion` indicator on the motion section shows the correct state
- [ ] Color section shows readable/unreadable sample pairs — all 14 themes pass (no unreadable text/accent combinations)
- [ ] Sidebar renders Foundations items as live links, Primitives/Composites as dimmed planned items
- [ ] Compare mode tiles the active page under 5 themes simultaneously
- [ ] Theme persists across page reload via localStorage
- [ ] `useSpring` snaps to target immediately under `prefers-reduced-motion: reduce`
- [ ] Design Language page renders all 7 rules
- [ ] `components/` directory has the convention documented and `.gitkeep` in place
- [ ] Self-hosted fonts load correctly (Cabinet Grotesk, General Sans, Space Mono)
- [ ] No external dependencies beyond react, react-dom, vite, typescript

---

## 12. What this phase explicitly does NOT include

- Any component implementation (Fader, Meter, TransportBar, etc.)
- Bridge wiring or engine communication
- The bespoke ThemeSwitcher component (Phase 2 — native `<select>` for now)
- The bespoke Dropdown/InputSelect component (Phase 2)
- Icon set or jackdaw-eye mark (Phase 2)
- Any animation beyond what's needed for the motion section demo on the Tokens page
