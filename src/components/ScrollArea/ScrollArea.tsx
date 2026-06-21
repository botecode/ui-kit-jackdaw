// src/components/ScrollArea/ScrollArea.tsx
import { useEffect, useRef } from 'react'
import styles from './ScrollArea.module.css'

export interface ScrollAreaProps {
  orientation?: 'vertical' | 'horizontal' | 'both'
  size?: 'sm' | 'md'
  autoHide?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ScrollArea({
  orientation = 'vertical',
  size = 'md',
  autoHide = false,
  children,
  className,
  style,
}: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleScroll() {
    if (!autoHide) return
    const el = rootRef.current
    if (!el) return
    el.dataset.scrolling = ''
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (rootRef.current) delete rootRef.current.dataset.scrolling
    }, 1200)
  }

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={style}
      data-orientation={orientation}
      data-size={size}
      data-auto-hide={autoHide || undefined}
      onScroll={handleScroll}
    >
      {children}
    </div>
  )
}
