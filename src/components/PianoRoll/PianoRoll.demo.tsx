// src/components/PianoRoll/PianoRoll.demo.tsx
import { useState, useCallback } from 'react'
import type { DemoMeta }  from '../../gallery/registry'
import { ThemeProvider }  from '../../theme/ThemeProvider'
import { DemoShell }      from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground }     from '../../gallery/ui/Playground'
import { Fader }          from '../Fader'
import { Toggle }         from '../Toggle'
import { PianoRoll }      from './PianoRoll'
import type { PianoNote } from './PianoRoll'

export const meta: DemoMeta = {
  name:  'PianoRoll',
  group: 'Composites',
  route: '/piano-roll',
  order: 7,
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// A simple C-major scale phrase (all in beats, 4/4 at quarter-note division=1)
const MELODY: PianoNote[] = [
  { id: 'm1', pitch: 60, start: 0,    length: 1,   velocity: 100 }, // C4
  { id: 'm2', pitch: 62, start: 1,    length: 0.5, velocity: 90  }, // D4
  { id: 'm3', pitch: 64, start: 1.5,  length: 0.5, velocity: 95  }, // E4
  { id: 'm4', pitch: 65, start: 2,    length: 1,   velocity: 85  }, // F4
  { id: 'm5', pitch: 67, start: 3,    length: 1,   velocity: 80  }, // G4
  { id: 'm6', pitch: 65, start: 4,    length: 0.5, velocity: 75  }, // F4
  { id: 'm7', pitch: 64, start: 4.5,  length: 0.5, velocity: 88  }, // E4
  { id: 'm8', pitch: 62, start: 5,    length: 2,   velocity: 100 }, // D4 — held
  { id: 'm9', pitch: 60, start: 7,    length: 1,   velocity: 110 }, // C4
  // Bar 3 chord
  { id: 'c1', pitch: 60, start: 8,    length: 4,   velocity: 90  }, // C4
  { id: 'c2', pitch: 64, start: 8,    length: 4,   velocity: 85  }, // E4
  { id: 'c3', pitch: 67, start: 8,    length: 4,   velocity: 80  }, // G4
]

// Velocity gradient — shows how velocity affects opacity/brightness
const VEL_NOTES: PianoNote[] = [
  { id: 'v1', pitch: 67, start: 0, length: 1, velocity: 127 }, // ff — G4
  { id: 'v2', pitch: 65, start: 1, length: 1, velocity: 100 }, // mf — F4
  { id: 'v3', pitch: 64, start: 2, length: 1, velocity: 75  }, // mp — E4
  { id: 'v4', pitch: 62, start: 3, length: 1, velocity: 50  }, // p  — D4
  { id: 'v5', pitch: 60, start: 4, length: 1, velocity: 25  }, // pp — C4
  { id: 'v6', pitch: 59, start: 5, length: 1, velocity: 10  }, // ppp— B3
]

// ─── Shared wrapper ────────────────────────────────────────────────────────────

function RollWrap({
  children,
  height = 220,
}: { children: React.ReactNode; height?: number }) {
  return (
    <div style={{
      height,
      overflow: 'auto',
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
    }}>
      {children}
    </div>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="empty — grid + keyboard, no notes">
        <RollWrap height={200}>
          <PianoRoll
            notes={[]}
            pxPerBeat={48}
            pitchRange={[48, 72]}
            durationBeats={16}
          />
        </RollWrap>
      </State>

      <State label="with notes — melody + chord">
        <RollWrap height={220}>
          <PianoRoll
            notes={MELODY}
            pxPerBeat={48}
            pitchRange={[48, 72]}
            durationBeats={16}
          />
        </RollWrap>
      </State>

      <State label="velocity gradient — louder = more opaque">
        <RollWrap height={200}>
          <PianoRoll
            notes={VEL_NOTES}
            pxPerBeat={64}
            pitchRange={[57, 69]}
            durationBeats={8}
          />
        </RollWrap>
      </State>

      <State label="1/8 division snap grid visible">
        <RollWrap height={200}>
          <PianoRoll
            notes={MELODY.slice(0, 5)}
            pxPerBeat={64}
            pitchRange={[57, 72]}
            durationBeats={8}
            division={0.5}
            snap
          />
        </RollWrap>
      </State>

      <State label="wide pitch range — C2 to C7 (scrollable, zoom with ⌘+scroll)">
        <RollWrap height={220}>
          <PianoRoll
            notes={MELODY}
            pxPerBeat={48}
            pitchRange={[24, 96]}
            durationBeats={16}
          />
        </RollWrap>
      </State>

      <State label="sm size — compact key strip + tight rows">
        <RollWrap height={160}>
          <PianoRoll
            notes={MELODY.slice(0, 5)}
            pxPerBeat={48}
            pitchRange={[55, 72]}
            durationBeats={8}
            size="sm"
          />
        </RollWrap>
      </State>

      <State label="theme compare — chroma (light) vs nocturne (dark)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <ThemeProvider theme="chroma">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>chroma</div>
            <RollWrap height={130}>
              <PianoRoll notes={MELODY.slice(0, 5)} pxPerBeat={40} pitchRange={[57, 72]} durationBeats={8} />
            </RollWrap>
          </ThemeProvider>
          <ThemeProvider theme="nocturne">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>nocturne</div>
            <RollWrap height={130}>
              <PianoRoll notes={MELODY.slice(0, 5)} pxPerBeat={40} pitchRange={[57, 72]} durationBeats={8} />
            </RollWrap>
          </ThemeProvider>
        </div>
      </State>

      <State label="disabled — no interactions">
        <RollWrap height={200}>
          <PianoRoll
            notes={MELODY.slice(0, 5)}
            pxPerBeat={48}
            pitchRange={[55, 72]}
            durationBeats={8}
            disabled
          />
        </RollWrap>
      </State>
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [notes,         setNotes]         = useState<PianoNote[]>(MELODY)
  const [pxPerBeat,     setPxPerBeat]     = useState(48)
  const [division,      setDivision]      = useState(0.25)
  const [snap,          setSnap]          = useState(false)
  const [durationBeats, setDurationBeats] = useState(16)
  const [log,           setLog]           = useState('—')

  const DIVISIONS = [
    { label: '1/4',  value: 1    },
    { label: '1/8',  value: 0.5  },
    { label: '1/16', value: 0.25 },
  ]

  const handleAddNote = useCallback((pitch: number, start: number) => {
    const id = `u${Date.now()}`
    setNotes(prev => [...prev, { id, pitch, start, length: division, velocity: 100 }])
    setLog(`add → pitch ${pitch}  start ${start.toFixed(2)}`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [division])

  const handleMoveNote = useCallback((id: string, pitch: number, start: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pitch, start } : n))
    setLog(`move → ${id}  pitch ${pitch}  start ${start.toFixed(2)}`)
  }, [])

  const handleResizeNote = useCallback((id: string, length: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, length } : n))
    setLog(`resize → ${id}  length ${length.toFixed(2)}`)
  }, [])

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setLog(`delete → ${id}`)
  }, [])

  const handleSelectNote = useCallback((ids: string[]) => {
    if (ids.length > 0) setLog(`select → [${ids.join(', ')}]`)
  }, [])

  const handleTimeZoom = useCallback((newPxPerBeat: number) => {
    setPxPerBeat(newPxPerBeat)
    setLog(`time zoom → ${newPxPerBeat}px/beat`)
  }, [])

  const labelStyle: React.CSSProperties = {
    display:    'flex',
    alignItems: 'center',
    gap:        'var(--space-2)',
    fontFamily: 'var(--font-ui)',
    fontSize:   'var(--text-sm)',
    color:      'var(--text-muted)',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Piano roll */}
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          <div style={{ height: 300, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <PianoRoll
              notes={notes}
              pxPerBeat={pxPerBeat}
              pitchRange={[48, 84]}
              durationBeats={durationBeats}
              division={division}
              snap={snap}
              onAddNote={handleAddNote}
              onMoveNote={handleMoveNote}
              onResizeNote={handleResizeNote}
              onDeleteNote={handleDeleteNote}
              onSelectNote={handleSelectNote}
              onTimeZoom={handleTimeZoom}
            />
          </div>
          {/* Intent log */}
          <div style={{
            marginTop:  'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
          }}>
            {log}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>

          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            division
          </div>
          <div role="radiogroup" aria-label="Division" style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {DIVISIONS.map(d => (
              <Toggle
                key={d.label}
                checked={division === d.value}
                onChange={on => { if (on) setDivision(d.value) }}
                label={d.label}
                size="sm"
                aria-label={`Division ${d.label}`}
              />
            ))}
          </div>

          <label style={labelStyle}>
            px/beat ({pxPerBeat})
            <Fader
              value={pxPerBeat}
              onChange={v => setPxPerBeat(Math.max(16, Math.round(v)))}
              min={16}
              max={128}
              orientation="horizontal"
              size="sm"
              aria-label="Pixels per beat"
            />
          </label>

          <label style={labelStyle}>
            beats ({durationBeats})
            <Fader
              value={durationBeats}
              onChange={v => setDurationBeats(Math.max(4, Math.round(v)))}
              min={4}
              max={32}
              orientation="horizontal"
              size="sm"
              aria-label="Duration beats"
            />
          </label>

          <Toggle
            checked={snap}
            onChange={setSnap}
            label="snap to grid"
            size="sm"
          />

          <button
            type="button"
            onClick={() => setNotes(MELODY)}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     'var(--text-sm)',
              color:        'var(--text-muted)',
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding:      '4px 8px',
              cursor:       'pointer',
            }}
          >
            Reset notes
          </button>

          <button
            type="button"
            onClick={() => setNotes([])}
            style={{
              fontFamily:   'var(--font-ui)',
              fontSize:     'var(--text-sm)',
              color:        'var(--text-dim)',
              background:   'transparent',
              border:       '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding:      '4px 8px',
              cursor:       'pointer',
            }}
          >
            Clear notes
          </button>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
            lineHeight: 1.6,
            whiteSpace: 'pre',
          }}>
            {'click grid → add note\nclick-drag → draw longer\ndrag body → move note\ndrag right edge → resize\nright-click note → delete\n↑/↓ = ±1 semitone\n⌘↑/↓ = ±1 octave\n←/→ = move by division\nDelete = remove selected\n⌘+scroll = time zoom\npinch / ctrl+scroll = octave zoom'}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function PianoRollDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
