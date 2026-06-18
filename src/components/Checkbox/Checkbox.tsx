import { useEffect, useRef } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps {
  checked: boolean
  onChange: (next: boolean, e: React.ChangeEvent<HTMLInputElement>) => void
  indeterminate?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  label?: string
  'aria-label'?: string
  autoFocus?: boolean
}

export function Checkbox({
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
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (disabled) return
    onChange(e.target.checked, e)
  }

  return (
    <label
      className={styles.root}
      data-size={size}
      data-disabled={disabled || undefined}
    >
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
      <span className={styles.box} aria-hidden="true" />
      {label && <span className={styles.label}>{label}</span>}
    </label>
  )
}
