// src/components/InputLabels/InputLabels.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { TextField } from '../TextField'
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
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface LabelRowProps {
  input: InputEntry
  size: 'sm' | 'md'
  onLabel: (id: string, label: string) => void
}

function LabelRow({ input, size, onLabel }: LabelRowProps) {
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
    <li className={styles.row} onKeyDown={handleKeyDown} onBlur={commit}>
      <label className={styles.name} htmlFor={inputId}>
        {input.name}
      </label>
      <TextField
        id={inputId}
        value={draft}
        onChange={(v) => setDraft(v)}
        placeholder="add a label…"
        size={size}
      />
    </li>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function InputLabels({ inputs, onLabel, size = 'md' }: InputLabelsProps) {
  return (
    <div className={styles.root} data-size={size}>
      <ul className={styles.list} aria-label="Input labels">
        {inputs.map((input) => (
          <LabelRow key={input.id} input={input} size={size} onLabel={onLabel} />
        ))}
      </ul>
      {inputs.length === 0 && (
        <p className={styles.empty}>No inputs available.</p>
      )}
    </div>
  )
}
