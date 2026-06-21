# AnnotationEditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a type-aware annotation editor popover (lyrics/chords/tabs/comment) that anchors at a clicked time position in the timeline, covering create/edit/delete flows and comment-specific audio recording.

**Architecture:** A self-contained component that composes the existing `Popover` shell (point-anchor mode) with an internal textarea/input field. The parent renders `<AnnotationEditor>` when open and unmounts on save/cancel — no internal open/closed state. For comment type, an audio section with a stub record button and play chip renders alongside the text field.

**Tech Stack:** React 18 + TypeScript, CSS Modules, `@phosphor-icons/react`, existing `Popover` + `TextField` kit primitives, `fireEvent`-based Vitest tests.

## Global Constraints

- CSS tokens only — no hardcoded colors
- `data-*` attributes for state, CSS targets them
- `fireEvent` in tests, not `userEvent`
- `sm` / `md` sizes, default `md`
- `:focus-visible` only, never `:focus`
- Portal via `usePortalTarget()` (handled by Popover)
- `tsc --noEmit` + `vitest run` + lint must be green
- Font: `--font-ui` for UI text, `--font-mono` for tabs field
- Icons: `@phosphor-icons/react` (existing weight via IconContext)
- No hardcoded strings — all label text via props or type mapping

---

### Task 1: Component scaffold + types

**Files:**
- Create: `src/components/AnnotationEditor/AnnotationEditor.tsx`
- Create: `src/components/AnnotationEditor/AnnotationEditor.module.css`
- Create: `src/components/AnnotationEditor/index.ts`

**Interfaces:**
- Produces:
  ```ts
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
    onRecord?: () => Promise<AudioRef>        // stubbed in gallery
  }
  ```

- [ ] **Step 1: Write AnnotationEditor.tsx with skeleton**

```tsx
// src/components/AnnotationEditor/AnnotationEditor.tsx
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
  time: number
  containerRef: React.RefObject<HTMLElement | null>
  onSave: (content: string | AudioRef) => void
  onDelete?: () => void
  onCancel: () => void
  onRecord?: () => Promise<AudioRef>
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
  const rem = Math.floor((ms % 1000) / 100)
  return `${s}.${rem}s`
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
  const initialText = isAudioRef(value) ? '' : (value ?? '')
  const initialAudio = isAudioRef(value) ? value : null

  const [draft, setDraft]         = useState(initialText)
  const [audioRef, setAudioRef]   = useState<AudioRef | null>(initialAudio)
  const [recording, setRecording] = useState(false)

  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)

  // Focus into the field on open — explicit ref.focus() handles WKWebView
  // where clicking a button doesn't automatically focus it.
  useLayoutEffect(() => {
    fieldRef.current?.focus()
  }, [])

  function handleSave() {
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

  const isEdit = onDelete !== undefined
  const isMultiLine = type === 'lyrics' || type === 'tabs'
  const isMono = type === 'tabs'

  return (
    <Popover
      anchor={anchor}
      containerRef={containerRef}
      onClose={onCancel}
    >
      <div className={styles.shell} data-type={type}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.typeLabel}>{TYPE_LABEL[type]}</span>
          <span className={styles.timeLabel}>{formatTime(time)}</span>
        </div>

        {/* Text field */}
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

          {/* Audio section — comment only */}
          {type === 'comment' && (
            <div className={styles.audioSection}>
              {audioRef ? (
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
                <button
                  className={styles.recordBtn}
                  onClick={handleRecord}
                  disabled={!onRecord || recording}
                  data-recording={recording || undefined}
                  aria-label={recording ? 'Recording…' : 'Record audio comment'}
                  aria-pressed={recording}
                  type="button"
                >
                  <span className={styles.recordDot} aria-hidden="true" />
                  {recording ? 'Recording…' : 'Record'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
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
```

- [ ] **Step 2: Write AnnotationEditor.module.css**

