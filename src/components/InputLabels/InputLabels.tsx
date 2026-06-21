// src/components/InputLabels/InputLabels.tsx
import { useEffect, useId, useRef, useState } from 'react'
import styles from './InputLabels.module.css'

export interface InputEntry {
  id: string
  name: string
  label?: string
}

export interface InputLabelsProps {
  inputs: InputEntry[]
  onLabel: (id: string, label: string) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface LabelRowProps {
  input: InputEntry
  size: 'sm' | 'md'
  onLabel: (id: string, label: string) => void
  disabled?: boolean
}

function LabelRow({ input, size, onLabel, disabled }: LabelRowProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(input.label ?? '')
  const savedRef = useRef(input.label ?? '')

  // Sync when parent updates the label externally
  useEffect(() => {
    setDraft(input.label ?? '')
    savedRef.current = input.label ?? ''
  }, [input.label])

  function commit() {
    const next = draft.trim()
    if (next !== savedRef.current) {
      setDraft(next)
      onLabel(input.id, next)
      savedRef.current = next
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      setDraft(savedRef.current)
      ;(e.target as HTMLElement).blur()
    }
  }

  return (
    <li className={styles.row} data-size={size}>
      <label className={styles.name} htmlFor={inputId}>
        {input.name}
      </label>
      <input
        id={inputId}
        className={styles.pill}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder="add a label…"
        disabled={disabled}
      />
    </li>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function InputLabels({ inputs, onLabel, size = 'md', disabled }: InputLabelsProps) {
  return (
    <div className={styles.root} data-size={size} data-disabled={disabled || undefined}>
      <ul className={styles.list} aria-label="Input labels">
        {inputs.map((input) => (
          <LabelRow key={input.id} input={input} size={size} onLabel={onLabel} disabled={disabled} />
        ))}
      </ul>
      {inputs.length === 0 && (
        <p className={styles.empty}>No inputs available.</p>
      )}
    </div>
  )
}
