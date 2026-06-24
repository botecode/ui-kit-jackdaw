// src/components/Checkbox/Checkbox.calm.tsx
// Calm-theme variant: a soft rounded box with a gentle check, not a lit square.
// State is still carried by the native input's aria-checked; the box is decor.
import { useEffect, useRef } from 'react'
import type { CheckboxProps } from './Checkbox'
import styles from './Checkbox.calm.module.css'

export function CheckboxCalm({
  checked,
  onChange,
  indeterminate = false,
  disabled,
  size = 'md',
  label,
  'aria-label': ariaLabel,
  autoFocus,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    onChange(e.target.checked, e)
  }

  return (
    <label className={styles.root} data-size={size} data-disabled={disabled || undefined}>
      <input
        ref={inputRef}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        autoFocus={autoFocus}
      />
      <span className={styles.box} data-indeterminate={indeterminate || undefined} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}
