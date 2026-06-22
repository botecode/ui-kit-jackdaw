// src/components/FeatureGrid/FeatureCard.tsx
import { Glyph } from './glyphs'
import type { FeatureItem } from './types'
import styles from './FeatureCard.module.css'

export interface FeatureCardProps {
  feature: FeatureItem
  size?: 'sm' | 'md'
  /** Real intent — fired when the card's link is activated (routing / analytics). */
  onActivate?: (item: FeatureItem) => void
}

// Arrow for the call-to-action — bespoke inline SVG (kept off Phosphor so it shares
// the glyph family's hand and nudges on hover).
function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 8h9" />
      <path d="m8.5 4 4 4-4 4" />
    </svg>
  )
}

// A single feature tile.
//
// Why this isn't a webpage: a web feature card is a flat bordered box with a stock
// icon. This is a Chroma instrument tile — a warm cream face with a hairline
// top-highlight, and the glyph sits in a recessed dark stage well that's dim at
// rest and lights with an accent LED bloom (fast attack / slow decay) when you
// hover the card. The bespoke glyphs (waveform, the jackdaw eye) speak audio, not
// clip-art. It earns the page; it doesn't decorate it.

export function FeatureCard({ feature, size = 'md', onActivate }: FeatureCardProps) {
  const { glyph, title, blurb, link } = feature

  return (
    <article className={styles.card} data-size={size}>
      <div className={styles.glyphWell}>
        <Glyph name={glyph} className={styles.glyph} />
      </div>

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.blurb}>{blurb}</p>

      {link && (
        <a
          className={styles.link}
          href={link.href}
          onClick={() => onActivate?.(feature)}
        >
          <span className={styles.linkLabel}>{link.label}</span>
          <Arrow className={styles.linkArrow} />
        </a>
      )}
    </article>
  )
}
