// src/components/IdeasLibrary/IdeasLibrary.tsx
import { useState } from 'react'
import { MagnifyingGlass, DotsSixVertical, Play, Stop, Trash, Lightbulb } from '@phosphor-icons/react'
import { Clip } from '../Clip'
import { TextField } from '../TextField'
import styles from './IdeasLibrary.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Idea {
  id: string
  name: string
  bpm: number
  /** "Song name / Track name" — which project/track it came from */
  source: string
  labels: string[]
  /** Musical key + mode, e.g. "C minor" */
  scale: string
  /** Normalised amplitude values [0, 1] for the waveform preview */
  peaks: number[]
}

export interface IdeasLibraryProps {
  ideas: Idea[]
  onPlay: (id: string) => void
  onDragToProject: (id: string) => void
  onLabel: (id: string, labels: string[]) => void
  onDelete: (id: string) => void
}

type BpmBand = 'all' | 'slow' | 'mid' | 'fast'

// ─── Filtering helpers ────────────────────────────────────────────────────────

function matchesBpm(bpm: number, band: BpmBand): boolean {
  if (band === 'slow') return bpm < 80
  if (band === 'mid')  return bpm >= 80 && bpm < 130
  if (band === 'fast') return bpm >= 130
  return true
}

function filterIdeas(
  ideas: Idea[],
  search: string,
  bpmBand: BpmBand,
  labelFilter: string | null,
  scaleFilter: string | null,
): Idea[] {
  const q = search.toLowerCase().trim()
  return ideas.filter(idea => {
    if (q) {
      const hit =
        idea.name.toLowerCase().includes(q) ||
        idea.source.toLowerCase().includes(q) ||
        idea.scale.toLowerCase().includes(q) ||
        idea.labels.some(l => l.toLowerCase().includes(q))
      if (!hit) return false
    }
    if (!matchesBpm(idea.bpm, bpmBand)) return false
    if (labelFilter !== null && !idea.labels.includes(labelFilter)) return false
    if (scaleFilter !== null && idea.scale !== scaleFilter) return false
    return true
  })
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}

// ─── BPM Segmented Control ────────────────────────────────────────────────────

const BPM_BANDS: { value: BpmBand; label: string }[] = [
  { value: 'all',  label: 'All' },
  { value: 'slow', label: '< 80' },
  { value: 'mid',  label: '80–130' },
  { value: 'fast', label: '130+' },
]

interface BpmSegmentedProps {
  value: BpmBand
  onChange: (v: BpmBand) => void
}

function BpmSegmented({ value, onChange }: BpmSegmentedProps) {
  return (
    <div
      className={styles.segmented}
      role="radiogroup"
      aria-label="BPM filter"
    >
      {BPM_BANDS.map(band => (
        <button
          key={band.value}
          role="radio"
          aria-checked={value === band.value}
          className={styles.segmentedBtn}
          data-active={value === band.value || undefined}
          onClick={() => onChange(band.value)}
        >
          {band.label}
        </button>
      ))}
    </div>
  )
}

// ─── IdeaCard ─────────────────────────────────────────────────────────────────

interface IdeaCardProps {
  idea: Idea
  playing: boolean
  dragging: boolean
  onPlay: () => void
  onStop: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
}

