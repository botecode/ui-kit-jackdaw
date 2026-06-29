# HighTake — design (kit-high-take)

A captured take in High mode's takes review: a clip-like waveform with two grippable
boundary handles you drag inward to keep only part of the take, plus a "+ save" affordance
under the kept span. Composite layer. New `src/components/HighTake/`. Chroma, calm, flat.

Decisions below were locked by the builder agent (headless) against `KIT-LEAD.md`; the
reasoning lives here and in the commit message so it's never re-asked.

## Why this isn't a webpage

Trimming a take is **not two number inputs**. It's two physical grips you slide along a
waveform you can actually read — the kept audio lit, the discarded audio dimmed *in place*
(not deleted), so the gesture feels like cutting tape, not editing a form field. The handles
have weight; the kept span glows; the save button rides under exactly the part you're keeping.

## Contract (props = real data, callbacks = real intents)

```ts
interface HighTakeProps {
  peaks: number[]            // amplitude values in [0,1]; resampled to bars
  durationSeconds: number    // full take length — the slider domain
  trimStart: number          // kept-range start, seconds (controlled)
  trimEnd: number            // kept-range end, seconds (controlled)
  onTrim: (start: number, end: number) => void  // every drag/keyboard tick
  onSave: () => void         // host opens the name modal (Dialog+TextField — out of scope)
  label?: string             // take name shown on the strip
  disabled?: boolean
  size?: 'sm' | 'md'         // default 'md'
  'aria-label'?: string
}
```

Controlled like Fader / TimeSelection: the component reports intent via `onTrim`, the host
reconciles state back through `trimStart`/`trimEnd`.

## Geometry (self-contained)

Unlike TimeSelection (a timeline overlay fed `secondsToX`), HighTake owns its own width. The
waveform is drawn in a normalized SVG viewBox (`0 0 1000 100`); positions are **fractions of
the take**: `fraction = seconds / durationSeconds`. Drag converts pointer X to seconds via the
waveform element's `getBoundingClientRect()` (same pattern as TimeSelection's
`clientXToContainerX`). No external coordinate functions — it drops in anywhere.

## Visual

- **Waveform.** Peaks resampled to a fixed bar density, bipolar fill path. Drawn once at a
  dim "trimmed" opacity for the whole take. The kept span `[trimStart, trimEnd]` gets (a) an
  accent tint band behind it and (b) the same path re-drawn at full opacity in the accent,
  clipped to the kept x-range via an SVG `<clipPath>` (fractions). Result: trimmed ends read
  dimmed and still present; kept reads bright. Flat — no glow, no bevel (calm Chroma).
- **Handles.** Two vertical `|` grip bars at the kept edges, slightly taller than the
  waveform, with a hairline grip. Recessed feel via tokens; accent keyline. `role="slider"`.
- **+ save.** Kit `Button` (reuse), `variant="primary"`, Phosphor `Plus` icon + "save",
  centered under the kept span (`left: midFraction`, `translateX(-50%)`).

## Interaction

- **Drag** a handle inward/outward → `onTrim(newStart, newEnd)` each tick. A handle clamps to
  `[0, durationSeconds]` and never crosses the other (min kept span `MIN_KEEP = 0.05s`).
- **Keyboard** on a focused handle: `←/→` nudge (`0.1s`; `Shift` = `1s`), `Home`/`End` jump
  that handle to its extent (start→0 capped at end−MIN, end→duration floored at start+MIN).
  Same clamping as drag.
- **Save**: click → `onSave()`. Disabled when `disabled`.
- **Disabled**: no drag, no keyboard, save disabled, handles `tabIndex=-1`, dimmed.

## A11y (one ARIA model per control)

- Handles are sliders: `role="slider"`, `aria-valuemin=0`, `aria-valuemax=durationSeconds`,
  `aria-valuenow`, `aria-valuetext` (mono `Ns`), stable labels "Trim start" / "Trim end",
  wrapped in a `role="group"` labelled by the take.
- "+ save" is a `Button` with a visible label (relabel pattern, no `aria-pressed`).
- `:focus-visible` ring on handles only.

## States (demo)

default (untrimmed, full range) · trimmed (handles pulled in) · focus (handle ring) · disabled
· sm · empty (peaks=[] → flat baseline) · theme-compare (Chroma light vs Ink/dark). Playground
dogfoods kit `Toggle` (disabled) + `Fader` (drive trimStart/trimEnd) and a live readout.

## Reuse / scope

Reuses kit `Button`. The save modal (Dialog+TextField), silence-splitting, nest persistence,
and the recording view are **out of scope** — `onSave` just signals intent. Self-contained
waveform builder (not a refactor of `Clip`) keeps changes additive and the flat look exact.
