// src/components/PairQRCode/PairQRCode.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProductFrame } from '../ProductFrame'
import { PairQRCode } from './PairQRCode'
import type { PairStatus } from './PairQRCode'

export const meta: DemoMeta = {
  name: 'PairQRCode',
  group: 'Composites',
  route: '/pair-qr-code',
  order: 54,
}

const CODE = 'nioh://pair/7-tuna-zebra-piano'
const DEVICE = "Fernando's MacBook"

function Box({ children, width = 300 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%', display: 'flex', justifyContent: 'center' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────
// The 9 generic labels map onto this controlled lifecycle card: default=waiting,
// selected=connected, error/disabled=cancelled, focus=Cancel ring. "waiting" is
// the loading-equivalent (it IS the live/listening state); a pairing card has no
// empty of its own. Recorded so a reviewer sees the deliberate mapping.

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="waiting / showing (default)">
        <Box>
          <PairQRCode code={CODE} deviceName={DEVICE} status="waiting" />
        </Box>
      </State>

      <State label="connected (success) — with peer">
        <Box>
          <PairQRCode code={CODE} deviceName={DEVICE} status="connected" peerName="Studio iPad" />
        </Box>
      </State>

      <State label="connected — no peer name">
        <Box>
          <PairQRCode code={CODE} deviceName={DEVICE} status="connected" />
        </Box>
      </State>

      <State label="cancelled">
        <Box>
          <PairQRCode code={CODE} deviceName={DEVICE} status="cancelled" />
        </Box>
      </State>

      <State label="focus — Cancel ring">
        <Box>
          <FocusDemo />
        </Box>
      </State>

      <State label="sm size">
        <Box width={240}>
          <PairQRCode code={CODE} deviceName={DEVICE} status="waiting" size="sm" />
        </Box>
      </State>
    </StatesGrid>
  )
}

function FocusDemo() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const btn = ref.current?.querySelector('button') as HTMLElement | null
    btn?.focus()
  }, [])
  return (
    <div ref={ref}>
      <PairQRCode code={CODE} deviceName={DEVICE} status="waiting" />
    </div>
  )
}

// ─── Playground — a real pairing handshake (host-driven) ─────────────────────────

function PlaygroundDemo() {
  const [status, setStatus] = useState<PairStatus>('waiting')
  const [peerName, setPeerName] = useState<string | undefined>(undefined)
  const [autoConnect, setAutoConnect] = useState(true)
  const [log, setLog] = useState('listening for a peer…')

  // Host store drives the lifecycle exactly like the real Nioh flow: while we're
  // showing the code and a peer is allowed to connect, the handshake completes
  // after a beat. The component owns no socket — it's a controlled view.
  useEffect(() => {
    if (status !== 'waiting' || !autoConnect) return
    const id = setTimeout(() => {
      setPeerName('Studio iPad')
      setStatus('connected')
      setLog('peer connected → Studio iPad')
    }, 2600)
    return () => clearTimeout(id)
  }, [status, autoConnect])

  function reset() {
    setPeerName(undefined)
    setStatus('waiting')
    setLog('listening for a peer…')
  }

  function handleCancel() {
    setStatus('cancelled')
    setLog('cancelled by this device')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        {/* Live phone-frame preview — the pairing surface as it sits in the app. */}
        <ProductFrame variant="phone" sheen caption="On your phone — show this to connect">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 'var(--space-5)',
            }}
          >
            <PairQRCode
              code={CODE}
              deviceName={DEVICE}
              status={status}
              peerName={peerName}
              onCancel={handleCancel}
            />
          </div>
        </ProductFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 220 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            status: {status}
            <br />
            last event: {log}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={autoConnect} onChange={setAutoConnect} aria-label="Auto-connect a peer" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Auto-connect a peer</span>
          </label>

          <button
            type="button"
            onClick={reset}
            style={{
              alignSelf: 'flex-start',
              padding: 'var(--space-2) var(--space-4)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Show code again
          </button>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function PairQRCodeDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