```css
/* src/components/AnnotationEditor/AnnotationEditor.module.css */

/* ─── Shell (the warm writing-surface card) ──────────────────────────────── */

.shell {
  width: 280px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  background-image: var(--texture-paper);
  background-blend-mode: multiply;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  overflow: hidden;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 80%, var(--stage) 20%);
}

.typeLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.timeLabel {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-dim);
  letter-spacing: 0.04em;
}

/* ─── Body ───────────────────────────────────────────────────────────────── */

.body {
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* ─── Recessed text well — shared by textarea + input ───────────────────── */

/*
  Same well recipe as TextField / Checkbox / Toggle:
  dark inset shadow gives the recessed feel.
*/

.textarea,
.input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: var(--stage);
  border: none;
  outline: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 1px var(--border);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text);
  caret-color: var(--accent);
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.textarea {
  padding: var(--space-2);
  resize: none;
  line-height: var(--leading-base);
  min-height: 80px;
}

.textarea[data-mono] {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}

.input {
  padding: 0 var(--space-2);
  height: 32px;
  line-height: 1;
}

/* ─── Focus ring — keyboard only ────────────────────────────────────────── */

.textarea:focus-visible,
.input:focus-visible {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(0, 0, 0, 0.25),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

/* ─── Placeholder ────────────────────────────────────────────────────────── */

.textarea::placeholder,
.input::placeholder {
  color: var(--text-dim);
  opacity: 1;
}

/* ─── Audio section ──────────────────────────────────────────────────────── */

.audioSection {
  display: flex;
  align-items: center;
}

/* Record button — recessed off / LED-lit red when recording */

.recordBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--stage);
  border: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--border);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    box-shadow var(--dur-led-off) var(--ease-out),
    color var(--dur-led-off) var(--ease-out);
}

.recordBtn:focus-visible {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 2px var(--accent);
}

.recordBtn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Recording active: red LED bloom */
.recordBtn[data-recording] {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--border),
    0 0 8px 2px var(--led-red-glow, color-mix(in srgb, var(--led-red) 40%, transparent));
  color: var(--led-red);
  transition:
    box-shadow var(--dur-led-on) var(--ease-out),
    color var(--dur-led-on) var(--ease-out);
}

.recordDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
  transition:
    background var(--dur-led-off) var(--ease-out),
    box-shadow var(--dur-led-off) var(--ease-out);
  flex-shrink: 0;
}

.recordBtn[data-recording] .recordDot {
  background: var(--led-red);
  box-shadow: 0 0 4px 1px color-mix(in srgb, var(--led-red) 60%, transparent);
  transition:
    background var(--dur-led-on) var(--ease-out),
    box-shadow var(--dur-led-on) var(--ease-out);
}

/* Play chip — shows when audio is recorded */

.playChip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: color-mix(in srgb, var(--accent) 12%, var(--stage));
  border-radius: calc(var(--radius) * 2);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.playChipIcon {
  font-size: 10px;
  color: var(--accent);
  flex-shrink: 0;
}

.playChipLabel {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text);
}

.clearAudioBtn {
  background: none;
  border: none;
  padding: 0 2px;
  cursor: pointer;
  color: var(--text-dim);
  font-size: var(--text-sm);
  line-height: 1;
  border-radius: 2px;
}

.clearAudioBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.clearAudioBtn:hover {
  color: var(--text-muted);
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 80%, var(--stage) 20%);
  gap: var(--space-2);
}

.footerActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/* Shared button base */

.cancelBtn,
.saveBtn,
.deleteBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  border: none;
  line-height: 1;
  min-height: 28px;
  transition: box-shadow var(--dur-base) var(--ease-out);
}

/* Cancel — ghost style */

.cancelBtn {
  background: transparent;
  color: var(--text-muted);
  box-shadow: 0 0 0 1px var(--border);
}

.cancelBtn:hover {
  color: var(--text);
  box-shadow: 0 0 0 1px var(--border-strong, var(--border));
}

.cancelBtn:focus-visible {
  box-shadow: 0 0 0 2px var(--accent);
  outline: none;
}

/* Save — accent filled */

.saveBtn {
  background: var(--accent);
  color: var(--accent-text, #fff);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.25);
}

.saveBtn:hover {
  filter: brightness(1.08);
}

.saveBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.saveBtn:active {
  filter: brightness(0.95);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Delete — red LED danger */

.deleteBtn {
  background: transparent;
  color: var(--led-red);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--led-red) 40%, transparent);
}

.deleteBtn:hover {
  background: color-mix(in srgb, var(--led-red) 10%, transparent);
}

.deleteBtn:focus-visible {
  outline: 2px solid var(--led-red);
  outline-offset: 2px;
}

/* ─── Reduced-motion: snap state transitions ─────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .textarea,
  .input,
  .recordBtn,
  .recordDot,
  .cancelBtn,
  .saveBtn,
  .deleteBtn {
    transition: none;
  }
}
```

