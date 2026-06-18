// src/components/InputSelect/InputSelect.tsx
import { useEffect, useId, useRef, useState } from 'react'
import styles from './InputSelect.module.css'
import { ListboxPopover } from './ListboxPopover'
import type { ListboxOption } from './ListboxPopover'

export type { ListboxOption as InputSelectOption }

export interface InputSelectProps {
  value: string | null
  onChange: (id: string) => void
  options: ListboxOption[]
  variant?: 'field' | 'chip'
  placeholder?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  showInTag?: boolean
  'aria-label'?: string
  defaultOpen?: boolean
}

export function InputSelect({
  value,
  onChange,
  options,
  variant = 'field',
  placeholder = '—',
  size = 'md',
  disabled,
  showInTag,
  'aria-label': ariaLabel = 'Input select',
  defaultOpen = false,
}: InputSelectProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [activeId, setActiveId] = useState<string | null>(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxId = useId()

  const selectedOption = options.find(o => o.id === value) ?? null
  const displayLabel = selectedOption?.label ?? placeholder

  function openMenu() {
    if (disabled) return
    setActiveId(value)
    setOpen(true)
  }

  function closeMenu() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function handleSelect(id: string) {
    onChange(id)
    closeMenu()
  }

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        openMenu()
      }
      return
    }
    const idx = options.findIndex(o => o.id === activeId)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Past the last item → clear active (allows ArrowUp to return to last)
      setActiveId(idx < options.length - 1 ? (options[idx + 1]?.id ?? null) : null)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // null means past-end; ArrowUp snaps back to last item
      if (idx === -1) {
        setActiveId(options[options.length - 1]?.id ?? null)
      } else {
        setActiveId(options[Math.max(idx - 1, 0)]?.id ?? null)
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeId) handleSelect(activeId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
    }
  }

  const triggerClass = variant === 'chip' ? styles.chip : styles.field

  return (
    <div
      ref={containerRef}
      className={styles.root}
      data-variant={variant}
      data-size={size}
      data-open={open || undefined}
    >
      <button
        ref={triggerRef}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        onKeyDown={handleKeyDown}
      >
        {variant === 'field' && showInTag && (
          <span className={styles.inTag} aria-hidden="true">IN</span>
        )}
        <span className={styles.displayLabel} data-muted={!selectedOption || undefined}>
          {displayLabel}
        </span>
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>
      {open && (
        <ListboxPopover
          id={listboxId}
          options={options}
          selectedId={value}
          activeId={activeId}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}
