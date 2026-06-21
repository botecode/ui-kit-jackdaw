// src/components/InputLabels/InputLabels.tsx
import styles from './InputLabels.module.css'
import { TextField } from '../TextField'

export interface InputEntry {
  id: string
  name: string
  label?: string
}

export interface InputLabelsProps {
  inputs: InputEntry[]
  onLabel: (id: string, label: string) => void
}

export function InputLabels({ inputs, onLabel }: InputLabelsProps) {
  return (
    <div className={styles.root} role="list" aria-label="Input labels">
      {inputs.length === 0 && (
        <div className={styles.empty}>No inputs available</div>
      )}
      {inputs.map((input) => (
        <div key={input.id} className={styles.row} role="listitem">
          <span className={styles.inputName} aria-hidden="true">
            {input.name}
          </span>
          <div className={styles.fieldWrap}>
            <TextField
              value={input.label ?? ''}
              onChange={(value) => onLabel(input.id, value)}
              placeholder="add a label…"
              size="sm"
              aria-label={`Label for ${input.name}`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
