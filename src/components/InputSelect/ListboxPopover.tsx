// src/components/InputSelect/ListboxPopover.tsx
import { useEffect, useRef } from 'react'
import styles from './ListboxPopover.module.css'

export interface ListboxOption {
  id: string
  label: string
}

export interface ListboxPopoverProps {
  id: string
  options: ListboxOption[]
  selectedId: string | null
  activeId: string | null
  onSelect: (id: string) => void
}

export function ListboxPopover({ id, options, selectedId, activeId, onSelect }: ListboxPopoverProps) {
  const optionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (activeId) {
      const el = optionRefs.current.get(activeId)
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [activeId])

  return (
    <div
      id={id}
      className={styles.popover}
      role="listbox"
    >
      {options.map(opt => (
        <div
          key={opt.id}
          id={`${id}-${opt.id}`}
          ref={el => {
            if (el) optionRefs.current.set(opt.id, el)
            else optionRefs.current.delete(opt.id)
          }}
          className={styles.option}
          role="option"
          aria-selected={opt.id === selectedId}
          data-active={opt.id === activeId || undefined}
          onMouseDown={e => {
            e.preventDefault()
            onSelect(opt.id)
          }}
        >
          <span className={styles.check} aria-hidden="true">✓</span>
          <span className={styles.label}>{opt.label}</span>
        </div>
      ))}
    </div>
  )
}
