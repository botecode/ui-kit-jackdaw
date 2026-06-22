# DemoPlayer — design

**Date:** 2026-06-22 · **Kind:** kit, Composites · **Branch:** kit/demoplayer

A web-surface component for the kit gallery / marketing site: let a visitor *hear* a demo
made in Jackdaw, right on the page. It plays a real audio source and shows a tactile,
instrument-grade transport — a waveform that fills as it plays, a green-LED play control,
a mono time readout, and a track label. The waveform doubles as the scrubber.

This is the one kit component that is genuinely a *web* surface (it lives on the site, not
in the app chrome), so it owns its own playback — but it stays an **instrument**, not a media
player chrome: recessed well, LED-lit transport, warm tokens, no chrome gradients.

## Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  ▎ label (track-color spine)                  0:42 / 2:18 │   ← header row
│  ┌──────┐  ┌──────────────────────────────────────────┐  │
│  │ ▶ /❚❚ │  │ ░░░░▓▓▓▓▓│··········  waveform well       │  │   ← transport + scrubber
│  └──────┘  └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- **Play/pause** — reuse `TransportButton variant="play" playing={isPlaying}`. Green LED bloom
  when rolling (the locked semantic: green = play/rolling). No `aria-pressed` (action button
  relabels Play↔Pause — the settled ARIA model).
- **Track label** — `--font-ui`, with a per-track **color spine** (the Chroma signature) tinted
  by the optional `color` prop (default `--accent`).
- **Time readout** — `--font-mono` (the digital readout), `current / duration`, `m:ss`.
- **Waveform well** — recessed `--stage` groove. Peaks drawn twice: a **recessed/unplayed**
  base (dim) and a **played overlay** clipped to progress width, lit in the track color/accent —
  this is the "played portion fills." A thin **playhead** glows at the boundary. The well IS the
  scrubber: `role="slider"`, click/drag to seek, arrow keys to seek.

## State machine (driven by the `<audio>` element)

`status ∈ { idle, loading, playing, paused, error }` + `scrubbing: boolean` + `currentTime`,
`duration`. The component is **self-driving** from the real audio element (the DOM `<audio>` is
the source of truth) and emits callbacks as intents.

| status   | trigger | visual |
|----------|---------|--------|
| `idle`   | initial / `pause` at 0 / `ended` (reset) | recessed well, play icon, `0:00 / dur` |
| `loading`| `loadstart` until `canplay`/`loadedmetadata` | calm shimmer on well, button disabled |
| `playing`| `play` | green LED, fill advances (rAF), playhead glows |
| `paused` | `pause` mid-track | fill frozen at position, play icon |
| `error`  | `error` | calm inline "Couldn't load this demo", transport disabled |

`scrubbing` is orthogonal: set while pointer-dragging the well; the displayed position and the
audio `currentTime` track the pointer 1:1 (no inertia, the precision-control rule).

**Empty** = no `src` / empty `peaks`: flat baseline, transport disabled, `–:–– / –:––`.

## Real-time motion

- **Playhead/fill** is **functional** motion → it stays under `prefers-reduced-motion`. While
  `playing` a `requestAnimationFrame` loop reads `audio.currentTime` (~30–60 fps) for a smooth
  fill; `timeupdate` is the fallback. No animation library.
- **LED bloom / loading shimmer** are decorative → CSS, and the shimmer snaps off under
  reduced-motion (the well just sits dim).

## Accessibility (real audio controls)

- **Play button** — native `<button>` (`TransportButton`); **Space/Enter** toggles play/pause.
- **Scrubber** — `role="slider"`, `aria-label="Seek"`, `aria-valuemin=0`,
  `aria-valuemax=duration`, `aria-valuenow=currentTime`, `aria-valuetext="0:42 of 2:18"`.
  **←/→** seek ∓5 s, **↑/↓** ∓5 s, **Home/End** jump to start/end, **PageUp/PageDown** ∓15 s.
  `:focus-visible` ring only.
- This maps the card's "space = play/pause, arrows = seek" to native semantics — no global
  keydown hijacking. Space works because focus is on the play button; arrows work because focus
  is on the slider. One ARIA model per control, never mixed.
- The `<audio>` element itself is the assistive-tech-grade media node (kept `controls`-less,
  visually hidden); our chrome layers on top.

## Contract (UI-only — drops into the site)

```ts
interface DemoPlayerProps {
  src: string                 // → <audio src>; the real audio source
  peaks: number[]             // amplitudes in [0,1]; same shape as Clip
  label: string               // track name
  color?: string              // per-track color spine / played fill tint (default --accent)
  size?: 'sm' | 'md'          // default md
  disabled?: boolean
  // callbacks = real intents
  onPlay?: () => void
  onPause?: () => void
  onSeek?: (seconds: number) => void   // fired on commit of a seek
  onEnded?: () => void
}
```

No props the card didn't ask for (YAGNI): no autoplay, no volume, no playback-rate, no
playlist. `peaks` matches `Clip`'s contract so the same precomputed peak data feeds both.

## Waveform rendering

Reuse `Clip`'s proven peaks→SVG technique (bipolar bar-chart: `resamplePeaks` + `buildFillPath`,
viewBox `0 0 1000 100`, `preserveAspectRatio="none"`). **Decision:** inline these pure helpers
privately in `DemoPlayer` rather than refactoring the shared `Clip` (keep the shared component
untouched = regression-safe; KIT-LEAD: changes on shared components stay additive). The played
fill is the *same* path rendered a second time inside an SVG `clipPath` rect whose width = the
progress fraction — so played/unplayed share pixel-identical bars and only differ in luminance.

## Files

`src/components/DemoPlayer/` → `DemoPlayer.tsx`, `DemoPlayer.module.css`, `DemoPlayer.test.tsx`,
`DemoPlayer.demo.tsx`, `index.ts`. Auto-registers via `import.meta.glob`. Composites, order 35.

## Testing (fireEvent, jsdom)

jsdom doesn't implement media playback, so tests locally `vi.spyOn(HTMLMediaElement.prototype,
'play'/'pause')` and drive state by `fireEvent(audio, new Event('play'))` etc. Cover: play
button fires `onPlay`/click→play, pause path, slider keydown seeks + fires `onSeek` and sets
`audio.currentTime`, click-to-seek, disabled blocks interaction, aria attributes, empty/error
rendering, label + color spine. Light + dark verified in the gallery (Compare).
