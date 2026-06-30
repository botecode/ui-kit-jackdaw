// src/lib/highSession.ts
//
// High mode — the mock "high.*" bridge.
//
// High mode is the brand's Focus flow (MARKETING.md §6): a full screen, dark, a
// record button. You pick what you'll play, record, and on pause we split the
// session where you paused into takes you trim and keep straight into the Ideas
// Library. The engine capture/silence-split is out of scope here (high-mode-capture);
// this module fakes believable silence-split takes on stop so the UI can be built,
// reviewed, and tested against a stable contract. Wire the real bridge later by
// swapping generateMockTakes for engine output — the shapes are the contract.

/** Where the flow is. howto → selecting → setup → recording → processing → reviewing. */
export type HighPhase = 'howto' | 'selecting' | 'setup' | 'recording' | 'processing' | 'reviewing'

/** An instrument the writer can arm for the session (a project track). */
export interface HighInstrumentOption {
  id: string
  name: string
  /** Track-spine colour token value (e.g. var(--track-color-1) resolved upstream). */
  color: string
  /** Input label shown under the name, e.g. "In 1 · Mono". */
  input?: string
}

/** A captured take in the review. Maps 1:1 onto HighTakeProps for the strip. */
export interface HighTakeData {
  id: string
  label: string
  /** Amplitude peaks in [0,1] — the waveform. */
  peaks: number[]
  durationSeconds: number
  /** Kept-range start (seconds). Begins at 0. */
  trimStart: number
  /** Kept-range end (seconds). Begins at durationSeconds. */
  trimEnd: number
  /** True once the writer has saved it to the Ideas Library. */
  saved: boolean
}

/** What lands in the Ideas Library when a take is saved. */
export interface HighSavedIdea {
  id: string
  name: string
  takeId: string
  bpm: number
  /** The kept span's length at save time. */
  durationSeconds: number
}

// ── Seeded PRNG (deterministic takes for the gallery + tests) ────────────────
// A tiny LCG so generateMockTakes is pure: same seed → same takes, no Date.now /
// Math.random reaching into render or assertions.
function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

/**
 * Build one take's peaks: a believable performance envelope (swell in, taper out)
 * with near-silence at the boundaries — so the "split where you paused" story reads
 * true and the trim handles have dead air to cut.
 */
function buildPeaks(rand: () => number, count: number): number[] {
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    // Raised-cosine envelope: quiet at both ends, full in the middle.
    const envelope = Math.sin(Math.PI * t) ** 0.6
    const noise = 0.55 + rand() * 0.45
    out.push(Math.max(0, Math.min(1, envelope * noise)))
  }
  return out
}

export interface GenerateTakesOptions {
  /** How many takes the session split into. Default 3. */
  count?: number
  /** Deterministic seed. Default 1. */
  seed?: number
}

/**
 * Fake the engine's silence-split: turn a finished session into `count` takes of
 * varied length, each starting fully kept (trim = whole take). Pure + deterministic.
 */
export function generateMockTakes({ count = 3, seed = 1 }: GenerateTakesOptions = {}): HighTakeData[] {
  const rand = lcg(seed)
  const takes: HighTakeData[] = []
  for (let i = 0; i < count; i++) {
    // 8–34s takes — long enough that trimming matters, varied so they don't twin.
    const durationSeconds = Math.round((8 + rand() * 26) * 10) / 10
    const barCount = 90 + Math.floor(rand() * 70)
    takes.push({
      id: `take-${i + 1}`,
      label: `Take ${i + 1}`,
      peaks: buildPeaks(rand, barCount),
      durationSeconds,
      trimStart: 0,
      trimEnd: durationSeconds,
      saved: false,
    })
  }
  return takes
}

/** Clamp a trim range to the take, enforcing a minimum kept span. */
export function clampTrim(
  start: number,
  end: number,
  durationSeconds: number,
  minKeep = 0.05,
): { start: number; end: number } {
  const s = Math.max(0, Math.min(start, durationSeconds - minKeep))
  const e = Math.min(durationSeconds, Math.max(end, s + minKeep))
  return { start: s, end: e }
}
