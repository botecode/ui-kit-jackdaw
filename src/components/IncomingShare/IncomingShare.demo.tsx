// src/components/IncomingShare/IncomingShare.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { SegmentedControl } from '../SegmentedControl'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { ProductFrame } from '../ProductFrame'
import { IncomingShare } from './IncomingShare'
import type { ShareManifest, IncomingShareStatus } from './IncomingShare'

export const meta: DemoMeta = {
  name: 'IncomingShare',
  group: 'Composites',
  route: '/incoming-share',
  order: 54,
}

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const FULL: ShareManifest = {
  senderName: 'Maya',
  origin: 'phone',
  items: [
    { id: 'v1', kind: 'voice-idea', name: 'Hook idea',     durationSec: 42, sizeBytes: 220_000 },
    { id: 'v2', kind: 'voice-idea', name: 'Verse melody',  durationSec: 78, sizeBytes: 410_000 },
    { id: 'v3', kind: 'voice-idea', name: 'Bridge hum',    durationSec: 31, sizeBytes: 160_000 },
    { id: 'l1', kind: 'lyric',      name: 'Chorus draft',  sizeBytes: 3_000 },
  ],
}

const FROM_DAW: ShareManifest = {
  senderName: 'Theo',
  origin: 'daw',
  items: [
    { id: 'v1', kind: 'voice-idea', name: 'Falsetto take', durationSec: 64, sizeBytes: 512_000 },
    { id: 'l1', kind: 'lyric',      name: 'Second verse',  sizeBytes: 4_200 },
  ],
}

const noop = () => {}

// ─── Box (consistent demo width) ──────────────────────────────────────────────────

function Box({ children, width = 380 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── States ─────────────────────────────────────────────────────────────────────
// Five real states (preview / accepting / declined / expired / invalid) mapped
// onto the 9 required gallery labels. hover / focus / active are exercised on the
// real Accept button inside each cell — the established gallery pattern.

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default — preview">
        <Box>
          <IncomingShare manifest={FULL} onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="hover — hover Accept">
        <Box>
          <IncomingShare manifest={FROM_DAW} onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="focus — tab to Accept">
        <Box>
          <IncomingShare manifest={FULL} size="sm" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="active — press Accept">
        <Box>
          <IncomingShare manifest={FROM_DAW} size="sm" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="disabled — accepting">
        <Box>
          <IncomingShare manifest={FULL} status="accepting" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="loading — starting transfer">
        <Box>
          <IncomingShare manifest={FROM_DAW} status="accepting" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="selected — declined">
        <Box>
          <IncomingShare manifest={FULL} status="declined" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="error — expired link">
        <Box>
          <IncomingShare status="expired" onAccept={noop} onDecline={noop} />
        </Box>
      </State>

      <State label="empty — invalid link">
        <Box>
          <IncomingShare status="invalid" onAccept={noop} onDecline={noop} />
        </Box>
      </State>
    </StatesGrid>
  )
}

// ─── Phone-frame preview ────────────────────────────────────────────────────────
// The deeplink-landing screen as it reads inside the mobile app.

function PhonePreview() {
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          color: 'var(--text)',
          margin: '0 0 var(--space-4)',
        }}
      >
        On the app surface
      </h2>
      <ProductFrame variant="phone" caption="Opening the Nioh share link — Maya's bundle, on your phone">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 520,
            padding: 'var(--space-4)',
            background: 'var(--bg)',
          }}
        >
          <IncomingShare manifest={FULL} size="sm" onAccept={noop} onDecline={noop} />
        </div>
      </ProductFrame>
    </section>
  )
}

// ─── Live playground (dogfooded) ──────────────────────────────────────────────────
// Working accept/decline against local state, driven by kit SegmentedControl /
// Toggle / Checkbox. Accept walks to the `accepting` state (the real handoff to
// TransferProgress); Decline walks to `declined`.

const STATUS_OPTIONS = [
  { value: 'preview', label: 'Preview' },
  { value: 'accepting', label: 'Accepting' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'invalid', label: 'Invalid' },
]

const ORIGIN_OPTIONS = [
  { value: 'phone', label: 'Phone' },
  { value: 'daw', label: 'DAW' },
]

function PlaygroundDemo() {
  const [status, setStatus] = useState<IncomingShareStatus>('preview')
  const [origin, setOrigin] = useState<'phone' | 'daw'>('phone')
  const [compact, setCompact] = useState(false)
  const [withLyric, setWithLyric] = useState(true)
  const [log, setLog] = useState('idle')

  const items = withLyric ? FULL.items : FULL.items.filter(it => it.kind === 'voice-idea')
  const manifest: ShareManifest = { senderName: 'Maya', origin, items }

  function handleAccept() {
    setStatus('accepting')
    setLog('accepted → starting transfer (→ TransferProgress)')
  }

  function handleDecline() {
    setStatus('declined')
    setLog('declined → nothing saved')
  }

  function handleDismiss() {
    setStatus('preview')
    setLog('dismissed → back to preview')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        <Box width={compact ? 340 : 400}>
          <IncomingShare
            manifest={manifest}
            status={status}
            size={compact ? 'sm' : 'md'}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onDismiss={handleDismiss}
          />
        </Box>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 240 }}>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
              Status
            </span>
            <SegmentedControl
              options={STATUS_OPTIONS}
              value={status}
              onChange={v => {
                setStatus(v as IncomingShareStatus)
                setLog(`status → ${v}`)
              }}
              aria-label="Status"
            />
          </div>

          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
              Origin
            </span>
            <SegmentedControl
              options={ORIGIN_OPTIONS}
              value={origin}
              onChange={v => setOrigin(v as 'phone' | 'daw')}
              aria-label="Origin"
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={withLyric} onChange={setWithLyric} aria-label="Include a lyric" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Include a lyric</span>
          </label>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            last intent: {log}
          </div>
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function IncomingShareDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PhonePreview />
      <PlaygroundDemo />
    </DemoShell>
  )
}
