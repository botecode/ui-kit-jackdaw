// src/components/Popover/Popover.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import styles from './Popover.module.css'

export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }
  anchorRef?:      React.RefObject<HTMLElement | null>
}

const MARGIN = 4

// Point-anchor position: place menu at (anchorX, anchorY), flip + clamp to viewport.
function computePosition(
  anchorX: number,
  anchorY: number,
  menuW:   number,
  menuH:   number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = anchorX
  let top  = anchorY

  if (left + menuW + MARGIN > vw) left = anchorX - menuW
  if (top  + menuH + MARGIN > vh) top  = anchorY - menuH

  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top }
}

// Element-anchor position: align to trigger bottom-left; flip up; clamp to viewport.
function computeElementPosition(
  triggerRect: DOMRect,
  menuW:       number,
  menuH:       number,
): { left: number; top: number; minWidth: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  let left = triggerRect.left
  let top  = triggerRect.bottom + 2   // 2px gap — matches old CSS top: calc(100% + 2px)

  if (top + menuH + MARGIN > vh) top = triggerRect.top - menuH - 2

  left = Math.max(MARGIN, Math.min(left, vw - menuW - MARGIN))
  top  = Math.max(MARGIN, Math.min(top,  vh - menuH - MARGIN))

  return { left, top, minWidth: triggerRect.width }
}

export function Popover({
  containerRef,
  onClose,
  children,
  className,
  anchor,
  anchorRef,
}: PopoverProps) {
  const contentRef  = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number; minWidth?: number } | null>(null)
  const portalTarget  = usePortalTarget()

  // Outside-click: close when mousedown is outside both containerRef AND contentRef.
  // The second check is essential for portaled content — the portaled div is not a
  // DOM descendant of containerRef, so without it every click inside would dismiss it.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !contentRef.current?.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [containerRef, onClose])

  // Escape key
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  // Point-anchor: close on scroll/resize — a stale point is worse than a closed menu.
  useEffect(() => {
    if (!anchor) return
    function handle() { onClose() }
    window.addEventListener('scroll', handle, { capture: true })
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, { capture: true })
      window.removeEventListener('resize', handle)
    }
  }, [anchor, onClose])

  // Point-anchor: measure + position. Deps are raw coords, not the anchor object,
  // because anchor is created inline on every render (new reference each time).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!anchor || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    setPos(computePosition(anchor.x, anchor.y, rect.width, rect.height))
  }, [anchor?.x, anchor?.y])

  // Element-anchor: initial measure + position in one pass — never paints at (0,0).
  useLayoutEffect(() => {
    if (!anchorRef?.current || !contentRef.current) return
    const tRect = anchorRef.current.getBoundingClientRect()
    const cRect = contentRef.current.getBoundingClientRect()
    setPos(computeElementPosition(tRect, cRect.width, cRect.height))
  }, [anchorRef])

  // Element-anchor: rAF-throttled reposition on scroll/resize.
  // One rAF per frame regardless of how many scroll events the browser dispatches.
  useEffect(() => {
    if (!anchorRef) return
    let rafId: number | null = null

    function schedule() {
      if (rafId !== null) return          // already queued — drop extra events
      rafId = requestAnimationFrame(() => {
        rafId = null
        const trigger = anchorRef!.current
        const content = contentRef.current
        if (!trigger || !content) return
        const tRect = trigger.getBoundingClientRect()
        const cRect = content.getBoundingClientRect()
        setPos(computeElementPosition(tRect, cRect.width, cRect.height))
      })
    }

    window.addEventListener('scroll', schedule, { capture: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [anchorRef])

  const shellClass = className ? `${styles.shell} ${className}` : styles.shell

  // `minWidth: undefined` is silently dropped by React — no style attribute emitted.
  const style: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, minWidth: pos.minWidth, visibility: 'visible' }
    : { visibility: 'hidden' }

  return createPortal(
    <div ref={contentRef} className={shellClass} style={style}>
      {children}
    </div>,
    portalTarget ?? document.body,
  )
}
