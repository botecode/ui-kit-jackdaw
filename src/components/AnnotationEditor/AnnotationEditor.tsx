// src/components/AnnotationEditor/AnnotationEditor.tsx
//
// Annotation create/edit popup anchored at a timeline time position.
// Type-aware: lyrics/chords/tabs get a text field; comments get text + record button.
// Composes the Popover shell (point-anchor). Focus on open via explicit ref.focus()
// to handle WKWebView's "clicking a button doesn't focus it" gotcha.

import { useLayoutEffect, useRef, useState } from 'react'
import { Popover } from '../Popover'
import styles from './AnnotationEditor.module.css'

export type AnnotationType = 'lyrics' | 'chords' | 'tabs' | 'comment'

export interface AudioRef {
  url: string
  durationMs: number
}

export interface AnnotationEditorProps {
  type: AnnotationType
  anchor: { x: number; y: number }
  value?: string | AudioRef
  time: number                              // seconds — displayed in header
  containerRef: React.RefObject<HTMLElement | null>
  onSave: (content: string | AudioRef) => void
  onDelete?: () => void                     // absent = create mode
  onCancel: () => void
  onRecord?: () => Promise<AudioRef>        // stubbed in gallery (no real capture)
}

const TYPE_LABEL: Record<AnnotationType, string> = {
  lyrics:  'Lyrics',
  chords:  'Chords',
  tabs:    'Tab',
  comment: 'Comment',
}

function isAudioRef(v: unknown): v is AudioRef {
  return typeof v === 'object' && v !== null && 'url' in v
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const tenths = Math.floor((ms % 1000) / 100)
  return `${s}.${tenths}s`
}

export function AnnotationEditor({
  type,
  anchor,
  value,
  time,
  containerRef,
  onSave,
  onDelete,
  onCancel,
  onRecord,
}: AnnotationEditorProps) {
  const initialText  = isAudioRef(value) ? '' : (value ?? '')
  const initialAudio = isAudioRef(value) ? value : null

  const [draft,     setDraft]     = useState(initialText)
  const [audioRef,  setAudioRef]  = useState<AudioRef | null>(initialAudio)
  const [recording, setRecording] = useState(false)

  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)

  // Explicit focus on mount — WKWebView doesn't auto-focus on button click.
  useLayoutEffect(() => {
    fieldRef.current?.focus()
  }, [])

  function handleSave() {
    // Audio takes priority only when there's no text draft
    if (type === 'comment' && audioRef && !draft.trim()) {
      onSave(audioRef)
    } else {
      onSave(draft)
    }
  }

  async function handleRecord() {
    if (recording || !onRecord) return
    setRecording(true)
    try {
      const ref = await onRecord()
      setAudioRef(ref)
    } finally {
      setRecording(false)
    }
  }

  function clearAudio() {
    setAudioRef(null)
  }

  const isEdit      = onDelete !== undefined
  const isMultiLine = type === 'lyrics' || type === 'tabs'
  const isMono      = type === 'tabs'

  return (
    <Popover
      anchor={anchor}
      containerRef={containerRef}
      onClose={onCancel}
    >
      <div className={styles.shell} data-type={type}>
        {/* Header: type label + time marker */}
        <div className={styles.header}>
          <span className={styles.typeLabel}>{TYPE_LABEL[type]}</span>
          <span className={styles.timeLabel}>{formatTime(time)}</span>
        </div>

        {/* Body: field + optional audio section */}
        <div className={styles.body}>
          {isMultiLine ? (
            <textarea
              ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
              className={styles.textarea}
              data-mono={isMono || undefined}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={type === 'lyrics' ? 'Enter lyrics…' : 'Enter tab notation…'}
              rows={4}
              aria-label={TYPE_LABEL[type]}
            />
          ) : (
            <input
              ref={fieldRef as React.RefObject<HTMLInputElement>}
              type="text"
              className={styles.input}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={type === 'chords' ? 'e.g. Am  G  C  F' : 'Add a comment…'}
              aria-label={TYPE_LABEL[type]}
            />
          )}

          {/* Audio section — comment type only */}
          {type === 'comment' && (
            <div className={styles.audioSection}>
              {audioRef ? (
                // Play chip: shown once a recording exists
                <div className={styles.playChip} aria-label="Recorded audio">
                  <span className={styles.playChipIcon} aria-hidden="true">▶</span>
                  <span className={styles.playChipLabel}>
                    {formatDuration(audioRef.durationMs)}
                  </span>
                  <button
                    className={styles.clearAudioBtn}
                    onClick={clearAudio}
                    aria-label="Remove recording"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ) : (
                // Record button: one-shot action, disabled while capturing
                <button
                  className={styles.recordBtn}
                  onClick={handleRecord}
                  disabled={!onRecord || recording}
                  data-recording={recording || undefined}
                  aria-label="Record audio comment"
                  type="button"
                >
                  <span className={styles.recordDot} aria-hidden="true" />
                  {recording ? 'Recording…' : 'Record'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer: Delete (edit-mode) + Cancel + Save */}
        <div className={styles.footer}>
          {isEdit && (
            <button
              className={styles.deleteBtn}
              onClick={onDelete}
              type="button"
              aria-label="Delete annotation"
            >
              Delete
            </button>
          )}
          <div className={styles.footerActions}>
            <button
              className={styles.cancelBtn}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Popover>
  )
}
