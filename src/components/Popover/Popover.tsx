// src/components/Popover/Popover.tsx
import { useEffect } from 'react'
import styles from './Popover.module.css'

export interface PopoverProps {
  containerRef:    React.RefObject<HTMLElement>
  returnFocusRef?: React.RefObject<HTMLElement>
  onClose:         () => void
  children:        React.ReactNode
  className?:      string
}

export function Popover({ containerRef, onClose, children, className }: PopoverProps) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [containerRef, onClose])

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

  return (
    <div className={className ? `${styles.shell} ${className}` : styles.shell}>
      {children}
    </div>
  )
}
