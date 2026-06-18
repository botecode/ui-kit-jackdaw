// src/components/Popover/Popover.tsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Popover.module.css'

export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement | null>
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
  anchor?:         { x: number; y: number }
}

const MARGIN = 4

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

export function Popover({
  containerRef,
  onClose,
  children,
  className,
  anchor,
}: PopoverProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Outside-click: close when mousedown is outside both containerRef AND contentRef.
  // The second check is essential for portaled content — the portaled div is not a
  // DOM descendant of containerRef, so without it every click inside the menu would
  // be treated as "outside" and dismiss it immediately.
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

  // Scroll/resize → close (portaled only). Repositioning a stale point is worse than closing.
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

  // Measure + position. Deps are the raw coords, not the anchor object, because
  // anchor is created inline on every render (new object reference each time).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!anchor || !contentRef.current) return
    const rect = contentRef.current.getBoundingClientRect()
    setPos(computePosition(anchor.x, anchor.y, rect.width, rect.height))
  }, [anchor?.x, anchor?.y])

  // ── Portal (point-anchored) branch ────────────────────────────────────────
  if (anchor) {
    const shellClass = className
      ? `${styles.shell} ${styles.shellPortal} ${className}`
      : `${styles.shell} ${styles.shellPortal}`

    const style: React.CSSProperties = pos
      ? { left: pos.left, top: pos.top, visibility: 'visible' }
      : { visibility: 'hidden' }

    return createPortal(
      <div ref={contentRef} className={shellClass} style={style}>
        {children}
      </div>,
      document.body,
    )
  }

  // ── Trigger-anchored branch (unchanged from before this task) ─────────────
  return (
    <div className={className ? `${styles.shell} ${className}` : styles.shell}>
      {children}
    </div>
  )
}
