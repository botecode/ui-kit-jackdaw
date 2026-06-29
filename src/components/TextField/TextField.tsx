import { useId } from 'react'
import styles from './TextField.module.css'

export interface TextFieldProps {
  value: string
  onChange: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  error?: string | boolean
  type?: 'text' | 'search' | 'password'
  size?: 'sm' | 'md'
  /**
   * Surface vocabulary. `'stage'` (default) is the recessed dark well — the
   * Studio hardware face. `'surface'` is the calm paper face for Home screens
   * (warm light field, ink text) so the same input reskins without a black well.
   */
  tone?: 'stage' | 'surface'
  'aria-label'?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  autoFocus?: boolean
  id?: string
}

export function TextField({
  value,
  onChange,
  placeholder,
  label,
  disabled,
  error,
  type = 'text',
  size = 'md',
  tone = 'stage',
  'aria-label': ariaLabel,
  leading,
  trailing,
  autoFocus,
  id: idProp,
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = idProp ?? generatedId

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value, e)
  }

  return (
    <div
      className={styles.root}
      data-size={size}
      data-tone={tone}
      data-disabled={disabled || undefined}
      data-error={error ? '' : undefined}
    >
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.field}>
        {leading && (
          <span className={styles.leading} aria-hidden="true">
            {leading}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          className={styles.input}
          autoFocus={autoFocus}
        />
        {trailing && (
          <span className={styles.trailing} aria-hidden="true">
            {trailing}
          </span>
        )}
      </div>
      {typeof error === 'string' && error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
