import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './Marquee.module.css'

export interface MarqueeProps {
  /** Ordered ticker items — plain strings render as the mono ticker type; any
   *  other node (e.g. a small logo) passes through untouched. */
  items: React.ReactNode[]
  /** Scroll speed in pixels per second. Constant velocity regardless of how much
   *  content the row carries — the instrument-grade choice. */
  speed?: number
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

// Small inline matchMedia hook — the kit has no shared reduced-motion hook yet,
// and a marquee is the rare component that must branch its DOM on it (drop the
// clone, render static) rather than only zero a CSS duration.
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function Track({
  items,
  hidden,
  trackRef,
}: {
  items: React.ReactNode[]
  hidden?: boolean
  trackRef?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      className={styles.track}
      data-marquee-track=""
      aria-hidden={hidden || undefined}
      ref={trackRef}
    >
      {items.map((item, i) => (
        <span className={styles.item} key={i}>
          {item}
          <span className={styles.dot} aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

// Why this isn't a webpage: a web marquee is a loud banner that scrolls at a
// constant *duration* (so velocity lurches with content length) and hard-cuts at
// the edges. This one holds a constant *velocity* (px/sec, width-measured), reads
// off the warm cream surface in quiet mono, dissolves into the surface through an
// alpha mask instead of clipping, and idles a recessed LED dot between each item —
// the page's heartbeat, like a piece of hardware ticking over, not an ad bar.

export function Marquee({
  items,
  speed = 60,
  direction = 'left',
  pauseOnHover = true,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Marquee',
}: MarqueeProps) {
  const reduced = useReducedMotion()
  const measureRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(0)

  // Measure one content copy's width and derive the loop duration so velocity
  // (px/sec) stays constant. The animation itself runs in CSS — this only feeds
  // it a duration. Re-measures on resize where ResizeObserver is available.
  useLayoutEffect(() => {
    if (reduced) return
    const el = measureRef.current
    if (!el) return

    const measure = () => {
      const width = el.offsetWidth
      setDuration(width > 0 && speed > 0 ? width / speed : 0)
    }
    measure()

    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [reduced, speed, items])

  const hasItems = items.length > 0

  const style = {
    '--_marquee-duration': `${duration}s`,
  } as React.CSSProperties

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-testid="marquee-root"
      data-size={size}
      data-direction={direction}
      data-reduced={reduced || undefined}
      data-pause-on-hover={(pauseOnHover && !reduced) || undefined}
      data-paused={duration === 0 && !reduced ? '' : undefined}
      style={style}
      role="marquee"
      aria-label={ariaLabel}
    >
      {hasItems && (
        <div className={styles.viewport}>
          {/* The lane carries both copies and is the single animated element:
              translateX(0 → -50%) shifts it by exactly one copy's width, so the
              loop is seamless. */}
          <div className={styles.lane}>
            <Track items={items} trackRef={measureRef} />
            {/* Seamless loop: a second identical copy, aria-hidden so screen
                readers announce each item once. Omitted under reduced motion —
                the row sits static. */}
            {!reduced && <Track items={items} hidden />}
          </div>
        </div>
      )}
    </div>
  )
}
