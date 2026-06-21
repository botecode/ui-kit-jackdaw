// src/components/ProjectPicker/ProjectPicker.tsx
import { useState, useRef, useEffect } from 'react'
import { FilePlus, ShareNetwork, X } from '@phosphor-icons/react'
import { Dialog } from '../Dialog'
import { TextField } from '../TextField'
import styles from './ProjectPicker.module.css'

export interface ProjectRecord {
  id: string
  name: string
  path: string
  lastOpened: string
}

export interface ProjectPickerProps {
  open: boolean
  onClose: () => void
  projects: ProjectRecord[]
  recent: ProjectRecord[]
  onNew: () => void
  onNewFromCode: (code: string) => void
  onOpen: (id: string) => void
  onBrowse: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectPicker({
  open,
  onClose,
  projects,
  recent,
  onNew,
  onNewFromCode,
  onOpen,
  onBrowse,
}: ProjectPickerProps) {
  const [codeExpanded, setCodeExpanded] = useState(false)
  const [code, setCode] = useState('')
  const [focusedIdx, setFocusedIdx] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const codeEntryRef = useRef<HTMLDivElement | null>(null)

  // Reset transient state when picker closes
  useEffect(() => {
    if (!open) {
      setCodeExpanded(false)
      setCode('')
      setFocusedIdx(0)
    }
  }, [open])

  // Move DOM focus to the newly focused project item (roving tabindex)
  useEffect(() => {
    itemRefs.current[focusedIdx]?.focus()
  }, [focusedIdx])

  // Auto-focus the code input when the accordion expands
  useEffect(() => {
    if (codeExpanded) {
      const input = codeEntryRef.current?.querySelector<HTMLInputElement>('input')
      input?.focus()
    }
  }, [codeExpanded])

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (trimmed) onNewFromCode(trimmed)
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, projects.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const proj = projects[focusedIdx]
      if (proj) onOpen(proj.id)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-label="Open a project"
      dismissible
      style={{ width: '720px', maxWidth: '95vw' }}
      bodyStyle={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.brand}>Jackdaw</span>
          <span className={styles.subtitle}>Open a project to start writing.</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* ── Two-column main ── */}
      <div className={styles.main}>
        {/* Left: action cards */}
        <div className={styles.actions}>
          <p className={styles.sectionLabel}>Start</p>

          <button className={styles.actionCard} onClick={onNew} aria-label="New">
            <span className={styles.actionIcon}>
              <FilePlus size={18} />
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionName}>New</span>
              <span className={styles.actionDesc}>Start a fresh song</span>
            </span>
          </button>

          <button
            className={styles.actionCard}
            onClick={() => setCodeExpanded(v => !v)}
            aria-expanded={codeExpanded}
          >
            <span className={styles.actionIcon}>
              <ShareNetwork size={18} />
            </span>
            <span className={styles.actionText}>
              <span className={styles.actionName}>New from code</span>
              <span className={styles.actionDesc}>Receive a shared project</span>
            </span>
          </button>

          {/* Code-entry accordion */}
          <div
            ref={codeEntryRef}
            className={styles.codeEntry}
            data-expanded={codeExpanded || undefined}
            aria-hidden={!codeExpanded}
          >
            <form onSubmit={handleCodeSubmit} className={styles.codeForm}>
              <TextField
                value={code}
                onChange={(v) => setCode(v)}
                placeholder="e.g. abc-123-xyz"
                label="Share code"
                size="sm"
              />
              <button
                type="submit"
                className={styles.goBtn}
                disabled={!code.trim()}
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Right: all projects */}
        <div className={styles.projects}>
          <p className={styles.sectionLabel}>All my projects</p>

          {projects.length === 0 ? (
            <p className={styles.empty}>No projects yet. Start a new one.</p>
          ) : (
            <div
              role="listbox"
              aria-label="All projects"
              className={styles.projectList}
              onKeyDown={handleListKeyDown}
            >
              {projects.map((proj, idx) => (
                <div
                  key={proj.id}
                  role="option"
                  aria-selected={idx === focusedIdx}
                  tabIndex={idx === focusedIdx ? 0 : -1}
                  className={styles.projectItem}
                  data-selected={idx === focusedIdx || undefined}
                  ref={el => { itemRefs.current[idx] = el }}
                  onClick={() => { setFocusedIdx(idx); onOpen(proj.id) }}
                  onFocus={() => setFocusedIdx(idx)}
                >
                  <span className={styles.projectName}>{proj.name}</span>
                  <span className={styles.projectPath}>{proj.path}</span>
                  <time className={styles.projectDate} dateTime={proj.lastOpened}>
                    {formatDate(proj.lastOpened)}
                  </time>
                </div>
              ))}
            </div>
          )}

          <button className={styles.browseBtn} onClick={onBrowse}>
            Browse…
          </button>
        </div>
      </div>

      {/* ── Recent ── */}
      {recent.length > 0 && (
        <div className={styles.recent}>
          <p className={styles.sectionLabel}>Recent</p>
          <div className={styles.recentList}>
            {recent.map(proj => (
              <button
                key={proj.id}
                className={styles.recentItem}
                onClick={() => onOpen(proj.id)}
              >
                <span className={styles.projectName}>{proj.name}</span>
                <span className={styles.projectPath}>{proj.path}</span>
                <time className={styles.projectDate} dateTime={proj.lastOpened}>
                  {formatDate(proj.lastOpened)}
                </time>
              </button>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  )
}
