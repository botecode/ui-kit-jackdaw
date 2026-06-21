// src/components/SupportFlow/SupportFlow.demo.tsx
import { useState, useEffect, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SupportFlow } from './SupportFlow'
import type { SupportFlowPhase } from './SupportFlow'

export const meta: DemoMeta = {
  name: 'SupportFlow',
  group: 'Composites',
  route: '/support-flow',
  order: 35,
}

// ─── Shared button style (kit tokens; no hardcoded colors) ───────────────────

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  cursor: 'pointer',
  outline: 'none',
}

// ─── State cards ─────────────────────────────────────────────────────────────

function CountdownRunningCard() {
  const [shown, setShown] = useState(false)
  return (
    <State label="Countdown — running (>1:00), badge at viewport corner">
      <button style={TRIGGER} onClick={() => setShown(v => !v)}>
        {shown ? 'Hide badge' : 'Show badge'}
      </button>
      {shown && (
        <SupportFlow
          phase="countdown"
          remainingSeconds={87}
          onDefer={() => {}}
          onDonate={() => {}}
          onContinueFree={() => setShown(false)}
        />
      )}
    </State>
  )
}

function CountdownUrgentCard() {
  const [shown, setShown] = useState(false)
  return (
    <State label="Countdown — ≤1:00 (amber LED + +5 min button)">
      <button style={TRIGGER} onClick={() => setShown(v => !v)}>
        {shown ? 'Hide urgent badge' : 'Show urgent badge'}
      </button>
      {shown && (
        <SupportFlow
          phase="countdown"
          remainingSeconds={42}
          onDefer={() => setShown(false)}
          onDonate={() => {}}
          onContinueFree={() => setShown(false)}
        />
      )}
    </State>
  )
}

function DialogFreeCard() {
  const [phase, setPhase] = useState<SupportFlowPhase>('dismissed')
  return (
    <State label="Dialog — slider at $0 (free)">
      <button style={TRIGGER} onClick={() => setPhase('dialog')}>
        Open dialog
      </button>
      <SupportFlow
        phase={phase}
        remainingSeconds={0}
        onDefer={() => {}}
        onDonate={() => setPhase('thankyou')}
        onContinueFree={() => setPhase('dismissed')}
      />
    </State>
  )
}

function DialogAmountCard() {
  const [phase, setPhase] = useState<SupportFlowPhase>('dialog')
  return (
    <State label="Dialog — drag the fader right to set an amount">
      <SupportFlow
        phase={phase}
        remainingSeconds={0}
        onDefer={() => {}}
        onDonate={() => setPhase('thankyou')}
        onContinueFree={() => setPhase('dismissed')}
      />
      {phase === 'dismissed' && (
        <button style={TRIGGER} onClick={() => setPhase('dialog')}>
          Re-open
        </button>
      )}
    </State>
  )
}

function ThankyouCard() {
  const [phase, setPhase] = useState<SupportFlowPhase>('thankyou')
  return (
    <State label="Thank-you state (after donation)">
      <SupportFlow
        phase={phase}
        remainingSeconds={0}
        onDefer={() => {}}
        onDonate={() => {}}
        onContinueFree={() => setPhase('dismissed')}
      />
      {phase === 'dismissed' && (
        <button style={TRIGGER} onClick={() => setPhase('thankyou')}>
          Re-show
        </button>
      )}
    </State>
  )
}

function DismissedCard() {
  return (
    <State label="Dismissed — component returns null">
      <SupportFlow
        phase="dismissed"
        remainingSeconds={0}
        onDefer={() => {}}
        onDonate={() => {}}
        onContinueFree={() => {}}
      />
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-dim)',
      }}>
        (no DOM output)
      </span>
    </State>
  )
}

// ─── States grid ──────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <CountdownRunningCard />
      <CountdownUrgentCard />
      <DialogFreeCard />
      <DialogAmountCard />
      <ThankyouCard />
      <DismissedCard />
    </StatesGrid>
  )
}

// ─── Playground ───────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [phase, setPhase] = useState<SupportFlowPhase>('dismissed')
  const [seconds, setSeconds] = useState(120)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 0) {
          setRunning(false)
          setPhase('dialog')
          return 0
        }
        return s - 1
      })
    }, 100)  // 10× fast-forward for demo
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  function startSession() {
    setSeconds(120)
    setPhase('countdown')
    setRunning(true)
  }

  function handleDefer() {
    setSeconds(s => s + 300)
  }

  function handleDonate(amountCents: number) {
    setRunning(false)
    setPhase('thankyou')
    // eslint-disable-next-line no-console
    console.log('onDonate fired:', amountCents, 'cents')
  }

  function handleContinueFree() {
    setRunning(false)
    setPhase('dismissed')
  }

  const phaseLabel: Record<SupportFlowPhase, string> = {
    countdown: `countdown — ${seconds}s remaining`,
    dialog: 'dialog',
    thankyou: 'thankyou',
    dismissed: 'dismissed',
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 200 }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}>
            Phase:{' '}
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
              {phaseLabel[phase]}
            </strong>
          </span>

          <button
            style={{ ...TRIGGER, opacity: running ? 0.5 : 1 }}
            onClick={startSession}
            disabled={running}
          >
            Start session (10× speed)
          </button>

          <Toggle
            checked={phase === 'dialog'}
            onChange={v => { setRunning(false); setPhase(v ? 'dialog' : 'dismissed') }}
            size="sm"
            label="Jump to dialog"
          />
          <Toggle
            checked={phase === 'thankyou'}
            onChange={v => { setRunning(false); setPhase(v ? 'thankyou' : 'dismissed') }}
            size="sm"
            label="Jump to thank-you"
          />
          <Toggle
            checked={phase === 'countdown' && seconds <= 60}
            onChange={v => {
              setRunning(false)
              setPhase('countdown')
              setSeconds(v ? 42 : 90)
            }}
            size="sm"
            label="Urgent countdown (<1:00)"
          />
        </div>

        <SupportFlow
          phase={phase}
          remainingSeconds={seconds}
          onDefer={handleDefer}
          onDonate={handleDonate}
          onContinueFree={handleContinueFree}
        />
      </div>
    </Playground>
  )
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function SupportFlowDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
