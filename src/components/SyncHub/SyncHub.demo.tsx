// src/components/SyncHub/SyncHub.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ProductFrame } from '../ProductFrame'
import { SyncHub } from './SyncHub'
import type { SyncStatus, SyncPeer, KnownDevice } from './SyncHub'

export const meta: DemoMeta = {
  name: 'SyncHub',
  group: 'Composites',
  route: '/sync-hub',
  order: 55,
}

const PHONE_PEER: SyncPeer = { id: 'p1', name: "Bob's phone", kind: 'phone' }
const DAW_PEER: SyncPeer = { id: 'd1', name: 'Your DAW', kind: 'daw' }

const DEVICES: KnownDevice[] = [
  { id: 'd1', name: 'Your DAW', kind: 'daw', onNetwork: true },
  { id: 'p1', name: "Bob's phone", kind: 'phone' },
  { id: 'p2', name: "Ana's iPhone", kind: 'phone' },
]

const noop = () => {}

function Box({ children, width = 340 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── States ───────────────────────────────────────────────────────────────────
// The card lists exactly four lifecycle states; they map onto the generic grid:
// default = disconnected · loading = connecting · selected = connected-to-daw
// (the lit link) · plus connected-to-phone, the devices tray, and the focus ring.
// No error state — a failed handshake belongs to the Pair screens and simply
// returns the hub to disconnected (recorded so a reviewer sees the call).

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="disconnected (default)">
        <Box>
          <SyncHub onShowCode={noop} onScan={noop} />
        </Box>
      </State>

      <State label="connecting — phone (loading)">
        <Box>
          <SyncHub status="connecting" peer={PHONE_PEER} onShowCode={noop} onScan={noop} onDisconnect={noop} />
        </Box>
      </State>

      <State label="connected — to a phone (other network)">
        <Box>
          <SyncHub status="connected" peer={PHONE_PEER} onShowCode={noop} onScan={noop} onDisconnect={noop} />
        </Box>
      </State>

      <State label="connected — to your DAW (selected)">
        <Box>
          <SyncHub status="connected" peer={DAW_PEER} onShowCode={noop} onScan={noop} onDisconnect={noop} />
        </Box>
      </State>

      <State label="with recent devices + DAW on your network">
        <Box>
          <SyncHub onShowCode={noop} onScan={noop} onReconnect={noop} devices={DEVICES} />
        </Box>
      </State>

      <State label="connected — linked device lit in the tray">
        <Box>
          <SyncHub
            status="connected"
            peer={DAW_PEER}
            devices={DEVICES}
            onShowCode={noop}
            onScan={noop}
            onReconnect={noop}
            onDisconnect={noop}
          />
        </Box>
      </State>

      <State label="focus — action ring">
        <Box>
          <FocusDemo />
        </Box>
      </State>

      <State label="sm size">
        <Box width={280}>
          <SyncHub size="sm" onShowCode={noop} onScan={noop} onReconnect={noop} devices={DEVICES} />
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
      <SyncHub onShowCode={noop} onScan={noop} />
    </div>
  )
}

// ─── Playground — a live sync handshake in the phone frame ────────────────────
// The hub is a controlled view; the app store drives the lifecycle. The context
// toggle flips between the two real scenarios: phone↔phone (QR handshake across
// networks) and phone↔DAW (auto-discovered on the same network, one-tap connect).

function PlaygroundDemo() {
  const [status, setStatus] = useState<SyncStatus>('disconnected')
  const [peer, setPeer] = useState<SyncPeer | undefined>(undefined)
  const [dawContext, setDawContext] = useState(false)
  const [log, setLog] = useState('idle — not connected')

  const target = dawContext ? DAW_PEER : PHONE_PEER
  // In the DAW context the desktop is auto-discovered on the network.
  const devices: KnownDevice[] = dawContext
    ? [{ ...DAW_PEER, onNetwork: true }, DEVICES[1], DEVICES[2]]
    : [DEVICES[1], DEVICES[2]]

  // A handshake settles after a beat — exactly like the real Nioh flow.
  useEffect(() => {
    if (status !== 'connecting') return
    const id = setTimeout(() => {
      setStatus('connected')
      setLog(`linked → ${target.name}`)
    }, 1800)
    return () => clearTimeout(id)
  }, [status, target.name])

  function begin(via: string, p: SyncPeer) {
    setPeer(p)
    setStatus('connecting')
    setLog(`${via} → handshaking with ${p.name}…`)
  }

  function disconnect() {
    setStatus('disconnected')
    setPeer(undefined)
    setLog(status === 'connecting' ? 'cancelled' : 'disconnected')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        <ProductFrame variant="phone" sheen caption="On your phone — the sync hub (topbar QR icon)">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              padding: 'var(--space-4)',
            }}
          >
            <SyncHub
              status={status}
              peer={peer}
              devices={status === 'disconnected' ? devices : undefined}
              onShowCode={() => begin('show code', target)}
              onScan={() => begin('scan', target)}
              onReconnect={id => {
                const d = devices.find(x => x.id === id)
                if (d) begin(d.onNetwork ? 'on-network' : 'reconnect', d)
              }}
              onDisconnect={disconnect}
            />
          </div>
        </ProductFrame>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 220 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            status: {status}
            <br />
            context: {dawContext ? 'phone ↔ DAW' : 'phone ↔ phone'}
            <br />
            last event: {log}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={dawContext} onChange={setDawContext} aria-label="DAW on your network" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>DAW on your network</span>
          </label>

          <button
            type="button"
            onClick={disconnect}
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
            Reset
          </button>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ────────────────────────────────────────────────────────────

export default function SyncHubDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