- [ ] **Step 3: Write index.ts**

```ts
// src/components/AnnotationEditor/index.ts
export { AnnotationEditor } from './AnnotationEditor'
export type { AnnotationEditorProps, AnnotationType, AudioRef } from './AnnotationEditor'
```

- [ ] **Step 4: Run tsc to verify no type errors**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && npx tsc --noEmit 2>&1
```

Expected: No errors output.

- [ ] **Step 5: Commit scaffold**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && git add src/components/AnnotationEditor/ && git commit -m "feat(AnnotationEditor): scaffold component + CSS shell"
```

---

### Task 2: Tests

**Files:**
- Create: `src/components/AnnotationEditor/AnnotationEditor.test.tsx`

**Interfaces:**
- Consumes: `AnnotationEditor`, `AnnotationEditorProps`, `AnnotationType`, `AudioRef` from Task 1

- [ ] **Step 1: Write AnnotationEditor.test.tsx**

```tsx
// src/components/AnnotationEditor/AnnotationEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnnotationEditor } from './AnnotationEditor'
import type { AnnotationEditorProps } from './AnnotationEditor'
import { createRef } from 'react'

const containerRef = createRef<HTMLElement>()

function makeProps(overrides?: Partial<AnnotationEditorProps>): AnnotationEditorProps {
  return {
    type: 'lyrics',
    anchor: { x: 100, y: 200 },
    time: 62,
    containerRef,
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

describe('AnnotationEditor — rendering', () => {
  it('shows the type label and formatted time', () => {
    render(<AnnotationEditor {...makeProps({ time: 62 })} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    expect(screen.getByText('1:02')).toBeInTheDocument()
  })

  it('renders "Tab" label for tabs type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByText('Tab')).toBeInTheDocument()
  })

  it('renders "Chords" label for chords type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'chords' })} />)
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('renders "Comment" label for comment type', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment' })} />)
    expect(screen.getByText('Comment')).toBeInTheDocument()
  })

  it('shows Save and Cancel buttons', () => {
    render(<AnnotationEditor {...makeProps()} />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows Delete button when onDelete is provided', () => {
    render(<AnnotationEditor {...makeProps({ onDelete: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Delete annotation' })).toBeInTheDocument()
  })

  it('does NOT show Delete button in create mode (no onDelete)', () => {
    render(<AnnotationEditor {...makeProps()} />)
    expect(screen.queryByRole('button', { name: 'Delete annotation' })).not.toBeInTheDocument()
  })
})

describe('AnnotationEditor — lyrics (multi-line)', () => {
  it('renders a textarea for lyrics', () => {
    render(<AnnotationEditor {...makeProps({ type: 'lyrics' })} />)
    expect(screen.getByRole('textbox', { name: 'Lyrics' })).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('pre-fills with string value', () => {
    render(<AnnotationEditor {...makeProps({ value: 'Amazing Grace' })} />)
    const field = screen.getByRole('textbox', { name: 'Lyrics' }) as HTMLTextAreaElement
    expect(field.value).toBe('Amazing Grace')
  })

  it('calls onSave with updated text on Save click', () => {
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ onSave })} />)
    const field = screen.getByRole('textbox', { name: 'Lyrics' })
    fireEvent.change(field, { target: { value: 'New lyric' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('New lyric')
  })
})

describe('AnnotationEditor — tabs (monospace)', () => {
  it('renders a textarea for tabs', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByRole('textbox', { name: 'Tab' })).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('textarea has data-mono attribute', () => {
    render(<AnnotationEditor {...makeProps({ type: 'tabs' })} />)
    expect(screen.getByRole('textbox', { name: 'Tab' })).toHaveAttribute('data-mono')
  })
})

describe('AnnotationEditor — chords (single-line)', () => {
  it('renders an input for chords', () => {
    render(<AnnotationEditor {...makeProps({ type: 'chords' })} />)
    expect(screen.getByRole('textbox', { name: 'Chords' })).toBeInstanceOf(HTMLInputElement)
  })

  it('calls onSave with chord text', () => {
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'chords', onSave })} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Chords' }), { target: { value: 'Am G C F' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('Am G C F')
  })
})

describe('AnnotationEditor — comment type', () => {
  it('renders an input for comment text', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment' })} />)
    expect(screen.getByRole('textbox', { name: 'Comment' })).toBeInstanceOf(HTMLInputElement)
  })

  it('shows Record button when no audio and onRecord provided', () => {
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Record audio comment' })).toBeInTheDocument()
  })

  it('shows play chip when value is an AudioRef', () => {
    const audioRef = { url: 'blob:test', durationMs: 3400 }
    render(<AnnotationEditor {...makeProps({ type: 'comment', value: audioRef })} />)
    expect(screen.getByLabelText('Recorded audio')).toBeInTheDocument()
    expect(screen.getByText('3.4s')).toBeInTheDocument()
  })

  it('calls onSave with AudioRef when audio recorded and no text', async () => {
    const audioRef = { url: 'blob:test', durationMs: 2000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord, onSave })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    // Wait for async onRecord to resolve
    await vi.waitFor(() => {
      expect(screen.getByLabelText('Recorded audio')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(audioRef)
  })

  it('calls onSave with text even when audio recorded (text takes priority)', async () => {
    const audioRef = { url: 'blob:test', durationMs: 2000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onSave = vi.fn()
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord, onSave })} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Comment' }), { target: { value: 'great take' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    await vi.waitFor(() => {
      expect(screen.getByLabelText('Recorded audio')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('great take')
  })

  it('can clear audio with the × button', async () => {
    const audioRef = { url: 'blob:test', durationMs: 1000 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    render(<AnnotationEditor {...makeProps({ type: 'comment', onRecord })} />)

    fireEvent.click(screen.getByRole('button', { name: 'Record audio comment' }))
    await vi.waitFor(() => {
      expect(screen.getByLabelText('Recorded audio')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove recording' }))
    expect(screen.queryByLabelText('Recorded audio')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Record audio comment' })).toBeInTheDocument()
  })
})

describe('AnnotationEditor — actions', () => {
  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<AnnotationEditor {...makeProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onDelete when Delete is clicked', () => {
    const onDelete = vi.fn()
    render(<AnnotationEditor {...makeProps({ onDelete })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete annotation' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

describe('AnnotationEditor — time formatting', () => {
  it('formats 0 as 0:00', () => {
    render(<AnnotationEditor {...makeProps({ time: 0 })} />)
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('formats 90 as 1:30', () => {
    render(<AnnotationEditor {...makeProps({ time: 90 })} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('formats 3661 as 61:01', () => {
    render(<AnnotationEditor {...makeProps({ time: 3661 })} />)
    expect(screen.getByText('61:01')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && npx vitest run src/components/AnnotationEditor/ 2>&1
```

