// src/components/Showcase/Showcase.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import styles from './Showcase.module.css'

export interface ShowcaseCta {
  label: string
  /** Set for navigation → renders an <a>. */
  href?: string
  /** Set when there is no href → renders a <button>. */
  onClick?: () => void
}

export interface ShowcaseSection {
  id: string
  /** Display heading. */
  title: string
  /** Body copy. */
  body: string
  /** Visual slot — a ProductFrame / image / mockup node supplied by the consumer. */
  media: React.ReactNode
  /** Mono section index/label, e.g. "01 / CAPTURE". */
  eyebrow?: string
  cta?: ShowcaseCta
  /** Which side the media sits on. Omit to auto-alternate (even→left, odd→right). */
  side?: 'left' | 'right'
}

export interface ShowcaseProps {
  sections: ShowcaseSection[]
  /** Reveal each section on scroll. Decorative — snaps off under reduced-motion. Default true. */
  reveal?: boolean
  size?: 'sm' | 'md'
  'aria-label'?: string
}

// Why this isn't a webpage: this is webpage-SHAPED (a marketing scroll story),
// but it carries the instrument's voice, not a generic SaaS landing page. The
// media sits in a recessed --stage well (the kit's signature, not a flat card
// with a drop shadow); the eyebrow is the mono digital-readout used as a section
// index; the heading is the display face and body is General Sans (never Inter);
// the CTA is the accent pill with the kit's recessed/lit tactility (hover bloom,
// press inset). Reveal-on-scroll follows the kit's motion discipline — it's
// decorative, so it snaps off under prefers-reduced-motion and the content is
// always present (never display:none), with no animation library.
export function Showcase({
  sections,
  reveal = true,
  size = 'md',
  'aria-label': ariaLabel,
}: ShowcaseProps) {
  return (
    <section className={styles.root} data-size={size} data-reveal={reveal || undefined} aria-label={ariaLabel}>
      {sections.map((section, i) => (
        <ShowcaseRow
          key={section.id}
          section={section}
          side={section.side ?? (i % 2 === 0 ? 'left' : 'right')}
          reveal={reveal}
        />
      ))}
    </section>
  )
}

interface RowProps {
  section: ShowcaseSection
  side: 'left' | 'right'
  reveal: boolean
}

function ShowcaseRow({ section, side, reveal }: RowProps) {
  const headingId = useId()
  const ref = useRef<HTMLElement>(null)

  // Reveal is decorative. Start visible unless we can (and should) animate it in:
  // honour reduced-motion and degrade gracefully where IntersectionObserver is
  // absent (jsdom / no-JS) — content is never hidden without a path back to visible.
  const [revealed, setRevealed] = useState(() => !shouldAnimateReveal(reveal))

  useEffect(() => {
    if (!shouldAnimateReveal(reveal)) {
      setRevealed(true)
      return
    }
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reveal])

  return (
    <article
      ref={ref}
      className={styles.row}
      data-side={side}
      data-revealed={revealed}
      aria-labelledby={headingId}
    >
      <div className={styles.mediaWell}>{section.media}</div>

      <div className={styles.copy}>
        {section.eyebrow && <p className={styles.eyebrow}>{section.eyebrow}</p>}
        <h2 id={headingId} className={styles.title}>{section.title}</h2>
        <p className={styles.body}>{section.body}</p>
        {section.cta && <Cta cta={section.cta} />}
      </div>
    </article>
  )
}

function Cta({ cta }: { cta: ShowcaseCta }) {
  const inner = (
    <>
      <span className={styles.ctaLabel}>{cta.label}</span>
      <ArrowRight className={styles.ctaArrow} weight="bold" aria-hidden="true" />
    </>
  )

  if (cta.href != null) {
    return (
      <a className={styles.cta} href={cta.href}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" className={styles.cta} onClick={cta.onClick}>
      {inner}
    </button>
  )
}

/**
 * True only when we should hold a section hidden and animate it in: reveal is on,
 * IntersectionObserver exists, and the user hasn't asked for reduced motion.
 */
function shouldAnimateReveal(reveal: boolean): boolean {
  if (!reveal) return false
  if (typeof IntersectionObserver === 'undefined') return false
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  }
  return true
}
