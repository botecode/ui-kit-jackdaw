// src/components/AnnotationLane/AnnotationLane.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell }          from '../../gallery/ui/DemoShell'
import { StatesGrid, State }  from '../../gallery/ui/StatesGrid'
import { Playground }         from '../../gallery/ui/Playground'
import { Toggle }             from '../Toggle'
import { TimelineRuler, secondsToX } from '../TimelineRuler'
import { AnnotationLane }     from './AnnotationLane'
import type { AnnotationType, AnnotationItem } from './AnnotationLane'

export const meta: DemoMeta = {
  name:  'AnnotationLane',
  group: 'Composites',
  route: '/annotation-lane',
  order: 7,
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BPM         = 120
const PX_PER_BEAT = 48
const DURATION_S  = 8
// body width = secondsToX; header adds 88px in the wrapper
const BODY_WIDTH  = secondsToX(DURATION_S, PX_PER_BEAT, BPM)  // 768px

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LYRICS_ITEMS: AnnotationItem[] = [
  { id: 'l1', start: 0,   end: 1.8, text: 'Hello darkness' },
  { id: 'l2', start: 2,   end: 3.5, text: 'my old friend' },
  { id: 'l3', start: 4,   end: 5.5, text: "I've come to talk" },
  { id: 'l4', start: 6,   end: 7.5, text: 'with you again' },
]

const CHORD_ITEMS: AnnotationItem[] = [
  { id: 'c1', start: 0,   text: 'Am' },
  { id: 'c2', start: 1,   text: 'G' },
  { id: 'c3', start: 2,   text: 'F' },
  { id: 'c4', start: 3,   text: 'Cmaj7' },
  { id: 'c5', start: 4,   text: 'Am' },
  { id: 'c6', start: 5,   text: 'G' },
  { id: 'c7', start: 6,   text: 'Dm7' },
  { id: 'c8', start: 7,   text: 'E7' },
]

const TAB_ITEMS: AnnotationItem[] = [
  { id: 't1', start: 0,   end: 2,   text: 'e|---0-2-3-|' },
  { id: 't2', start: 2.5, end: 4.5, text: 'B|---1-3---|' },
  { id: 't3', start: 5,   end: 7.5, text: 'G|---0-2-4-|' },
]

const COMMENT_ITEMS: AnnotationItem[] = [
  { id: 'cm1', start: 0.5, text: 'Start softer here' },
  { id: 'cm2', start: 2,   audio: true, text: 'Ref take' },
  { id: 'cm3', start: 4,   text: 'Build energy!' },
  { id: 'cm4', start: 6.5, audio: true },
]

const ITEMS_BY_TYPE: Record<AnnotationType, AnnotationItem[]> = {
  lyrics:   LYRICS_ITEMS,
  chords:   CHORD_ITEMS,
  tabs:     TAB_ITEMS,
  comments: COMMENT_ITEMS,
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
// Ruler header is aligned with the 88px lane header so bar marks line up.

function LaneWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width:        BODY_WIDTH + 88,
      border:       '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow:     'hidden',
    }}>
      <div style={{ display: 'flex' }}>
        {/* Spacer aligned to the 88px lane header */}
        <div style={{
          width:        88,
          flexShrink:   0,
          background:   'var(--surface)',
          borderRight:  '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }} />
        <TimelineRuler
          bpm={BPM}
          numerator={4}
          denominator={4}
          pxPerBeat={PX_PER_BEAT}
          durationSeconds={DURATION_S}
          size="sm"
        />
      </div>
      {children}
    </div>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>

      {/* ── Empty lanes — each type ── */}
      <State label="empty — lyrics">
        <LaneWrap>
          <AnnotationLane type="lyrics" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — chords">
        <LaneWrap>
          <AnnotationLane type="chords" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — tabs">
        <LaneWrap>
          <AnnotationLane type="tabs" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="empty — comments">
        <LaneWrap>
          <AnnotationLane type="comments" items={[]} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* ── With blocks — all four types ── */}
      <State label="lyrics — phrases pinned to bars">
        <LaneWrap>
          <AnnotationLane type="lyrics" items={LYRICS_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="chords — compact symbols at beats">
        <LaneWrap>
          <AnnotationLane type="chords" items={CHORD_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="tabs — monospace text (render slot for staff later)">
        <LaneWrap>
          <AnnotationLane type="tabs" items={TAB_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      <State label="comments — text bubble + audio play-chip">
        <LaneWrap>
          <AnnotationLane type="comments" items={COMMENT_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* ── Selected block ── */}
      <State label="lyrics — block selected (l2)">
        <LaneWrap>
          <AnnotationLane
            type="lyrics"
            items={LYRICS_ITEMS}
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            selectedId="l2"
          />
        </LaneWrap>
      </State>

      {/* ── All four types stacked — the real song view ── */}
      <State label="all four types stacked">
        <LaneWrap>
          <AnnotationLane type="lyrics"   items={LYRICS_ITEMS}  bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="chords"   items={CHORD_ITEMS}   bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="tabs"     items={TAB_ITEMS}     bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          <AnnotationLane type="comments" items={COMMENT_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
        </LaneWrap>
      </State>

      {/* ── Disabled ── */}
      <State label="disabled — lyrics">
        <LaneWrap>
          <AnnotationLane
            type="lyrics"
            items={LYRICS_ITEMS}
            bpm={BPM}
            pxPerBeat={PX_PER_BEAT}
            disabled
          />
        </LaneWrap>
      </State>

      {/* ── Scrolled ── shows how lanes read inside a clipped container ── */}
      <State label="scrolled — 2 bars in (all types)">
        <div style={{
          width:        500,
          overflow:     'hidden',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{ transform: 'translateX(-192px)', width: BODY_WIDTH + 88 }}>
            <AnnotationLane type="lyrics"   items={LYRICS_ITEMS}  bpm={BPM} pxPerBeat={PX_PER_BEAT} selectedId="l2" />
            <AnnotationLane type="chords"   items={CHORD_ITEMS}   bpm={BPM} pxPerBeat={PX_PER_BEAT} />
            <AnnotationLane type="tabs"     items={TAB_ITEMS}     bpm={BPM} pxPerBeat={PX_PER_BEAT} />
            <AnnotationLane type="comments" items={COMMENT_ITEMS} bpm={BPM} pxPerBeat={PX_PER_BEAT} />
          </div>
        </div>
      </State>

    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [type,       setType]       = useState<AnnotationType>('lyrics')
  const [items,      setItems]      = useState<AnnotationItem[]>(LYRICS_ITEMS)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [disabled,   setDisabled]   = useState(false)
  const [log,        setLog]        = useState('—')

  function switchType(t: AnnotationType) {
    setType(t)
    setItems(ITEMS_BY_TYPE[t])
    setSelectedId(undefined)
    setLog('—')
  }

  let nextId = 0

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Lane ── */}
        <div style={{ flex: '1 1 480px', overflow: 'auto', maxWidth: BODY_WIDTH + 88 + 16 }}>
          <LaneWrap>
            <AnnotationLane
              type={type}
              items={items}
              bpm={BPM}
              pxPerBeat={PX_PER_BEAT}
              selectedId={selectedId}
              disabled={disabled}
              onAdd={t => {
                setLog(`onAdd(${t.toFixed(2)}s)`)
                const duration = type === 'chords' ? undefined : 1
                const newItem: AnnotationItem = {
                  id:    `pg-${nextId++}`,
                  start: t,
                  end:   duration != null ? t + duration : undefined,
                  text:  type === 'chords' ? 'Cmaj7'
                       : type === 'tabs'   ? 'e|---|'
                       : type === 'comments' ? 'Note'
                       : 'new phrase',
                }
                setItems(prev => [...prev, newItem])
                setSelectedId(newItem.id)
              }}
              onEdit={id => {
                setLog(`onEdit(${id})`)
                setSelectedId(id)
              }}
              onMove={(id, start) => {
                setLog(`onMove(${id}, ${start.toFixed(2)}s)`)
                setItems(prev => prev.map(it => {
                  if (it.id !== id) return it
                  const span = it.end != null ? it.end - it.start : 0
                  return { ...it, start, end: it.end != null ? start + span : undefined }
                }))
              }}
              onResize={(id, end) => {
                setLog(`onResize(${id}, end=${end.toFixed(2)}s)`)
                setItems(prev => prev.map(it => it.id === id ? { ...it, end } : it))
              }}
              onDelete={id => {
                setLog(`onDelete(${id})`)
                setItems(prev => prev.filter(it => it.id !== id))
                if (selectedId === id) setSelectedId(undefined)
              }}
              onPlayAudio={id => setLog(`onPlayAudio(${id})`)}
            />
          </LaneWrap>

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

        {/* ── Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flexShrink: 0, minWidth: 160 }}>

          <div style={{
            fontFamily: 'var(--font-ui)',
            fontSize:   'var(--text-sm)',
            color:      'var(--text-muted)',
          }}>
            type
          </div>
          <div
            role="radiogroup"
            aria-label="Lane type"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}
          >
            {(['lyrics', 'chords', 'tabs', 'comments'] as AnnotationType[]).map(t => (
              <Toggle
                key={t}
                checked={type === t}
                onChange={on => { if (on) switchType(t) }}
                label={t}
                size="sm"
                aria-label={`Type ${t}`}
              />
            ))}
          </div>

          <Toggle
            checked={disabled}
            onChange={setDisabled}
            label="disabled"
            size="sm"
          />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--text-dim)',
            marginTop:  'var(--space-2)',
            lineHeight: 1.7,
          }}>
            {'click empty → add\n'}
            {'click block → edit\n'}
            {'drag block → move\n'}
            {'drag right edge → resize\n'}
            {'right-click → delete\n'}
            {'Delete / Backspace → delete\n'}
            {'Enter / Space → edit'}
          </div>
        </div>

      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function AnnotationLaneDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
