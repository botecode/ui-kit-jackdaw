// src/components/BrandMark/BrandMark.tsx
import styles from './BrandMark.module.css'

export interface BrandMarkProps {
  variant?: 'full' | 'icon' | 'sigil'
  size?: number
  stage?: boolean
  className?: string
}

// ─── Bird head (inline SVG) ────────────────────────────────────────────────
// Self-contained: no external file, no <use>. Copy this SVG verbatim to export
// a standalone .svg. Fills are CSS vars so the bird reskins in the gallery;
// greys are hardcoded fixed brand colours (not theme tokens — intentional).
function BirdHead() {
  return (
    <svg
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={styles.bird}
    >
      <defs>
        {/* Gradient id is unique-ish — multiple BrandMark instances on one page
            will re-declare it, but identical declarations are harmless. */}
        <radialGradient id="jd-crown" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#8a8a8a" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </radialGradient>
      </defs>

      {/* Crown: grey domed head */}
      <circle
        cx="50" cy="42" r="34"
        fill="url(#jd-crown)"
        stroke="var(--bg)" strokeWidth="3"
      />

      {/* Face + beak: charcoal polygon — trapezoidal face tapering to a pointed beak */}
      <polygon
        points="20,52 80,52 72,82 60,118 40,118 28,82"
        fill="var(--stage)"
        stroke="var(--bg)" strokeWidth="3" strokeLinejoin="round"
      />

      {/* Eye ring: pale cream — sits at intersection of crown and face */}
      <circle cx="50" cy="40" r="10" fill="var(--bg)" />

      {/* Pupil: dark centre */}
      <circle cx="50" cy="40" r="6"  fill="var(--stage)" />
    </svg>
  )
}

// ─── Petal colours (warm → cool, green skipped) ───────────────────────────
const PETAL_COLORS = [
  'var(--chroma-red)',
  'var(--chroma-orange)',
  'var(--chroma-yellow)',
  'var(--chroma-teal)',
  'var(--chroma-blue)',
] as const

// ─── BrandMark ────────────────────────────────────────────────────────────
export function BrandMark({
  variant = 'icon',
  size = 256,
  stage = false,
  className,
}: BrandMarkProps) {
  const showAllPetals = variant !== 'sigil'  // icon + full get the 5-petal fan
  const showBird      = variant !== 'sigil'  // icon + full get the SVG bird
  const showWordmark  = variant === 'full'
  const showSigil     = variant === 'sigil'

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-stage={stage || undefined}
      style={{ fontSize: size }}
      role="img"
      aria-label="Jackdaw brand mark"
    >
      {/* ── Petal fan — always rendered; icon/full get 5 petals, sigil gets 1 ── */}
      <div className={styles.fanPivot}>
        {showAllPetals
          ? PETAL_COLORS.map((color, i) => (
              <div key={i} className={styles.petal} style={{ background: color }} />
            ))
          : /* sigil: single centre petal in teal per spec */
            <div className={styles.petal} style={{ background: 'var(--chroma-teal)' }} />
        }
      </div>

      {/* ── Bird head SVG ─────────────────────────────────────────────── */}
      {showBird && <BirdHead />}

      {/* ── Sigil eye ─────────────────────────────────────────────────── */}
      {showSigil && (
        <div className={styles.sigilEye}>
          <div className={styles.sigilEyeRing} />
          <div className={styles.sigilEyePupil} />
        </div>
      )}

      {/* ── Wordmark (Interpretation A) ───────────────────────────────── */}
      {showWordmark && (
        <div className={styles.wordmark}>
          {/* Triangle-A stretch goal: if ▲ glyphs look misaligned in Cabinet
              Grotesk, replace with plain spans: <span>J</span><span>A</span>…  */}
          <span>J</span>
          <span className={`${styles.wordmarkA} ${styles.wordmarkA1}`}>A</span>
          <span>CKD</span>
          <span className={`${styles.wordmarkA} ${styles.wordmarkA2}`}>A</span>
          <span>W</span>
        </div>
      )}
    </div>
  )
}