function IdeaCard({
  idea,
  playing,
  dragging,
  onPlay,
  onStop,
  onDragStart,
  onDragEnd,
  onDelete,
}: IdeaCardProps) {
  function handleDragKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Keyboard alternative to dragging: fire the callback directly
      const syntheticDrag = { dataTransfer: { setData: () => {}, effectAllowed: 'copy' } } as unknown as React.DragEvent
      onDragStart(syntheticDrag)
    }
  }

  return (
    <article
      className={styles.card}
      data-playing={playing || undefined}
      data-dragging={dragging || undefined}
    >
      {/* ── Drag handle ──────────────────────────────────────────────────── */}
      <div
        className={styles.dragHandle}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        aria-label={`Drag ${idea.name} to project`}
        role="button"
        tabIndex={0}
        onKeyDown={handleDragKeyDown}
        data-testid="drag-handle"
      >
        <DotsSixVertical size={14} weight="bold" aria-hidden="true" />
      </div>

      {/* ── Waveform + play overlay ──────────────────────────────────────── */}
      <div className={styles.waveformArea}>
        <div className={styles.waveformClip}>
          <Clip peaks={idea.peaks} color="var(--accent)" />
        </div>
        <button
          className={styles.playBtn}
          onClick={playing ? onStop : onPlay}
          aria-label={playing ? `Stop ${idea.name}` : `Play ${idea.name}`}
          data-playing={playing || undefined}
          data-testid="play-btn"
        >
          {playing
            ? <Stop  size={14} weight="fill" aria-hidden="true" />
            : <Play  size={14} weight="fill" aria-hidden="true" />
          }
        </button>
      </div>

      {/* ── Metadata ──────────────────────────────────────────────────────── */}
      <div className={styles.meta}>
        <span className={styles.name}>{idea.name}</span>

        <div className={styles.badges}>
          <span className={styles.bpmBadge} aria-label={`${idea.bpm} BPM`}>
            {idea.bpm}<span className={styles.bpmUnit}> BPM</span>
          </span>
          <span className={styles.scaleBadge}>{idea.scale}</span>
        </div>

        <span className={styles.source}>{idea.source}</span>

        {idea.labels.length > 0 && (
          <div className={styles.labelList} aria-label="Labels">
            {idea.labels.map(l => (
              <span key={l} className={styles.labelChip}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Delete ────────────────────────────────────────────────────────── */}
      <button
        className={styles.deleteBtn}
        onClick={onDelete}
        aria-label={`Delete ${idea.name}`}
        data-testid="delete-btn"
      >
        <Trash size={12} weight="bold" aria-hidden="true" />
      </button>
    </article>
  )
}

// ─── IdeasLibrary ─────────────────────────────────────────────────────────────

export function IdeasLibrary({
  ideas,
  onPlay,
  onDragToProject,
  onDelete,
}: IdeasLibraryProps) {
  const [search,      setSearch]      = useState('')
  const [bpmBand,     setBpmBand]     = useState<BpmBand>('all')
  const [labelFilter, setLabelFilter] = useState<string | null>(null)
  const [scaleFilter, setScaleFilter] = useState<string | null>(null)
  const [playingId,   setPlayingId]   = useState<string | null>(null)
  const [draggingId,  setDraggingId]  = useState<string | null>(null)

  const allLabels = uniqueSorted(ideas.flatMap(i => i.labels))
  const allScales = uniqueSorted(ideas.map(i => i.scale))
  const filtered  = filterIdeas(ideas, search, bpmBand, labelFilter, scaleFilter)
  const hasActiveFilters = bpmBand !== 'all' || labelFilter !== null || scaleFilter !== null

  function handlePlay(id: string) {
    setPlayingId(id)
    onPlay(id)
  }

  function handleStop() {
    setPlayingId(null)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/jackdaw-idea', id)
      e.dataTransfer.effectAllowed = 'copy'
    }
    onDragToProject(id)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function handleClearFilters() {
    setBpmBand('all')
    setLabelFilter(null)
    setScaleFilter(null)
  }

  function toggleLabelFilter(label: string) {
    setLabelFilter(prev => (prev === label ? null : label))
  }

  function toggleScaleFilter(scale: string) {
    setScaleFilter(prev => (prev === scale ? null : scale))
  }

  return (
    <section className={styles.root} aria-label="Ideas Library">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Ideas</h2>
          <div className={styles.searchWrap}>
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search ideas…"
              type="search"
              size="sm"
              aria-label="Search ideas"
              leading={<MagnifyingGlass size={12} aria-hidden="true" />}
            />
          </div>
        </div>

        <div className={styles.filterRow}>
          <BpmSegmented value={bpmBand} onChange={setBpmBand} />

          {allLabels.length > 0 && (
            <div className={styles.filterGroup} role="group" aria-label="Label filter">
              {allLabels.map(l => (
                <button
                  key={l}
                  className={styles.filterChip}
                  data-active={labelFilter === l || undefined}
                  aria-pressed={labelFilter === l}
                  onClick={() => toggleLabelFilter(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          )}

          {allScales.length > 0 && (
            <div className={styles.filterGroup} role="group" aria-label="Scale filter">
              {allScales.map(s => (
                <button
                  key={s}
                  className={styles.filterChip}
                  data-active={scaleFilter === s || undefined}
                  aria-pressed={scaleFilter === s}
                  onClick={() => toggleScaleFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              className={styles.clearBtn}
              onClick={handleClearFilters}
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      <div className={styles.list} role="list" data-testid="ideas-list">
        {ideas.length === 0 && (
          <div className={styles.empty} data-testid="empty-initial">
            <Lightbulb
              className={styles.emptyIcon}
              size={28}
              weight="thin"
              aria-hidden="true"
            />
            <span className={styles.emptyTitle}>No ideas yet</span>
            <span className={styles.emptyHint}>Save a riff to start your library.</span>
          </div>
        )}

        {ideas.length > 0 && filtered.length === 0 && (
          <div className={styles.empty} data-testid="empty-search">
            <span className={styles.emptyTitle}>No matches</span>
            <span className={styles.emptyHint}>Try a different search or filter.</span>
          </div>
        )}

        {filtered.map(idea => (
          <div key={idea.id} role="listitem">
            <IdeaCard
              idea={idea}
              playing={playingId === idea.id}
              dragging={draggingId === idea.id}
              onPlay={() => handlePlay(idea.id)}
              onStop={handleStop}
              onDragStart={e => handleDragStart(e, idea.id)}
              onDragEnd={handleDragEnd}
              onDelete={() => onDelete(idea.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
