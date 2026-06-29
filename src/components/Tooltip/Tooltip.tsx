// src/components/Tooltip/Tooltip.tsx
import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget, useThemedPortalProps } from '../../theme/ThemeProvider'
import styles from './Tooltip.module.css'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content:    React.ReactNode
  children:   React.ReactElement
  placement?: TooltipPlacement
  delay?:     number
  disabled?:  boolean
}

const GAP    = 8  // px between trigger edge and tooltip body
const MARGIN = 8  // minimum viewport inset

function computeTooltipPosition(
  triggerRect: DOMRect,
  tipW:        number,
  tipH:        number,
  preferred:   TooltipPlacement,
): { left: number; top: number; placement: TooltipPlacement } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  function calc(p: TooltipPlacement): { left: number; top: number } {
    switch (p) {
      case 'top':    return { left: triggerRect.left + triggerRect.width  / 2 - tipW / 2, top: triggerRect.top    - tipH - GAP }
      case 'bottom': return { left: triggerRect.left + triggerRect.width  / 2 - tipW / 2, top: triggerRect.bottom + GAP }
      case 'left':   return { left: triggerRect.left - tipW - GAP, top: triggerRect.top  + triggerRect.height / 2 - tipH / 2 }
      case 'right':  return { left: triggerRect.right + GAP,       top: triggerRect.top  + triggerRect.height / 2 - tipH / 2 }
    }
  }

  function fits(p: TooltipPlacement): boolean {
    const { left, top } = calc(p)
    return left >= MARGIN && left + tipW <= vw - MARGIN && top >= MARGIN && top + tipH <= vh - MARGIN
  }

  const FLIP: Record<TooltipPlacement, TooltipPlacement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
  const candidates = [preferred, FLIP[preferred], 'top', 'bottom', 'left', 'right'].filter(
    (p, i, arr) => arr.indexOf(p) === i,
  ) as TooltipPlacement[]

  const finalPlacement = candidates.find(fits) ?? preferred
  const { left, top }  = calc(finalPlacement)

  return {
    left:      Math.max(MARGIN, Math.min(left, vw - tipW - MARGIN)),
    top:       Math.max(MARGIN, Math.min(top,  vh - tipH - MARGIN)),
    placement: finalPlacement,
  }
}

// ── TooltipBubble ────────────────────────────────────────────────────────────

interface BubbleProps {
  id:        string
  content:   React.ReactNode
  anchorRef: React.RefObject<HTMLElement | null>
  placement: TooltipPlacement
}

function TooltipBubble({ id, content, anchorRef, placement }: BubbleProps) {
  const bubbleRef    = useRef<HTMLDivElement>(null)
  const portalTarget = usePortalTarget()
  const themedProps  = useThemedPortalProps()
  const [pos, setPos] = useState<{ left: number; top: number; placement: TooltipPlacement } | null>(null)

  // Two-pass measure → position: hidden first render, visible after layout effect.
  // Same pattern as Popover (anchorRef mode).
  useLayoutEffect(() => {
    const trigger = anchorRef.current
    const bubble  = bubbleRef.current
    if (!trigger || !bubble) return
    const tRect = trigger.getBoundingClientRect()
    const bRect = bubble.getBoundingClientRect()
    setPos(computeTooltipPosition(tRect, bRect.width, bRect.height, placement))
  }, [anchorRef, placement])

  // rAF-throttled reposition on window resize.
  useEffect(() => {
    let rafId: number | null = null

    function schedule() {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const trigger = anchorRef.current
        const bubble  = bubbleRef.current
        if (!trigger || !bubble) return
        const tRect = trigger.getBoundingClientRect()
        const bRect = bubble.getBoundingClientRect()
        setPos(computeTooltipPosition(tRect, bRect.width, bRect.height, placement))
      })
    }

    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('resize', schedule)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [anchorRef, placement])

  const style: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, visibility: 'visible' }
    : { visibility: 'hidden' }

  // Re-declare the opening subtree's theme tokens at the portal root so the bubble
  // resolves var(--…) even though it escapes the themed subtree.
  return createPortal(
    <div {...themedProps}>
      <div
        ref={bubbleRef}
        id={id}
        role="tooltip"
        className={styles.bubble}
        data-placement={pos?.placement ?? placement}
        style={style}
      >
        {content}
        <span className={styles.arrow} aria-hidden="true" />
      </div>
    </div>,
    portalTarget ?? document.body,
  )
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

// Props shape used when reading from children and when cloning.
// Extends HTMLAttributes with ref so cloneElement's type checker accepts it.
type ChildProps = React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay     = 500,
  disabled  = false,
}: TooltipProps) {
  const id        = useId()
  const anchorRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const timerRef        = useRef<number | null>(null)

  // Cleanup timer on unmount.
  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
  }, [])

  // Hide on scroll — a stale position is worse than a hidden tooltip.
  useEffect(() => {
    if (!open) return
    function handleScroll() { setOpen(false) }
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [open])

  // Global Escape dismiss — covers hover-showing tooltips where focus is elsewhere.
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function show(immediate: boolean) {
    if (disabled) return
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null }
    if (immediate) {
      setOpen(true)
    } else {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        setOpen(true)
      }, delay)
    }
  }

  function hide() {
    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null }
    setOpen(false)
  }

  const childProps = children.props as ChildProps

  // Merge anchorRef into the child's ref chain. In React 19, ref is a regular prop.
  const mergedRef = (el: HTMLElement | null) => {
    (anchorRef as React.MutableRefObject<HTMLElement | null>).current = el
    const cr = childProps.ref
    if (typeof cr === 'function') {
      cr(el)
    } else if (cr != null && typeof cr === 'object') {
      (cr as React.MutableRefObject<HTMLElement | null>).current = el
    }
  }

  const trigger = cloneElement(
    children as React.ReactElement<ChildProps>,
    {
      ref: mergedRef,
      'aria-describedby': disabled ? undefined : id,
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { childProps.onMouseEnter?.(e); show(false) },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { childProps.onMouseLeave?.(e); hide() },
      onFocus:      (e: React.FocusEvent<HTMLElement>) => { childProps.onFocus?.(e);      show(true) },
      onBlur:       (e: React.FocusEvent<HTMLElement>) => { childProps.onBlur?.(e);       hide() },
      onKeyDown:    (e: React.KeyboardEvent<HTMLElement>) => { childProps.onKeyDown?.(e); if (e.key === 'Escape') hide() },
    },
  )

  return (
    <>
      {trigger}
      {open && !disabled && (
        <TooltipBubble
          id={id}
          content={content}
          anchorRef={anchorRef}
          placement={placement}
        />
      )}
    </>
  )
}
