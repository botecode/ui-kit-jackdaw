// src/components/PianoRoll/PianoRoll.demo.tsx
import { useState, useCallback, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { ThemeProvider } from '../../theme/ThemeProvider'
import { PianoRoll } from './PianoRoll'
import type { PianoNote } from './PianoRoll'

export const meta: DemoMeta = {
  name:  'PianoRoll',
  group: 'Composites',
  route: '/piano-roll',
  order: 25,
}

// ─── Fixture notes ────────────────────────────────────────────────────────────

const FIXTURE_NOTES: PianoNote[] = [
  { id: 'n1', pitch: 60, start: 0,   length: 1,    velocity: 100 },
  { id: 'n2', pitch: 62, start: 1,   length: 0.5,  velocity: 80  },
  { id: 'n3', pitch: 64, start: 1.5, length: 0.5,  velocity: 60  },
  { id: 'n4', pitch: 60, start: 2,   length: 2,    velocity: 110 },
  { id: 'n5', pitch: 55, start: 4,   length: 1,    velocity: 90  },
  { id: 'n6', pitch: 57, start: 5,   length: 0.5,  velocity: 70  },
  { id: 'n7', pitch: 59, start: 5.5, length: 0.5,  velocity: 85  },
  { id: 'n8', pitch: 55, start: 6,   length: 2,    velocity: 100 },
]

const SMALL_RANGE: [number, number] = [48, 72]  // C3–C5

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function RollWrap({ height = 220, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div style={{
      width:        440,
      height,
      overflow:     'hidden',
      borderRadius: 'var(--radius)',
      border:       '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

// ─── Stateful sub-states ──────────────────────────────────────────────────────

function SelectedNoteState() {
  const [notes, setNotes] = useState<PianoNote[]>(FIXTURE_NOTES)
  return (
    <PianoRoll
      notes={notes}
      pxPerBeat={40}
      durationBeats={8}
      pitchRange={SMALL_RANGE}
      onDeleteNote={id  => setNotes(n => n.filter(x => x.id !== id))}
      onMoveNote={(id, pitch, start) => setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))}
      onResizeNote={(id, length)     => setNotes(n => n.map(x => x.id === id ? { ...x, length }       : x))}
    />
  )
}

function MultiSelectState() {
  const [notes, setNotes] = useState<PianoNote[]>(FIXTURE_NOTES)
  return (
    <PianoRoll
      notes={notes}
      pxPerBeat={40}
      durationBeats={8}
      pitchRange={SMALL_RANGE}
      onDeleteNote={id  => setNotes(n => n.filter(x => x.id !== id))}
      onMoveNote={(id, pitch, start) => setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))}
      onResizeNote={(id, length)     => setNotes(n => n.map(x => x.id === id ? { ...x, length }       : x))}
    />
  )
}

function InteractiveDraw() {
  const [notes, setNotes] = useState<PianoNote[]>([])
  const nextId = useRef(0)
  return (
    <PianoRoll
      notes={notes}
      pxPerBeat={40}
      durationBeats={8}
      pitchRange={SMALL_RANGE}
      snap
      division={0.5}
      onAddNote={(pitch, start) => {
        const id = `d${++nextId.current}`
        setNotes(n => [...n, { id, pitch, start, length: 0.5, velocity: 100 }])
      }}
      onDeleteNote={id => setNotes(n => n.filter(x => x.id !== id))}
      onMoveNote={(id, pitch, start) => setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))}
      onResizeNote={(id, length)     => setNotes(n => n.map(x => x.id === id ? { ...x, length }       : x))}
    />
  )
}

