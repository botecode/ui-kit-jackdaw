// src/components/HighMode/HighMode.tsx
//
// HighMode — the full-screen "catch ideas" flow (the brand's Focus mode).
//
// Why this isn't a webpage: High mode is the one moment the app goes dark and
// quiet. You leave the workspace, pick the one or two things you'll play, and the
// room becomes a tape machine: only your armed tracks, the click, and a record
// button. You play; on pause we split the session where you paused into takes you
// can audition, trim like tape, and keep straight into your Ideas Library. Then
// the lights come back up (paper) for the calm review. That dark → light arc is
// the whole feeling.
//
// Composition (KIT-LEAD: reuse the kit, don't reinvent): the record room composes
// the LiveCaptureTrack (your take rolling in live, sealing on a pause) + the
// transport (TransportButton / Clock) + the Metronome; the how-it-works screen uses
// CaptureDemo; the review composes HighTake (now playable) + Dialog + TextField; the
// processing beat reuses Progress. State here is the mock high.* bridge
// (src/lib/highSession) — swap generateMockTakes for the engine later; the shapes
// are the contract.
//
// Selection note: the card spec said "LivingInstrumentCard selection state", but
// that component is the heavy studio fader/meter/pan card (drag-to-set-level) —
// wrong for a calm "what are you playing?" pick. Per the approved mockup, the
// select cards are lightweight internal pieces here; the real project tracks feed
// in via the `instruments` prop.

import { useEffect, useRef, useState } from 'react'
import { CaretLeft, Check, Feather, Plus } from '@phosphor-icons/react'
import { Button } from '../Button'
import { CaptureDemo } from './CaptureDemo'
import { Clock } from '../Clock'
import { Dialog } from '../Dialog'
import { HighTake } from '../HighTake'
import { LiveCaptureTrack } from './LiveCaptureTrack'
import { LivingInstrumentCard } from '../LivingInstrumentCard'
import type { InputSelectOption } from '../InputSelect'
import type { FxPlugin } from '../FxChip'
import { Metronome } from '../Metronome'
import { Progress } from '../Progress'
import { TextField } from '../TextField'
import { TransportButton } from '../TransportButton'
import {
  clampTrim,
  generateMockTakes,
  type HighInstrumentOption,
  type HighPhase,
  type HighSavedIdea,
  type HighTakeData,
} from '../../lib/highSession'
import styles from './HighMode.module.css'

export type { HighInstrumentOption, HighPhase, HighSavedIdea } from '../../lib/highSession'

export interface HighModeProps {
  /** The project tracks the writer can arm for the session. */
  instruments: HighInstrumentOption[]
  bpm: number
  numerator?: number
  denominator?: number
  /** Most instruments you can arm at once. Default 2 (one or two, per the brief). */
  maxSelect?: number
  /** Live spectrum (normalized 0–1 magnitudes, low→high) driving the capture track.
   *  Wire the engine's Web Audio AnalyserNode here; omitted → a synthesised signal. */
  getSpectrum?: () => number[]
  /** Leave High mode (after the close confirm in review, or straight out earlier). */
  onExit?: () => void
  /** A take was saved to the Ideas Library. */
  onSaveIdea?: (idea: HighSavedIdea) => void
  /** Close confirm — keep the whole session's audio. */
  onKeepSession?: () => void
  /** Close confirm — discard the whole session's audio (saved ideas persist regardless). */
  onDiscardSession?: () => void
  /** Start phase — for Home wiring, the gallery, and tests. Default 'howto'.
   *  Hosts that have shown the explainer before can open straight on 'selecting'. */
  initialPhase?: HighPhase
  /** Pre-armed instruments — needed when initialPhase skips selection. */
  initialSelectedIds?: string[]
  /** Processing dwell before takes appear (ms). Default 1100; tests pass 0. */
  processingMs?: number
  /** Deterministic takes for the gallery + tests. */
  takesSeed?: number
  takesCount?: number
  size?: 'sm' | 'md'
}

