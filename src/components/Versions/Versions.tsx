// src/components/Versions/Versions.tsx
//
// Linear, immutable version history with select/load, two-up compare/diff, rename,
// and restore-as-new-Take. History is strictly newest→oldest; no branching.
//
// Selection is fully controlled via `selected` (array of up to 2 IDs).
// When exactly 2 IDs are selected the component fires onCompare(a, b) automatically
// so the app can compute and pass back the `diff` prop.

import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { PencilSimple, ArrowCounterClockwise } from '@phosphor-icons/react'
import styles from './Versions.module.css'

export interface VersionEntry {
  id: string
  name: string
  date: string // ISO 8601
  note?: string
  current?: boolean
  author?: string
}

export interface VersionDiff {
  tracksAdded: number
  tracksRemoved: number
  clipsAdded: number
  clipsRemoved: number
  clipsModified: number
  lyricsChanged: boolean
}

export interface VersionsProps {
  versions: VersionEntry[]
  selected: string[]
  diff?: VersionDiff
  onSelect: (id: string) => void
  onCompare: (a: string, b: string) => void
  onRename: (id: string, name: string) => void
  onRestore: (id: string) => void
  size?: 'sm' | 'md'
}

function formatDate(iso: string): { display: string; time: string } {
  try {
    const d = new Date(iso)
    const display = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
    return { display, time }
  } catch {
    return { display: iso, time: '' }
  }
}

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className={styles.avatar} aria-label={name} title={name}>
      {initials}
    </span>
  )
}

interface DiffPanelProps {
  a: string
  b: string
  diff: VersionDiff | undefined
  versions: VersionEntry[]
}

function DiffPanel({ a, b, diff, versions }: DiffPanelProps) {
  const nameA = versions.find(v => v.id === a)?.name ?? a
  const nameB = versions.find(v => v.id === b)?.name ?? b

  return (
    <div className={styles.diffPanel} aria-label="Comparison">
      <div className={styles.diffHeader}>
        <span className={styles.diffTitle}>Compare</span>
        <span className={styles.diffVersions}>
          <span className={styles.diffVersionA}>{nameA}</span>
          <span className={styles.diffArrow} aria-hidden>→</span>
          <span className={styles.diffVersionB}>{nameB}</span>
        </span>
      </div>
      {diff ? (
        <DiffRows diff={diff} />
      ) : (
        <div className={styles.diffLoading} aria-live="polite">
          <span className={styles.diffLoadingDot} aria-hidden />
          <span>Loading diff…</span>
        </div>
      )}
    </div>
  )
}

