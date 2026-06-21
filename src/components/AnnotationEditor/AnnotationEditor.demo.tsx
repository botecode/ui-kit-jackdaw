// src/components/AnnotationEditor/AnnotationEditor.demo.tsx
import { useLayoutEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { AnnotationEditor } from './AnnotationEditor'
import type { AnnotationType, AudioRef } from './AnnotationEditor'

export const meta: DemoMeta = {
  name:  'AnnotationEditor',
  group: 'Composites',
  route: '/annotation-editor',
  order: 72,
}

// ── Stub audio fixture ────────────────────────────────────────────────────────

const STUB_AUDIO: AudioRef = { url: 'stub://audio', durationMs: 4200 }

// Simulates a 1.5 s recording delay; no real mic access in the gallery
function stubRecord(): Promise<AudioRef> {
  return new Promise(resolve => setTimeout(() => resolve(STUB_AUDIO), 1500))
}

// ── State card ────────────────────────────────────────────────────────────────

// Each card renders the editor inline (no real viewport anchor needed for the
// States grid — the popover positions itself at the fixed {x,y} within the card).

interface EditorCardProps {
  label: string
  type: AnnotationType
  value?: string | AudioRef
  editMode?: boolean
}

function EditorCard({ label, type, value, editMode }: EditorCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const [result, setResult] = useState<string | null>(null)

  // Compute viewport anchor once the container is in the DOM.
  // anchor={x:8,y:8} would be viewport coords that pin to the top-left corner —
  // instead use the card's actual viewport position + a small inset.
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const { left, top } = containerRef.current.getBoundingClientRect()
    setAnchor({ x: left + 8, y: top + 8 })
  }, [])

  function reset() { setResult(null) }

  const TIME: Record<AnnotationType, number> = {
    lyrics: 12, chords: 45, tabs: 90, comment: 33,
  }

  return (
    <State label={label}>
      <div
        ref={containerRef}
        style={{ position: 'relative', minHeight: 220, minWidth: 300 }}
      >
        {result !== null ? (
          <div style={{
            padding: 'var(--space-2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            <span style={{ color: 'var(--text)' }}>{result}</span>
            <br />
            <button
              onClick={reset}
              style={{
                marginTop: 'var(--space-2)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '2px var(--space-2)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              Re-open
            </button>
          </div>
        ) : anchor ? (
          <AnnotationEditor
            type={type}
            anchor={anchor}
            value={value}
            time={TIME[type]}
            containerRef={containerRef}
            onSave={content => {
              const text = typeof content === 'object' ? '[audio recorded]' : content || '(empty)'
              setResult(`Saved: ${text}`)
            }}
            onDelete={editMode ? () => setResult('Deleted') : undefined}
            onCancel={() => setResult('Cancelled')}
            onRecord={type === 'comment' ? stubRecord : undefined}
          />
        ) : null}
      </div>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <EditorCard
        label="Create — lyrics (empty)"
        type="lyrics"
      />
      <EditorCard
        label="Edit — lyrics (pre-filled)"
        type="lyrics"
        value="Amazing Grace, how sweet the sound"
        editMode
      />
      <EditorCard
        label="Create — chords"
        type="chords"
      />
      <EditorCard
        label="Edit — chords (pre-filled)"
        type="chords"
        value="Am  G  C  F"
        editMode
      />
      <EditorCard
        label="Create — tabs (empty)"
        type="tabs"
      />
      <EditorCard
        label="Edit — tabs (monospace, pre-filled)"
        type="tabs"
        value={"e|--0--2--3--|\nB|--1--3--5--|"}
        editMode
      />
      <EditorCard
        label="Comment — text"
        type="comment"
        value="check the reverb tail here"
        editMode
      />
      <EditorCard
        label="Comment — audio play-chip (pre-recorded)"
        type="comment"
        value={STUB_AUDIO}
        editMode
      />
      <EditorCard
        label="Comment — create (record stub)"
        type="comment"
      />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [type, setType]         = useState<AnnotationType>('lyrics')
  const [editMode, setEditMode] = useState(false)
  const [open, setOpen]         = useState(true)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [anchor, setAnchor]     = useState<{ x: number; y: number } | null>(null)

  // Compute a sensible initial anchor once the container is in the DOM.
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const { left, top } = containerRef.current.getBoundingClientRect()
    setAnchor({ x: left + 16, y: top + 16 })
  }, [])

  const typeOptions: { value: AnnotationType; label: string }[] = [
    { value: 'lyrics',  label: 'Lyrics'  },
    { value: 'chords',  label: 'Chords'  },
    { value: 'tabs',    label: 'Tab'     },
    { value: 'comment', label: 'Comment' },
  ]

  function handleType(next: AnnotationType) {
    setType(next)
    setOpen(true)
    setLastAction(null)
  }

  const editValue = editMode
    ? (type === 'comment' ? 'nice take on that chorus' : 'Some existing text')
    : undefined

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Click surface — represents the annotation lane */}
        <div
          ref={containerRef}
          onClick={e => {
            if (!open) {
              // Anchor to where the user clicked — this is how AnnotationLane will
              // call the editor in the real app (clientX/Y from the pointer event).
              setAnchor({ x: e.clientX, y: e.clientY })
              setOpen(true)
              setLastAction(null)
            }
          }}
          style={{
            position: 'relative',
            width: 360,
            minHeight: 280,
            background: 'var(--stage)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            cursor: open ? 'default' : 'pointer',
          }}
          role="region"
          aria-label="Annotation lane — click to open editor"
        >
          {!open && (
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--stage-text)',
              userSelect: 'none',
              pointerEvents: 'none',
            }}>
              Click to re-open editor
            </span>
          )}

          {open && anchor && (
            <AnnotationEditor
              type={type}
              anchor={anchor}
              value={editValue}
              time={42}
              containerRef={containerRef}
              onSave={content => {
                const text = typeof content === 'object' ? '[audio]' : content || '(empty)'
                setLastAction(`Saved: ${text}`)
                setOpen(false)
              }}
              onDelete={editMode ? () => { setLastAction('Deleted'); setOpen(false) } : undefined}
              onCancel={() => { setLastAction('Cancelled'); setOpen(false) }}
              onRecord={type === 'comment' ? stubRecord : undefined}
            />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Type
            </span>
            {typeOptions.map(opt => (
              <Toggle
                key={opt.value}
                checked={type === opt.value}
                onChange={() => handleType(opt.value)}
                size="sm"
                label={opt.label}
              />
            ))}
          </div>

          {/* Edit mode */}
          <Toggle
            checked={editMode}
            onChange={v => { setEditMode(v); setOpen(true); setLastAction(null) }}
            size="sm"
            label="Edit mode (shows Delete)"
          />

          {/* Last action feedback */}
          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              paddingTop: 'var(--space-1)',
              borderTop: '1px solid var(--border)',
            }}>
              {lastAction}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function AnnotationEditorDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
