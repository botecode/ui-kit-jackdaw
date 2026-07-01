// src/components/Keyboard/Keyboard.demo.tsx
import { useCallback, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Fader } from '../Fader'
import { Keyboard } from './Keyboard'
import type { MidiNote } from './Keyboard'
import { midiNoteToName } from './keyboardMath'

export const meta: DemoMeta = {
  name:  'Keyboard',
  group: 'Composites',
  route: '/keyboard',
  order: 8,
}

// A C-major triad (C4 E4 G4) — the canonical "held chord" for the lit demo.
const C_MAJOR: MidiNote[] = [60, 64, 67]
// A wider voicing to show lit black keys.
const JAZZY: MidiNote[] = [58, 62, 65, 69] // Bb3 D4 F4 A4

// ─── States grid ────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — 2 octaves, C3–C5">
        <Keyboard startNote={48} endNote={72} />
      </State>

      <State label="selected — host-lit chord (C major, accent bloom)">
        <Keyboard startNote={48} endNote={72} activeNotes={C_MAJOR} />
      </State>

      <State label="active — lit black keys (jazzy voicing)">
        <Keyboard startNote={48} endNote={72} activeNotes={JAZZY} />
      </State>

      <State label="focus — Tab to a key, ←/→ to rove, Enter/Space to play">
        <Keyboard startNote={48} endNote={72} />
      </State>

      <State label="hover — cursor over a key warms toward accent">
        <Keyboard startNote={48} endNote={72} />
      </State>

      <State label="disabled — dimmed, non-interactive">
        <Keyboard startNote={48} endNote={72} disabled activeNotes={C_MAJOR} />
      </State>

      <State label="empty — no host notes, nothing lit">
        <Keyboard startNote={48} endNote={72} activeNotes={[]} />
      </State>

      <State label="sm — compact for tight plugin panels">
        <Keyboard startNote={48} endNote={72} size="sm" activeNotes={C_MAJOR} />
      </State>

      <State label="scroll — full 88 keys (A0–C8) in a narrow panel">
        <div style={{ maxWidth: 360 }}>
          <Keyboard startNote={21} endNote={108} size="sm" />
        </div>
      </State>

      <State label="loading — awaiting instrument (dimmed, empty range)">
        <Keyboard startNote={48} endNote={72} disabled />
      </State>

      <State label="error — out-of-range guard (single octave, C4–C5)">
        <Keyboard startNote={60} endNote={72} />
      </State>
    </StatesGrid>
  )
}

// ─── Playground ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display:     'flex',
  alignItems:  'center',
  gap:         'var(--space-2)',
  fontFamily:  'var(--font-ui)',
  fontSize:    'var(--text-sm)',
  color:       'var(--text-muted)',
}

function PlaygroundDemo() {
  const [octaves, setOctaves]   = useState(2)
  const [sm, setSm]             = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [typing, setTyping]     = useState(true)
  const [held, setHeld]         = useState<Set<MidiNote>>(() => new Set())
  const [log, setLog]           = useState('play a key — mouse, touch, or your QWERTY keyboard')

  const startNote = 48
  const endNote   = startNote + octaves * 12

  const handleNoteOn = useCallback((note: MidiNote, velocity: number) => {
    setHeld(prev => { const n = new Set(prev); n.add(note); return n })
    setLog(`noteOn  → ${midiNoteToName(note)}  (${note})  vel ${velocity}`)
  }, [])

  const handleNoteOff = useCallback((note: MidiNote) => {
    setHeld(prev => { const n = new Set(prev); n.delete(note); return n })
    setLog(`noteOff → ${midiNoteToName(note)}  (${note})`)
  }, [])

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        <div style={{ flex: '1 1 460px', minWidth: 0 }}>
          <Keyboard
            startNote={startNote}
            endNote={endNote}
            size={sm ? 'sm' : 'md'}
            disabled={disabled}
            computerKeyboard={typing}
            activeNotes={held}
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
          <div style={{
            marginTop:  'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
          }}>
            {log}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 180 }}>
          <label style={labelStyle}>
            octaves ({octaves})
            <Fader
              value={octaves}
              onChange={v => setOctaves(Math.max(1, Math.min(5, Math.round(v))))}
              min={1}
              max={5}
              orientation="horizontal"
              size="sm"
              aria-label="Octaves"
            />
          </label>

          <Toggle checked={sm}       onChange={setSm}       label="compact (sm)" size="sm" />
          <Toggle checked={typing}   onChange={setTyping}   label="QWERTY typing" size="sm" />
          <Toggle checked={disabled} onChange={setDisabled} label="disabled" size="sm" />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
            lineHeight: 1.7,
            whiteSpace: 'pre',
          }}>
            {'click / drag → play, glissando\nfront of key → louder\nA S D F… → white keys\nW E T Y U → black keys\nZ / X → octave down / up\nTab + ←/→ → rove keys\nEnter / Space → play focused'}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ─────────────────────────────────────────────────────────

export default function KeyboardDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
