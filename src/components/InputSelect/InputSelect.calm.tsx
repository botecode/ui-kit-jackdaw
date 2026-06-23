// src/components/InputSelect/InputSelect.calm.tsx
// Calm-theme variant of InputSelect. Same dropdown (the shared Popover +
// ListboxPopover, which are token-themed), but the trigger is a quiet calm
// chip/field instead of the recessed console control.
import { useId, useRef, useState } from 'react'
import { ListboxPopover } from './ListboxPopover'
import type { InputSelectProps } from './InputSelect'
import { Popover } from '../Popover'
import styles from './InputSelect.calm.module.css'

export function InputSelectCalm({
  value,
  onChange,
  options,
  variant = 'field',
  placeholder = 'Input',
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
      setActiveId(idx < options.length - 1 ? (options[idx + 1]?.id ?? null) : null)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx === -1) setActiveId(options[options.length - 1]?.id ?? null)
      else setActiveId(options[Math.max(idx - 1, 0)]?.id ?? null)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeId) handleSelect(activeId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeMenu()
    }
  }

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
        className={variant === 'chip' ? styles.chip : styles.field}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeId ? `${listboxId}-${activeId}` : undefined}
        aria-label={ariaLabel}
        title={selectedOption
          ? selectedOption.inputName
            ? `${selectedOption.label} (${selectedOption.inputName})`
            : selectedOption.label
          : undefined}
        disabled={disabled}
        onClick={open ? closeMenu : openMenu}
        onKeyDown={handleKeyDown}
      >
        {variant === 'field' && showInTag && (
          <span className={styles.inTag} aria-hidden="true">in</span>
        )}
        <span className={styles.displayLabel} data-muted={!selectedOption || undefined}>
          {selectedOption ? (
            <>
              {selectedOption.label}
              {selectedOption.inputName && (
                <span className={styles.deviceName}>({selectedOption.inputName})</span>
              )}
            </>
          ) : placeholder}
        </span>
        <span className={styles.caret} aria-hidden="true">▾</span>
      </button>
      {open && (
        <Popover
          containerRef={containerRef as React.RefObject<HTMLElement>}
          returnFocusRef={triggerRef as React.RefObject<HTMLElement>}
          anchorRef={triggerRef as React.RefObject<HTMLElement>}
          onClose={closeMenu}
        >
          <ListboxPopover
            id={listboxId}
            options={options}
            selectedId={value}
            activeId={activeId}
            onSelect={handleSelect}
          />
        </Popover>
      )}
    </div>
  )
}