function DiffRows({ diff }: { diff: VersionDiff }) {
  type Row = {
    key: string
    label: string
    added?: number
    removed?: number
    modified?: number
    changed?: boolean
  }

  const rows: Row[] = []

  if (diff.tracksAdded || diff.tracksRemoved) {
    rows.push({
      key: 'tracks',
      label: 'Tracks',
      added: diff.tracksAdded || undefined,
      removed: diff.tracksRemoved || undefined,
    })
  }
  if (diff.clipsAdded || diff.clipsRemoved) {
    rows.push({
      key: 'clips-ar',
      label: 'Clips',
      added: diff.clipsAdded || undefined,
      removed: diff.clipsRemoved || undefined,
    })
  }
  if (diff.clipsModified) {
    rows.push({ key: 'clips-m', label: 'Clips modified', modified: diff.clipsModified })
  }
  if (diff.lyricsChanged) {
    rows.push({ key: 'lyrics', label: 'Lyrics', changed: true })
  }

  if (rows.length === 0) {
    return (
      <p className={styles.diffNoChanges}>No changes between these versions.</p>
    )
  }

  return (
    <ul className={styles.diffList} aria-label="Changes">
      {rows.map(r => (
        <li key={r.key} className={styles.diffRow}>
          <span className={styles.diffRowLabel}>{r.label}</span>
          <span className={styles.diffRowChanges}>
            {r.added != null && (
              <span className={styles.diffAdded} aria-label={`${r.added} added`}>
                +{r.added}
              </span>
            )}
            {r.removed != null && (
              <span className={styles.diffRemoved} aria-label={`${r.removed} removed`}>
                −{r.removed}
              </span>
            )}
            {r.modified != null && (
              <span className={styles.diffModified} aria-label={`${r.modified} modified`}>
                ~{r.modified}
              </span>
            )}
            {r.changed && <span className={styles.diffChanged}>changed</span>}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Versions({
  versions,
  selected,
  diff,
  onSelect,
  onCompare,
  onRename,
  onRestore,
  size = 'md',
}: VersionsProps) {
  const listId = useId()

  const [focusedIdx, setFocusedIdx] = useState(() => {
    const currentIdx = versions.findIndex(v => v.current)
    return currentIdx >= 0 ? currentIdx : 0
  })

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const onCompareRef = useRef(onCompare)
  useEffect(() => {
    onCompareRef.current = onCompare
  }, [onCompare])

  // Fire onCompare whenever exactly 2 versions are selected.
  useEffect(() => {
    if (selected.length === 2) {
      onCompareRef.current(selected[0], selected[1])
    }
  }, [selected])

  const handleOptionClick = useCallback(
    (id: string, idx: number) => {
      if (renamingId) return
      setFocusedIdx(idx)
      onSelect(id)
    },
    [onSelect, renamingId],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (renamingId) return
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = Math.min(focusedIdx + 1, versions.length - 1)
          setFocusedIdx(next)
          itemRefs.current[next]?.focus()
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = Math.max(focusedIdx - 1, 0)
          setFocusedIdx(prev)
          itemRefs.current[prev]?.focus()
          break
        }
        case 'Home': {
          e.preventDefault()
          setFocusedIdx(0)
          itemRefs.current[0]?.focus()
          break
        }
        case 'End': {
          e.preventDefault()
          const last = versions.length - 1
          setFocusedIdx(last)
          itemRefs.current[last]?.focus()
          break
        }
        case 'Enter':
        case ' ': {
          e.preventDefault()
          const v = versions[focusedIdx]
          if (v) onSelect(v.id)
          break
        }
      }
    },
    [focusedIdx, versions, onSelect, renamingId],
  )

  const startRename = useCallback((id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingId(id)
    setRenameValue(name)
  }, [])

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }, [renamingId, renameValue, onRename])

  const cancelRename = useCallback(() => {
    setRenamingId(null)
  }, [])

  if (versions.length === 0) {
    return (
      <div className={styles.root} data-size={size} data-empty="">
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No versions yet.</p>
          <p className={styles.emptyHint}>Save your project to create the first Take.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root} data-size={size}>
      <ul
        id={listId}
        role="listbox"
        aria-label="Version history"
        aria-multiselectable="true"
        className={styles.timeline}
        onKeyDown={handleKeyDown}
      >
        {versions.map((version, idx) => {
          const isSelected = selected.includes(version.id)
          const compareIdx = selected.indexOf(version.id)
          const isRenaming = renamingId === version.id
          const isFocused = focusedIdx === idx
          const isLast = idx === versions.length - 1
          const { display, time } = formatDate(version.date)

          return (
            <li
              key={version.id}
              ref={el => {
                itemRefs.current[idx] = el
              }}
              role="option"
              aria-selected={isSelected}
              tabIndex={isFocused ? 0 : -1}
              className={styles.row}
              data-current={version.current || undefined}
              data-selected={isSelected || undefined}
              data-renaming={isRenaming || undefined}
              onClick={() => handleOptionClick(version.id, idx)}
              onFocus={() => setFocusedIdx(idx)}
            >
              {/* Spine */}
              <div className={styles.spine} aria-hidden="true">
                <div className={styles.node}>
                  {compareIdx >= 0 && (
                    <span className={styles.compareIndex}>{compareIdx + 1}</span>
                  )}
                </div>
                {!isLast && <div className={styles.spline} />}
              </div>

              {/* Content */}
              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  {isRenaming ? (
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitRename()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelRename()
                        }
                        e.stopPropagation()
                      }}
                      onClick={e => e.stopPropagation()}
                      aria-label="Rename version"
                      autoFocus
                    />
                  ) : (
                    <span className={styles.name}>{version.name}</span>
                  )}
                  <div className={styles.metaRow}>
                    {version.current && (
                      <span className={styles.currentBadge} aria-label="Current version">
                        Current
                      </span>
                    )}
                    {version.author && <AuthorAvatar name={version.author} />}
                    <time className={styles.dateMeta} dateTime={version.date}>
                      <span className={styles.dateDisplay}>{display}</span>
                      <span className={styles.timeDisplay}>{time}</span>
                    </time>
                  </div>
                </div>

                {version.note && <p className={styles.note}>{version.note}</p>}

                {isSelected && !isRenaming && (
                  <div className={styles.actions} onClick={e => e.stopPropagation()}>
                    <button
                      className={styles.actionBtn}
                      onClick={e => startRename(version.id, version.name, e)}
                      aria-label={`Rename ${version.name}`}
                      tabIndex={-1}
                    >
                      <PencilSimple size={12} weight="bold" aria-hidden />
                      <span>Rename</span>
                    </button>
                    {!version.current && (
                      <button
                        className={styles.actionBtn}
                        onClick={e => {
                          e.stopPropagation()
                          onRestore(version.id)
                        }}
                        aria-label={`Restore ${version.name} as new Take`}
                        tabIndex={-1}
                      >
                        <ArrowCounterClockwise size={12} weight="bold" aria-hidden />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {selected.length === 2 && (
        <DiffPanel
          a={selected[0]}
          b={selected[1]}
          diff={diff}
          versions={versions}
        />
      )}
    </div>
  )
}