// ─── States grid ─────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Empty (grid + keyboard)">
        <RollWrap>
          <PianoRoll notes={[]} pxPerBeat={40} durationBeats={8} pitchRange={SMALL_RANGE} />
        </RollWrap>
      </State>

      <State label="With notes">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={40} durationBeats={8} pitchRange={SMALL_RANGE} />
        </RollWrap>
      </State>

      <State label="Note selected (click a note)">
        <RollWrap>
          <SelectedNoteState />
        </RollWrap>
      </State>

      <State label="Multi-select (Shift+click)">
        <RollWrap>
          <MultiSelectState />
        </RollWrap>
      </State>

      <State label="Draw mode (snap on, click to add)">
        <RollWrap>
          <InteractiveDraw />
        </RollWrap>
      </State>

      <State label="Small size (sm)">
        <RollWrap height={160}>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} size="sm" />
        </RollWrap>
      </State>

      <State label="Chroma vs Nocturne">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <ThemeProvider theme="chroma">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>chroma</div>
            <RollWrap height={160}>
              <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} />
            </RollWrap>
          </ThemeProvider>
          <ThemeProvider theme="nocturne">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>nocturne</div>
            <RollWrap height={160}>
              <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={32} durationBeats={8} pitchRange={SMALL_RANGE} />
            </RollWrap>
          </ThemeProvider>
        </div>
      </State>

      <State label="Scrolled (full C1–C7 range)">
        <RollWrap>
          <PianoRoll notes={FIXTURE_NOTES} pxPerBeat={40} durationBeats={8} pitchRange={[24, 96]} />
        </RollWrap>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [notes,      setNotes]      = useState<PianoNote[]>(FIXTURE_NOTES)
  const [pxPerBeat,  setPxPerBeat]  = useState(48)
  const [snap,       setSnap]       = useState(false)
  const [division,   setDivision]   = useState(0.25)
  const [lastAction, setLastAction] = useState('—')

  const idCounter = useRef(100)

  const handleAdd = useCallback((pitch: number, start: number) => {
    const id = `u${idCounter.current++}`
    setNotes(n => [...n, { id, pitch, start, length: division, velocity: 100 }])
    setLastAction(`add pitch=${pitch} start=${start.toFixed(2)}`)
  }, [division]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMove = useCallback((id: string, pitch: number, start: number) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, pitch, start } : x))
    setLastAction(`move ${id} → pitch=${pitch} start=${start.toFixed(2)}`)
  }, [])

  const handleResize = useCallback((id: string, length: number) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, length } : x))
    setLastAction(`resize ${id} → ${length.toFixed(2)} beats`)
  }, [])

  const handleDelete = useCallback((id: string) => {
    setNotes(n => n.filter(x => x.id !== id))
    setLastAction(`delete ${id}`)
  }, [])

  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
    fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Piano roll */}
        <div style={{
          flex:         '1 1 400px',
          height:       320,
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow:     'hidden',
        }}>
          <PianoRoll
            notes={notes}
            pxPerBeat={pxPerBeat}
            durationBeats={16}
            pitchRange={[36, 84]}
            division={division}
            snap={snap}
            onAddNote={handleAdd}
            onMoveNote={handleMove}
            onResizeNote={handleResize}
            onDeleteNote={handleDelete}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 180 }}>
          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader
              value={pxPerBeat}
              onChange={v => setPxPerBeat(Math.max(16, Math.round(v)))}
              min={16} max={120}
              orientation="horizontal"
              size="sm"
              aria-label="Pixels per beat"
            />
          </label>

          <Toggle checked={snap} onChange={setSnap} label="snap" size="sm" />

          <label style={labelStyle}>
            division
            <select
              value={division}
              onChange={e => setDivision(Number(e.target.value))}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value={0.25}>1/16</option>
              <option value={0.5}>1/8</option>
              <option value={1}>1/4</option>
              <option value={2}>1/2</option>
            </select>
          </label>

          <div style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     'var(--text-xs)',
            color:        'var(--text-dim)',
            marginTop:    'var(--space-2)',
            padding:      'var(--space-2)',
            background:   'var(--stage)',
            borderRadius: 'var(--radius)',
            lineHeight:   1.6,
          }}>
            last: {lastAction}<br />
            notes: {notes.length}
          </div>

          <button
            onClick={() => { setNotes([]); setLastAction('clear all') }}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     'var(--text-sm)',
              padding:      '4px 12px',
              background:   'var(--stage)',
              color:        'var(--text-muted)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor:       'pointer',
            }}
          >
            clear
          </button>
        </div>
      </div>

      {/* Usage notes */}
      <div style={{
        marginTop:  'var(--space-4)',
        fontFamily: 'var(--font-mono)',
        fontSize:   'var(--text-xs)',
        color:      'var(--text-dim)',
        lineHeight: 1.8,
      }}>
        click empty lane = add note · drag body = move · drag right edge = resize · right-click = delete<br />
        ↑/↓ = ±semitone · Shift+↑/↓ = ±octave · ←/→ = move by division · Del/Backspace = remove
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────

export default function PianoRollDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
