import { useRef } from 'react'
import styles from './SegmentedControl.module.css'

export interface SegmentedControlOption {
  value: string
  label?: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label': string
  autoFocus?: boolean
}

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
  autoFocus,
}: SegmentedControlProps) {
  const segmentRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Roving tabindex: if value matches an option, that one is active;
  // otherwise fall back to the first so the group is always reachable by Tab.
  const selectedIdx = options.findIndex(o => o.value === value)
  const activeIdx = selectedIdx >= 0 ? selectedIdx : 0

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = options.length - 1
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index < last ? index + 1 : 0
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index > 0 ? index - 1 : last
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    else return
    e.preventDefault()
    onChange(options[next].value)
    segmentRefs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={styles.track}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            ref={el => { segmentRefs.current[i] = el }}
            role="radio"
            aria-checked={selected}
            aria-label={opt.icon && !opt.label ? opt.value : undefined}
            data-selected={selected || undefined}
            tabIndex={i === activeIdx ? 0 : -1}
            className={styles.segment}
            disabled={disabled}
            autoFocus={autoFocus && i === activeIdx}
            onClick={() => { if (!disabled) onChange(opt.value) }}
            onKeyDown={e => handleKeyDown(e, i)}
          >
            {opt.icon && <span className={styles.icon} aria-hidden="true">{opt.icon}</span>}
            {opt.label && <span className={styles.label}>{opt.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
