// src/gallery/SidebarSearch.tsx
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import styles from './SidebarSearch.module.css'

interface SidebarSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export function SidebarSearch({ value, onChange, onClear, inputRef }: SidebarSearchProps) {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        <MagnifyingGlass size={13} weight="bold" />
      </span>
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search…"
        aria-label="Search components"
      />
      {value && (
        <button
          type="button"
          className={styles.clearBtn}
          aria-label="Clear search"
          onClick={onClear}
        >
          <X size={11} weight="bold" aria-hidden />
        </button>
      )}
    </div>
  )
}