const SELECT_TITLE = 'What are you playing?'

// ── Input / FX setup (the soundcheck screen) ──────────────────────────────────
// Mock inputs + a default insert chain so the LivingInstrumentCard setup is
// functional ui/-only. The engine swaps these for the real device list + chain.
const INPUT_OPTIONS: InputSelectOption[] = [
  { id: 'in-1', label: 'Input 1', inputName: 'XLR 1 · Mono' },
  { id: 'in-2', label: 'Input 2', inputName: 'XLR 2 · Mono' },
  { id: 'in-3', label: 'Input 3', inputName: 'DI 1 · Mono' },
  { id: 'in-4', label: 'Input 4', inputName: 'USB · Mono' },
]
const DEFAULT_FX = (): FxPlugin[] => [
  { id: 'eq', name: 'EQ', enabled: true },
  { id: 'comp', name: 'Comp', enabled: true },
  { id: 'reverb', name: 'Reverb', enabled: false },
]
interface SetupCfg {
  input: string | null
  fx: FxPlugin[]
  fxChainEnabled: boolean
  volumeDb: number
  pan: number
}
function defaultSetup(idx: number): SetupCfg {
  return {
    input: INPUT_OPTIONS[idx % INPUT_OPTIONS.length].id,
    fx: DEFAULT_FX(),
    fxChainEnabled: true,
    volumeDb: 0,
    // Spread two instruments a touch left/right so the stage opens up.
    pan: idx === 0 ? -0.15 : idx === 1 ? 0.15 : 0,
  }
}

