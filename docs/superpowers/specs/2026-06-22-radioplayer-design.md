# RadioPlayer — design spec (2026-06-22)

App-surface "personal radio station" hero. Your ideas play on loop like a Walkman/Discman tuned to your
own station. A recessed black LED panel shows `▸ ON AIR`, the idea title, and a ticking time in green
dot-matrix; below sits tactile transport (play/pause + next). Follows app-kit-foundation.

## The bar
A first-time viewer touches hardware, not a webpage. The readout is the centerpiece — an authentic
green-on-black LED **dot-matrix**, not styled web text. It must read gorgeous in every theme on tokens
alone (LED green + the black `--stage` panel).

## Anatomy
- **Readout panel** — recessed `--stage` well, faint scanline + an off-dot grid (SVG `<pattern>`), inset
  shadow, hairline top-highlight.
  - **Status + time row** — left: a dot-matrix status glyph + word (`▸ ON AIR` / `‖ PAUSED` / `» NEXT`
    / `OFF AIR`); right: the time in larger dot-matrix `M:SS`.
  - **Title row** — the idea title in dot-matrix. Scrolls right→left at constant velocity (LED ticker)
    **only when it overflows** the panel; otherwise static, left-aligned.
- **Transport** — kit `TransportButton variant="play"` (green bloom when rolling) + a local recessed
  **next** button (Phosphor `SkipForward`) to skip to the next idea.

## Dot-matrix renderer (the craft)
- A hand-authored **5×7 font** (`radioFont.ts`) written ROW-major as `'#'/'.'` strings so the glyph
  shapes are auditable in source, converted to lit `[col,row]` cells at module load. Covers space, A–Z,
  0–9, `: . - ' /` and three status glyphs (play ▸, pause ‖, skip ▸|). Titles are uppercased — the
  authentic LED-sign look and a smaller glyph set to maintain.
- Rendered as **one SVG per block**: a single `<rect fill=url(#offdots)>` paints the full dim off-grid
  (1 node, perfectly aligned), lit cells are `<rect>`s on top in `--led-green`, with one group-level
  `drop-shadow` for bloom. Off dots are a dim green tint so dormant cells hint their color (mirrors
  DotMatrix's ghost layer).
- Scroll = translate the lit `<g>` via CSS at a width-measured constant velocity (Marquee's px/sec
  model). Reduced motion → no scroll, the title sits static and clips.

## Contract (props = data, callbacks = intents)
```ts
interface RadioTrack { id: string; title: string; duration?: number; artist?: string }
interface RadioPlayerProps {
  tracks: RadioTrack[]
  index: number          // idea now on air (host/store owned)
  playing: boolean       // rolling?
  elapsed?: number        // seconds into current idea (host clock); default 0
  size?: 'sm' | 'md'
  disabled?: boolean
  onPlayPause?: (playing: boolean) => void  // user toggled
  onNext?: () => void                         // user skipped to next idea
}
```
**Controlled, view + intent emitter** — the host store owns `index`/`playing`/`elapsed` exactly like a
real now-playing store, so it drops into the app with zero rework. The "continuous loop" + ticking is
demonstrated by the demo's host clock (a `setInterval`) advancing `elapsed` and wrapping `index`. The
component does NOT own audio (that's `DemoPlayer`'s job) — it is the station's face.

## States (all in the gallery)
playing (ON AIR, time ticking), paused, next/transition (brief readout flicker + title wipe on `index`
change), long-title scrolling, focus (transport ring), disabled (OFF AIR, dim), empty (no tracks →
OFF AIR), sm. Verified light + dark; phone-frame (`ProductFrame variant="phone"`) preview.

## Decisions (Chroma-consistent, recorded per headless brief)
- **LED green + black panel** via `--led-green*` / `--stage` tokens, never hardcoded. Off dots are a
  `color-mix` green tint so the panel reads "powered" even when dark.
- **Transition** is internal (set on `index` change, cleared ~360ms) → `data-transition`; reduced motion
  skips it. No new prop — it's a visual consequence of the idea changing.
- **Next button local, not a new TransportButton variant** — keep the shared component additive-free;
  the card asks for next *here*. Momentary action → recessed, no lit state, relabels nothing
  (aria-label "Next idea").
- **One ARIA model**: play/pause relabels (no aria-pressed, via TransportButton); next is a plain action
  button. Readout exposed as `role="status"` `aria-live="off"` with an `aria-label` summarising on-air
  idea + time (no dot-spam to AT).
- Reduced motion: scroll → static/truncate; transition flicker → none; the green bloom + per-second time
  tick stay (functional, state-carrying).
