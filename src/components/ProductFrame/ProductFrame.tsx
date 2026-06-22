// src/components/ProductFrame/ProductFrame.tsx
import type { ReactNode } from 'react'
import styles from './ProductFrame.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProductFrameProps {
  /** Aspect frame to wrap the shot in. `desktop` = wide DAW window, `phone` = the mobile app. */
  variant?: 'desktop' | 'phone'
  /** Screenshot/mockup source. Ignored when `children` is provided. */
  src?: string
  /** Alt text for the screenshot. Empty string marks it decorative. */
  alt?: string
  /** Live content slot — a real kit surface rendered inside the screen instead of an image. */
  children?: ReactNode
  /** Optional caption rendered under the device. */
  caption?: ReactNode
  /** Lift + deepen the shadow on hover (pure CSS; snaps under reduced-motion). Default off. */
  hoverLift?: boolean
  /** Subtle screen-glass sheen across the shot. Default true. */
  sheen?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
// Wraps a screenshot/mockup in a tactile Chroma bezel so the DAW/app shot reads
// as a real device, not a flat PNG. A rounded, slightly recessed bezel (warm
// surface + paper texture) holds a recessed dark screen well; the shot sits in
// the well behind a faint glass sheen, with a hairline top-highlight and a soft
// token-driven depth shadow underneath. `desktop` is a wide DAW window; `phone`
// is the narrow mobile app, with a quiet earpiece groove so it reads as a handset
// without 90s-console cosplay.
//
// Why this isn't a webpage: a marketing site drops a screenshot as a bare <img>
// with a CSS drop-shadow, or apes a browser chrome with traffic-light dots. This
// is the kit's hardware language instead — the same recessed-well + hairline-
// highlight + warm-surface idiom every control is built from, so the shot sits in
// the product, not on a slide. Depth comes from the elevation tokens (--shadow-*),
// not a one-off blur, so it re-skins and re-weights with the theme like everything
// else on the shelf.

export function ProductFrame({
  variant = 'desktop',
  src,
  alt = '',
  children,
  caption,
  hoverLift = false,
  sheen = true,
}: ProductFrameProps) {
  return (
    <figure
      className={styles.root}
      data-variant={variant}
      data-hover-lift={hoverLift || undefined}
    >
      <div className={styles.bezel}>
        {variant === 'phone' && <span className={styles.earpiece} aria-hidden="true" />}
        <div className={styles.screen}>
          {src ? (
            <img className={styles.shot} src={src} alt={alt} draggable={false} />
          ) : (
            children
          )}
          {sheen && <span className={styles.sheen} aria-hidden="true" />}
        </div>
      </div>
      {caption != null && caption !== '' && (
        <figcaption className={styles.caption}>{caption}</figcaption>
      )}
    </figure>
  )
}