export function HighMode({
  instruments,
  bpm,
  numerator = 4,
  denominator = 4,
  maxSelect = 2,
  getSpectrum,
  onExit,
  onSaveIdea,
  onKeepSession,
  onDiscardSession,
  initialPhase = 'howto',
  initialSelectedIds = [],
  processingMs = 1100,
  takesSeed = 1,
  takesCount = 3,
  size = 'md',
}: HighModeProps) {
  const [phase, setPhase] = useState<HighPhase>(initialPhase)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [metronomeOn, setMetronomeOn] = useState(true)
  const [demoCaption, setDemoCaption] = useState('You keep playing.')
  const [liveCaught, setLiveCaught] = useState(0)
  const [setupConfig, setSetupConfig] = useState<Record<string, SetupCfg>>({})
  const [takes, setTakes] = useState<HighTakeData[]>(
    initialPhase === 'reviewing'
      ? generateMockTakes({ count: takesCount, seed: takesSeed })
      : [],
  )

  // Modals
  const [saveTargetId, setSaveTargetId] = useState<string | null>(null)
  const [saveName, setSaveName] = useState('')
  const [closeOpen, setCloseOpen] = useState(false)

  const savedCount = takes.filter(t => t.saved).length

  // ── Recording clock (cosmetic, drives Clock + Metronome beat) ──
  const recT0 = useRef(0)
  const [recSeconds, setRecSeconds] = useState(0)
  useEffect(() => {
    if (phase !== 'recording') return
    recT0.current = performance.now()
    setRecSeconds(0)
    setLiveCaught(0)
    const id = setInterval(() => setRecSeconds((performance.now() - recT0.current) / 1000), 100)
    return () => clearInterval(id)
  }, [phase])

  // ── Processing → reviewing dwell ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'processing') return
    const id = setTimeout(() => setPhase('reviewing'), Math.max(0, processingMs))
    return () => clearTimeout(id)
  }, [phase, processingMs])

  // ── Review playback (one take at a time; own rAF, performance.now clock) ─────
  const playRef = useRef<{ id: string; t0: number; from: number; end: number } | null>(null)
  const rafRef = useRef(0)
  const [playingTakeId, setPlayingTakeId] = useState<string | null>(null)
  function stopPlay() {
    cancelAnimationFrame(rafRef.current)
    playRef.current = null
    setPlayingTakeId(null)
  }
  function getPlayheadSeconds() {
    const p = playRef.current
    return p ? p.from + (performance.now() - p.t0) / 1000 : 0
  }
  function togglePlay(take: HighTakeData) {
    if (playingTakeId === take.id) { stopPlay(); return }
    cancelAnimationFrame(rafRef.current)
    playRef.current = { id: take.id, t0: performance.now(), from: take.trimStart, end: take.trimEnd }
    setPlayingTakeId(take.id)
    const tick = () => {
      const p = playRef.current
      if (!p || getPlayheadSeconds() >= p.end) { stopPlay(); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  // ── Intents ──────────────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= maxSelect) return [...prev.slice(1), id] // keep most-recent maxSelect
      return [...prev, id]
    })
  }

  // In the record room, arming caps at maxSelect — unarm is always allowed; arming
  // a new track when full is a no-op (you can only roll two at once).
  function toggleArm(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= maxSelect) return prev
      return [...prev, id]
    })
  }

  function continueToSelect() {
    setPhase('selecting')
  }

  // Selection → the input/FX setup screen (soundcheck), then the tape.
  function goToSetup() {
    if (selectedIds.length === 0) return
    setPhase('setup')
  }
  function startRecording() {
    if (selectedIds.length === 0) return
    setPhase('recording')
  }

  // Patch one instrument's setup, seeding from its default if first touched.
  function patchSetup(id: string, idx: number, patch: Partial<SetupCfg>) {
    setSetupConfig(prev => {
      const cur = prev[id] ?? defaultSetup(idx)
      return { ...prev, [id]: { ...cur, ...patch } }
    })
  }

  function finishTake() {
    stopPlay()
    // If the live track caught takes this session, review shows exactly those.
    const count = liveCaught > 0 ? liveCaught : takesCount
    setTakes(generateMockTakes({ count, seed: takesSeed }))
    setPhase('processing')
  }

  function trimTake(id: string, start: number, end: number) {
    setTakes(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const c = clampTrim(start, end, t.durationSeconds)
        return { ...t, trimStart: c.start, trimEnd: c.end }
      }),
    )
  }

  function openSave(id: string) {
    const take = takes.find(t => t.id === id)
    setSaveName(take?.label ?? '')
    setSaveTargetId(id)
  }
  function confirmSave() {
    const take = takes.find(t => t.id === saveTargetId)
    if (take) {
      onSaveIdea?.({
        id: `idea-${take.id}`,
        name: saveName.trim() || take.label,
        takeId: take.id,
        bpm,
        durationSeconds: Math.round((take.trimEnd - take.trimStart) * 10) / 10,
      })
      setTakes(prev => prev.map(t => (t.id === take.id ? { ...t, saved: true } : t)))
    }
    setSaveTargetId(null)
    setSaveName('')
  }

  function leave() {
    stopPlay()
    if (phase === 'reviewing') setCloseOpen(true)
    else onExit?.()
  }
  function keepSession() { setCloseOpen(false); onKeepSession?.(); onExit?.() }
  function discardSession() { setCloseOpen(false); onDiscardSession?.(); onExit?.() }

  const beat = Math.floor(recSeconds / (60 / bpm)) % numerator

  // ── Render ─────────────────────────────────────────────────────────────────
  const dark =
    phase === 'howto' || phase === 'selecting' || phase === 'setup' ||
    phase === 'recording' || phase === 'processing'

  return (
    <div
      className={styles.root}
      data-phase={phase}
      data-face={dark ? 'stage' : 'paper'}
      data-size={size}
    >
      {phase === 'howto' && renderHowTo()}
      {phase === 'selecting' && renderSelect()}
      {phase === 'setup' && renderSetup()}
      {phase === 'recording' && renderRecord()}
      {phase === 'processing' && renderProcessing()}
      {phase === 'reviewing' && renderReview()}

      {/* ── Save-take modal ─────────────────────────────────────────────────── */}
      <Dialog
        open={saveTargetId != null}
        onClose={() => { setSaveTargetId(null); setSaveName('') }}
        title="Name this idea"
        actions={
          <>
            <Button variant="ghost" onClick={() => { setSaveTargetId(null); setSaveName('') }}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Plus />} onClick={confirmSave}>
              Save to Ideas
            </Button>
          </>
        }
      >
        <p className={styles.dlgText}>
          It lands in your Ideas Library, carrying its tempo. Steal from yourself later.
        </p>
        <TextField
          tone="surface"
          label="Idea name"
          value={saveName}
          onChange={setSaveName}
          placeholder="Kitchen riff, 2am"
          autoFocus
        />
      </Dialog>

      {/* ── Close-session confirm ───────────────────────────────────────────── */}
      <Dialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Keep this High session?"
        actions={
          <>
            <button type="button" className={styles.danger} onClick={discardSession}>
              Discard session
            </button>
            <Button variant="primary" onClick={keepSession}>Keep session</Button>
          </>
        }
      >
        <p className={styles.dlgText}>
          You can keep the whole session's audio to revisit later, or discard it and travel light.
        </p>
        <p className={styles.safeNote}>
          <Check weight="bold" />
          {savedCount === 0
            ? 'Nothing saved yet, but the session audio is still here if you keep it.'
            : `The ${savedCount} ${savedCount === 1 ? 'idea' : 'ideas'} you saved are safe either way.`}
        </p>
      </Dialog>
    </div>
  )

  // ── Phase renderers ──────────────────────────────────────────────────────────
  function renderHowTo() {
    return (
      <>
        <header className={styles.roomHead}>
          <button type="button" className={styles.leave} onClick={leave}>
            <CaretLeft weight="bold" /> Leave the nest
          </button>
          <span className={styles.spacer} />
          <span className={styles.bpmTag}>{bpm}<span className={styles.bpmUnit}>BPM</span></span>
        </header>
        <div className={styles.center}>
          <div className={styles.titleBlock}>
            <span className={styles.kicker}><Feather weight="fill" /> High mode</span>
            <h1 className={styles.title}>Just play. We'll catch it.</h1>
            <p className={styles.lede}>
              No takes to set up, no record button to babysit. Keep playing, and when you land on
              something you like, simply stop. Hold still for a couple of seconds and High mode
              captures that take on its own.
            </p>
          </div>

          <div className={styles.demoWrap}>
            <div className={styles.demoPanel}>
              <CaptureDemo onCaption={setDemoCaption} />
            </div>
            <p className={styles.demoCaption} aria-live="polite">{demoCaption}</p>
          </div>

          <Button variant="primary" size="md" onClick={continueToSelect}>
            Got it, let's play
          </Button>
        </div>
      </>
    )
  }

  function renderSelect() {
    return (
      <>
        <header className={styles.roomHead}>
          <button type="button" className={styles.leave} onClick={leave}>
            <CaretLeft weight="bold" /> Leave the nest
          </button>
          <span className={styles.spacer} />
          <span className={styles.bpmTag}>{bpm}<span className={styles.bpmUnit}>BPM</span></span>
        </header>
        <div className={styles.center}>
          <div className={styles.titleBlock}>
            <span className={styles.kicker}>High mode</span>
            <h1 className={styles.title}>{SELECT_TITLE}</h1>
            <p className={styles.lede}>
              Pick one or two. We'll arm just those, keep the room quiet, and catch every idea
              while you go.
            </p>
          </div>
          <div className={styles.cardRow} role="group" aria-label="Choose instruments to play">
            {instruments.map(inst => {
              const sel = selectedIds.includes(inst.id)
              return (
                <button
                  key={inst.id}
                  type="button"
                  className={styles.pick}
                  data-selected={sel || undefined}
                  aria-pressed={sel}
                  aria-label={inst.name}
                  onClick={() => toggleSelect(inst.id)}
                >
                  <span className={styles.pickCheck} aria-hidden="true"><Check weight="bold" /></span>
                  <span className={styles.pickTop}>
                    <span className={styles.pickPill} style={{ background: inst.color }} />
                    <span className={styles.pickName}>{inst.name}</span>
                  </span>
                  {inst.input && <span className={styles.pickSub}>{inst.input}</span>}
                  <span className={styles.miniMeter} aria-hidden="true">
                    {MINI_METER.map((h, i) => (
                      <span
                        key={i}
                        style={{
                          height: `${sel ? h : Math.max(3, h * 0.3)}%`,
                          background: sel ? meterColor(h) : undefined,
                        }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
          <div className={styles.startRow}>
            <span className={styles.selCount}>
              {selectedIds.length} of {maxSelect} picked
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={selectedIds.length === 0}
              onClick={goToSetup}
            >
              Set up inputs
            </Button>
          </div>
        </div>
      </>
    )
  }

  function renderSetup() {
    const chosen = instruments.filter(i => selectedIds.includes(i.id))
    return (
      <>
        <header className={styles.roomHead}>
          <button type="button" className={styles.leave} onClick={() => setPhase('selecting')}>
            <CaretLeft weight="bold" /> Back
          </button>
          <span className={styles.spacer} />
          <span className={styles.bpmTag}>{bpm}<span className={styles.bpmUnit}>BPM</span></span>
        </header>
        <div className={styles.center}>
          <div className={styles.titleBlock}>
            <span className={styles.kicker}><Feather weight="fill" /> High mode</span>
            <h1 className={styles.title}>Dial in your inputs</h1>
            <p className={styles.lede}>
              Pick the input for each, shape it with FX, set the level. Then roll, and the tape
              catches the rest.
            </p>
          </div>

          <div className={styles.setupRow} role="group" aria-label="Set up your instruments">
            {chosen.map((inst, idx) => {
              const cfg = setupConfig[inst.id] ?? defaultSetup(idx)
              return (
                <LivingInstrumentCard
                  key={inst.id}
                  trackId={inst.id}
                  name={inst.name}
                  color={inst.color}
                  armed
                  muted={false}
                  soloed={false}
                  input={{ value: cfg.input, options: INPUT_OPTIONS }}
                  onInputChange={id => patchSetup(inst.id, idx, { input: id })}
                  fx={cfg.fx}
                  fxChainEnabled={cfg.fxChainEnabled}
                  onFxToggleChain={next => patchSetup(inst.id, idx, { fxChainEnabled: next })}
                  onFxTogglePlugin={(id, next) =>
                    patchSetup(inst.id, idx, { fx: cfg.fx.map(p => (p.id === id ? { ...p, enabled: next } : p)) })
                  }
                  onFxRemove={id => patchSetup(inst.id, idx, { fx: cfg.fx.filter(p => p.id !== id) })}
                  onFxAdd={() =>
                    patchSetup(inst.id, idx, {
                      fx: [...cfg.fx, { id: `fx-${cfg.fx.length + 1}`, name: 'New FX', enabled: true }],
                    })
                  }
                  volumeDb={cfg.volumeDb}
                  onVolumeChange={db => patchSetup(inst.id, idx, { volumeDb: db })}
                  pan={cfg.pan}
                  onPanChange={p => patchSetup(inst.id, idx, { pan: p })}
                  size="md"
                />
              )
            })}
          </div>

          <div className={styles.startRow}>
            <span className={styles.selCount}>{chosen.length} of {maxSelect} ready</span>
            <Button variant="primary" size="md" disabled={chosen.length === 0} onClick={startRecording}>
              Start the tape
            </Button>
          </div>
        </div>
      </>
    )
  }

  function renderRecord() {
    return (
      <>
        <header className={styles.recHead}>
          <div className={styles.headRow}>
            <button type="button" className={styles.leave} onClick={leave}>
              <CaretLeft weight="bold" /> Leave
            </button>
            <span className={styles.spacer} />
            <Clock
              seconds={recSeconds}
              bpm={bpm}
              numerator={numerator}
              denominator={denominator}
              state="recording"
              size={size}
            />
            <span className={styles.spacer} />
            <Metronome
              enabled={metronomeOn}
              onToggle={setMetronomeOn}
              bpm={bpm}
              numerator={numerator}
              beat={metronomeOn ? beat : -1}
              size={size}
            />
          </div>
          {/* Inputs live here now — pills you arm / unarm. Nothing else to fiddle with. */}
          <div className={styles.armPills} role="group" aria-label="Arm instruments">
            {instruments.map(inst => {
              const armed = selectedIds.includes(inst.id)
              return (
                <button
                  key={inst.id}
                  type="button"
                  className={styles.armPill}
                  data-armed={armed || undefined}
                  aria-pressed={armed}
                  aria-label={`${inst.name} — ${armed ? 'armed' : 'off'}`}
                  onClick={() => toggleArm(inst.id)}
                >
                  <span className={styles.armDot} style={{ background: inst.color }} aria-hidden="true" />
                  {inst.name}
                </button>
              )
            })}
          </div>
        </header>

        {/* The room IS the catch: your take draws in live and seals on a pause. */}
        <div className={styles.captureStage}>
          <div className={styles.captureWrap}>
            <LiveCaptureTrack
              active
              getSpectrum={getSpectrum}
              onCapture={() => setLiveCaught(c => c + 1)}
            />
            <p className={styles.captureHint}>
              Keep playing. Pause for a beat on the bits you love and we seal them as takes.
            </p>
          </div>
        </div>

        <footer className={styles.dock}>
          <TransportButton
            variant="pause"
            size={size}
            onClick={finishTake}
            aria-label="Pause and review your takes"
          />
        </footer>
      </>
    )
  }

  function renderProcessing() {
    return (
      <div className={styles.center}>
        <Progress variant="ring" aria-label="Processing your takes" />
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Processing your takes</h1>
          <p className={styles.lede}>Splitting where you paused. Hang tight, this is quick.</p>
        </div>
      </div>
    )
  }

  function renderReview() {
    return (
      <div className={styles.review}>
        <header className={styles.reviewHead}>
          <button type="button" className={styles.leaveDark} onClick={leave}>
            <CaretLeft weight="bold" /> Close session
          </button>
          <span className={styles.kicker}>
            <Feather weight="fill" /> High mode · {takes.length} {takes.length === 1 ? 'take' : 'takes'}
          </span>
          <h1 className={styles.reviewTitle}>Keep the bits you love</h1>
          <p className={styles.lede}>
            We split your session where you paused. Play each take, slide the handles to trim it,
            then save the keepers straight to your Ideas Library. The rest slips quietly away.
          </p>
        </header>
        <div className={styles.takeList}>
          {takes.map(take => (
            <div key={take.id} className={styles.takeCard} data-saved={take.saved || undefined}>
              <HighTake
                peaks={take.peaks}
                durationSeconds={take.durationSeconds}
                trimStart={take.trimStart}
                trimEnd={take.trimEnd}
                onTrim={(s, e) => trimTake(take.id, s, e)}
                onSave={() => openSave(take.id)}
                label={take.saved ? `${take.label} · saved` : take.label}
                playing={playingTakeId === take.id}
                onTogglePlay={() => togglePlay(take)}
                playheadSeconds={take.trimStart}
                getPlayheadSeconds={getPlayheadSeconds}
                size={size}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────────

const MINI_METER = [12, 22, 34, 52, 72, 62, 44, 30, 48, 66, 82, 58, 38, 24, 14]

function meterColor(h: number): string {
  if (h > 74) return 'var(--meter-clip)'
  if (h > 54) return 'var(--meter-hot)'
  return 'var(--meter-safe)'
}
