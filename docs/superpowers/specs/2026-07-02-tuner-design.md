# Tuner — chromatic tuner display (design spec)

**Date:** 2026-07-02 · **Card:** kit-tuner-display · **Status:** approved (headless — decisions resolved against KIT-LEAD.md)

## What it is

A fully controlled, presentational chromatic-tuner display for plugin/host UIs — the UAD "Paradise
Guitar Studio" / Neural DSP tuner vocabulary, rendered in the Chroma hardware language. No audio, no
detection, no timers: it renders exactly what the host gives it.

**Why this isn't a webpage:** a tuner is an instrument's face — a dark glass screen recessed into a warm
panel, a needle that slides a physical cents scale, direction arrows that light like LEDs, and real
controls (mute, reference pitch) mounted below the screen. Nothing here is a form; every element is a
piece of hardware the player reads at a glance from across the room.

## Anatomy

```
┌─ panel (component chassis, transparent — sits on the host surface) ─┐
│ ┌─ screen: recessed --stage well ─────────────────────────────────┐ │
│ │                 ▸   E₂   ◂        ← flat/sharp arrows + note    │ │
│ │                  −4               ← cents (or Hz) readout       │ │
│ │   ─┬──┬──┬──╀──┬──┬──┬─          ← −50…+50 scale, center detent│ │
│ │        ▮                          ← sliding needle tick         │ │
│ │              A = 440.0 Hz         ← reference label (subtle)    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│   [Mute ◦]      A = [− 440.0 Hz +]      [CENT|HZ]   ← control row  │
└─────────────────────────────────────────────────────────────────────┘
```

- **Screen** = `--stage` well with `--texture-stage` (multiply), hairline top-highlight, inner shadow —
  the recessed glass. All display text is `--stage-text` family.
- **Note**: large `--font-display` letter, octave as a smaller subscript. Green (`--led-green`) when
  `inTune`; `--stage-text` when off-tune; dim `—` when idle.
- **Arrows** (bespoke inline SVG triangles, aria-hidden): `▸ note ◂` pointing at the note (UAD). Left
  lit when flat (`cents < 0`), right when sharp, both quiet when in tune / idle. Lit = `--led-orange`
  (amber = attention).
- **Cents scale**: horizontal ticks, labels −50 / 0 / +50 (mono), taller center detent tick. The
  **needle** is a vertical tick (UAD) sliding via `left: %`, transition ~150ms `--ease-out`; green +
  glow when `inTune`, amber when off, dim/no-glow at center when idle. Cents clamped to ±50.
- **Readout** under the note (mono): `mode='cents'` → signed cents (`−4`, `+12`, `0`); `mode='hz'` →
  `329.6 Hz` from `frequency`. Idle → `—`.
- **Reference label**: subtle `A = 440.0 Hz` mono caption inside the screen (from `referenceHz`).
- **Control row** (on the panel, below the screen): kit `Toggle` for mute (stable label, aria-pressed),
  kit `NumberField` for reference pitch (415–466 Hz, step 0.5, unit "Hz"), kit `SegmentedControl`
  (CENT / HZ, `sm`) rendered **only when `onModeChange` is provided**.

## Props (controlled, presentational)

```ts
export interface TunerProps {
  /** Detected note name, e.g. "A", "F#". null/undefined = no pitch. */
  note?: string | null
  /** Octave number for the subscript, e.g. 2 in "E2". */
  octave?: number | null
  /** Cents offset −50..+50 (clamped). Default 0. */
  cents?: number
  /** Host's in-tune verdict (host owns the threshold). */
  inTune?: boolean
  /** Detection confidence 0..1. Below 0.3 (or note==null) → idle. Default 1. */
  confidence?: number
  /** Detected frequency in Hz — the 'hz' mode readout. */
  frequency?: number | null
  /** Tune silently — display-only; host wires the audio mute. */
  mute: boolean
  onMuteChange: (next: boolean) => void
  /** Reference pitch (A4), e.g. 440. */
  referenceHz: number
  onReferenceChange: (hz: number) => void
  /** Readout mode under the note. Default 'cents'. */
  mode?: 'cents' | 'hz'
  /** When provided, the CENT/HZ toggle renders. */
  onModeChange?: (mode: 'cents' | 'hz') => void
  size?: 'sm' | 'md'   // 'sm' = the compact "mini" (UAD) — no separate prop
  'aria-label'?: string
}
```

## States (data-* attributes; CSS targets them)

`data-size`, `data-idle` (no pitch), `data-in-tune`, `data-flat`, `data-sharp`, `data-muted`.
Exactly one of idle/in-tune/flat/sharp holds at a time (flat/sharp = off-tune direction).

## Decisions (resolved against KIT-LEAD.md)

1. **Green vs accent for in-tune**: `--led-green` family — the card says GREEN, and green = "good"
   in the semantic LED table; `--accent` is vermilion in Chroma and would read as a warning.
2. **Off-tune color**: `--led-orange` (amber = attention), not red (red = arm/record — a tuner must
   never read as recording).
3. **Idle threshold**: internal constant `0.3` — the host owns detection; the component only needs one
   documented floor. Not a prop (YAGNI).
4. **No `aria-live`**: pitch updates arrive ~30fps; a live region would spam. The gauge is
   `role="img"` with a computed `aria-label` ("Tuner: E2, 4 cents flat" / "Tuner: E2, in tune" /
   "Tuner: no signal"). Interactive controls keep their own ARIA (Toggle aria-pressed stable-label,
   NumberField spinbutton, SegmentedControl radio group).
5. **Mini mode = `size="sm"`**: conventions allow only sm/md; a separate `mini` prop would be a second
   size axis.
6. **No `disabled` prop**: the card didn't ask; a display's "off" state is idle. (YAGNI.)
7. **Reduced motion**: the needle/arrow/note transitions snap (`transition: none`) — position and
   color still change instantly, so no state is lost (functional state carried by position/color, the
   ease is decorative).
8. **Reference range 415–466 Hz, step 0.5** — covers Baroque A415 through A466, matches the "440.0 Hz"
   one-decimal display in both reference designs.

## Testing (fireEvent, jsdom)

- Renders note + octave; green/in-tune data attr; flat lights left arrow (data-flat), sharp lights
  right (data-sharp); idle (`note=null` or `confidence<0.3`) shows — and data-idle.
- Cents readout signs correctly (−4 / +12 / 0); hz mode shows `frequency` with unit; clamps |cents|>50.
- Needle `left` style maps cents → % (center 50% at 0, 0% at −50, 100% at +50).
- Mute Toggle fires `onMuteChange`; NumberField steppers fire `onReferenceChange`; mode toggle fires
  `onModeChange`; toggle absent when `onModeChange` omitted.
- Gauge aria-label composes correctly for in-tune / flat / sharp / idle.

## Demo (all states, StatesGrid + Playground)

In tune (E2) · flat (−18) · sharp (+30) · extreme (−50) · idle/no signal · muted · hz mode ·
A=432 reference · sm (mini). Playground dogfoods kit controls: a `Fader` drives cents, `Toggle`
drives mute + signal, live in-tune derivation (|cents| ≤ 3), NumberField for reference.

## Gate

`npm run check` (tsc) + `npx vitest run` + `vite build` green; exported from `src/index.ts`
(alphabetical); auto-registered demo (group Composites, order 93 — beside PluginGraph).