Expected: All tests pass.

- [ ] **Step 3: Commit tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && git add src/components/AnnotationEditor/AnnotationEditor.test.tsx && git commit -m "test(AnnotationEditor): full test coverage — types, states, audio flow"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/AnnotationEditor/AnnotationEditor.demo.tsx`

**Interfaces:**
- Consumes: `AnnotationEditor`, `AnnotationEditorProps`, `AnnotationType`, `AudioRef` from Task 1
- No manual registry edits needed — auto-discovered via `import.meta.glob`

- [ ] **Step 1: Write AnnotationEditor.demo.tsx**

```tsx
// src/components/AnnotationEditor/AnnotationEditor.demo.tsx
import { useRef, useState } from 'react'
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

// Simulates a 1.5-second recording delay in the gallery
function stubRecord(): Promise<AudioRef> {
  return new Promise(resolve => setTimeout(() => resolve(STUB_AUDIO), 1500))
}

// ── State card: always-visible editor (no anchor/portal for States grid) ─────

interface EditorCardProps {
  label: string
  type: AnnotationType
  value?: string | AudioRef
  editMode?: boolean
}

function EditorCard({ label, type, value, editMode }: EditorCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [saved, setSaved] = useState<string | null>(null)

  return (
    <State label={label}>
      <div ref={containerRef} style={{ position: 'relative', minHeight: 200 }}>
        {saved ? (
          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            padding: 'var(--space-2)',
          }}>
            Saved: <strong style={{ color: 'var(--text)' }}>{String(saved)}</strong>
            <br />
            <button
              onClick={() => setSaved(null)}
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
        ) : (
          <AnnotationEditor
            type={type}
            anchor={{ x: 20, y: 20 }}
            value={value}
            time={type === 'lyrics' ? 12 : type === 'chords' ? 45 : type === 'tabs' ? 90 : 33}
            containerRef={containerRef}
            onSave={content => setSaved(String(content === null || typeof content === 'object' ? '[audio]' : content))}
            onDelete={editMode ? () => setSaved('[deleted]') : undefined}
            onCancel={() => setSaved('[cancelled]')}
            onRecord={type === 'comment' ? stubRecord : undefined}
          />
        )}
      </div>
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <EditorCard label="Create — lyrics (empty)"          type="lyrics"  />
      <EditorCard label="Edit — lyrics (with value)"       type="lyrics"  value="Amazing Grace, how sweet the sound" editMode />
      <EditorCard label="Create — chords"                  type="chords"  />
      <EditorCard label="Edit — chords (with value)"       type="chords"  value="Am  G  C  F" editMode />
      <EditorCard label="Tabs (monospace field)"           type="tabs"    value={"e|--0--2--3--|\nB|--1--3--5--|"} editMode />
      <EditorCard label="Comment — text"                   type="comment" value="check the reverb tail" editMode />
      <EditorCard label="Comment — with audio play-chip"  type="comment" value={STUB_AUDIO} editMode />
      <EditorCard label="Comment — create (record stub)"  type="comment" />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [type, setType]       = useState<AnnotationType>('lyrics')
  const [editMode, setEditMode] = useState(false)
  const [open, setOpen]       = useState(true)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const typeOptions: AnnotationType[] = ['lyrics', 'chords', 'tabs', 'comment']

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Click surface */}
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: 360,
            minHeight: 260,
            background: 'var(--stage)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            cursor: 'pointer',
          }}
          onClick={(e) => {
            if (!open) setOpen(true)
          }}
          role="region"
          aria-label="Annotation lane (click to open editor)"
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
              color: 'var(--text-dim)',
              userSelect: 'none',
            }}>
              Click to open editor
            </span>
          )}
          {open && (
            <AnnotationEditor
              type={type}
              anchor={{ x: 16, y: 16 }}
              value={editMode ? (type === 'comment' ? 'nice take' : 'Some existing text') : undefined}
              time={42}
              containerRef={containerRef}
              onSave={content => { setLastAction(`Saved: ${String(typeof content === 'object' ? '[audio]' : content)}`); setOpen(false) }}
              onDelete={editMode ? () => { setLastAction('Deleted'); setOpen(false) } : undefined}
              onCancel={() => { setLastAction('Cancelled'); setOpen(false) }}
              onRecord={type === 'comment' ? stubRecord : undefined}
            />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {typeOptions.map(t => (
                <Toggle
                  key={t}
                  checked={type === t}
                  onChange={() => { setType(t); setOpen(true) }}
                  size="sm"
                  label={t.charAt(0).toUpperCase() + t.slice(1)}
                />
              ))}
            </div>
          </div>
          <Toggle
            checked={editMode}
            onChange={v => { setEditMode(v); setOpen(true) }}
            size="sm"
            label="Edit mode (shows Delete)"
          />
          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-1)',
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
```

- [ ] **Step 2: Run tsc to verify no type errors**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && npx tsc --noEmit 2>&1
```

Expected: No errors output.

- [ ] **Step 3: Run all tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && npx vitest run 2>&1 | tail -20
```

Expected: All tests pass (exit 0).

- [ ] **Step 4: Commit gallery demo**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/annotation-editor && git add src/components/AnnotationEditor/AnnotationEditor.demo.tsx && git commit -m "feat(AnnotationEditor): gallery demo — all types + states"
```

---

### Task 4: Final verification

- [ ] Run `npx tsc --noEmit`
- [ ] Run `npx vitest run`
- [ ] Run `npx eslint src/components/AnnotationEditor/ --max-warnings=0`
- [ ] Verify the component appears in the gallery sidebar under "Composites"
