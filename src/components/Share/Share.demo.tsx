// src/components/Share/Share.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Share } from './Share'
import type { TransferRole, TransferPhase, ErrorKind, TakeManifest, IncomingManifestData } from './Share'

export const meta: DemoMeta = {
  name: 'Share (Take)',
  group: 'Composites',
  route: '/share',
  order: 50,
}

// ── Shared fixtures ────────────────────────────────────────────────────────────

const MANIFEST: TakeManifest = {
  songName:        'Summer Drift',
  takeLabel:       'Main Mix',
  takeNumber:      3,
  durationSeconds: 183,
  trackCount:      8,
  sizeBytes:       32_400_000,
  hasLyrics:       true,
  hasChords:       true,
}

const INCOMING: IncomingManifestData = {
  trackName:       'Lead Vocal',
  clipCount:       8,
  durationSeconds: 183,
  songName:        'Summer Drift',
}

const LINK = 'jackdaw://share/7-tuna-zebra-piano'

const TRIGGER: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--space-2) var(--space-4)',
  background: 'var(--surface)',
  color: 'var(--text)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  outline: 'none',
}

const NOOP = () => {}

// ── Sender state cards ─────────────────────────────────────────────────────────

function SenderIdleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · idle">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'idle' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderManifestCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · manifest">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'manifest' }} manifest={MANIFEST}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderCodeCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · code (waiting for peer)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'code' }}
        manifest={MANIFEST} code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderConnectingCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · connecting">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'connecting' }}
        code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderTransferringCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · transferring 60%">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'transferring', progress: 0.6 }}
        code="7-tuna-zebra-piano"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderSuccessCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · success">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'success' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderErrorDroppedCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (connection dropped)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'dropped', message: 'Connection dropped. Check your network.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderErrorExpiredCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (code expired)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'expired', message: 'Pairing code expired — generate a new one.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderErrorVersionCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · error (version mismatch)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open}
        transfer={{ role: 'sender', phase: 'error', error: { kind: 'version-mismatch', message: 'Incompatible version — the other device needs to update Jackdaw.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

// ── Receiver state cards ───────────────────────────────────────────────────────

function ReceiverIdleCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · idle (enter code)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'idle' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverManifestCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · manifest (accept?)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'manifest' }}
        manifest={MANIFEST} peerName="Alice"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverConnectingCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · connecting">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'connecting' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverTransferringCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · receiving 40%">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'transferring', progress: 0.4 }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverConfirmCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · confirm (apply?)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'confirm' }}
        manifest={MANIFEST} peerName="Alice"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverAppliedCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · applied">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'applied' }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverErrorCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · error (transfer failed)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open}
        transfer={{ role: 'receiver', phase: 'error', error: { kind: 'failed', message: 'Transfer failed. Try again.' } }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

// ── Transparent-receive state cards ─────────────────────────────────────────────

function SenderLinkCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · link + QR">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'code' }}
        manifest={MANIFEST} code="7-tuna-zebra-piano" link={LINK}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function SenderSetPasswordCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="sender · set password (toggle)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Send Take…</button>
      <Share open={open} transfer={{ role: 'sender', phase: 'code' }}
        manifest={MANIFEST} code="7-tuna-zebra-piano" link={LINK}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP} onSetPassword={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverIncomingCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · incoming manifest">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'manifest' }}
        incoming={INCOMING} peerName="Alice"
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverImportFirstCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · import-first (missing song)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'import-first' }}
        incoming={{ ...INCOMING, needsImport: true }}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP} onImport={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverImportBusyCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · importing…">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'import-first' }}
        incoming={{ ...INCOMING, needsImport: true }} importBusy
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP} onImport={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverPasswordCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · enter password">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'password' }}
        incoming={INCOMING}
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP} onSubmitPassword={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

function ReceiverPasswordErrorCard() {
  const [open, setOpen] = useState(false)
  return (
    <State label="receiver · wrong password">
      <button style={TRIGGER} onClick={() => setOpen(true)}>Receive Take…</button>
      <Share open={open} transfer={{ role: 'receiver', phase: 'password' }}
        incoming={INCOMING} passwordError="Wrong password — try again."
        onGenerateCode={NOOP} onSend={NOOP} onEnterCode={NOOP} onSubmitPassword={NOOP}
        onAccept={NOOP} onCancel={() => setOpen(false)} onRetry={NOOP} />
    </State>
  )
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      {/* Sender flow: idle → manifest → code → connecting → transferring → success + errors */}
      <SenderIdleCard />
      <SenderManifestCard />
      <SenderCodeCard />
      <SenderConnectingCard />
      <SenderTransferringCard />
      <SenderSuccessCard />
      <SenderErrorDroppedCard />
      <SenderErrorExpiredCard />
      <SenderErrorVersionCard />
      {/* Receiver flow: idle → manifest → connecting → transferring → confirm → applied + error */}
      <ReceiverIdleCard />
      <ReceiverManifestCard />
      <ReceiverConnectingCard />
      <ReceiverTransferringCard />
      <ReceiverConfirmCard />
      <ReceiverAppliedCard />
      <ReceiverErrorCard />
      {/* Transparent receive: link/QR + password (set) · incoming → import-first / password → apply */}
      <SenderLinkCard />
      <SenderSetPasswordCard />
      <ReceiverIncomingCard />
      <ReceiverImportFirstCard />
      <ReceiverImportBusyCard />
      <ReceiverPasswordCard />
      <ReceiverPasswordErrorCard />
    </StatesGrid>
  )
}

// ── Playground — dogfoods Toggle for all controls ──────────────────────────────

const SENDER_PHASES: TransferPhase[]   = ['idle', 'manifest', 'code', 'connecting', 'transferring', 'success', 'error']
const RECEIVER_PHASES: TransferPhase[] = ['idle', 'manifest', 'import-first', 'password', 'connecting', 'transferring', 'confirm', 'applied', 'error']
const ERROR_KINDS: ErrorKind[] = ['expired', 'no-peer', 'dropped', 'failed', 'version-mismatch']

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  'expired':          'Pairing code expired — generate a new one.',
  'no-peer':          'No peer connected. Share the code and try again.',
  'dropped':          'Connection dropped. Check your network.',
  'failed':           'Transfer failed. Try again.',
  'version-mismatch': 'Incompatible version — the other device needs to update Jackdaw.',
}

function PlaygroundDemo() {
  const [open,      setOpen]     = useState(false)
  const [role,      setRole]     = useState<TransferRole>('sender')
  const [phase,     setPhase]    = useState<TransferPhase>('manifest')
  const [progress,  setProgress] = useState(0.45)
  const [errorKind, setErrKind]  = useState<ErrorKind>('failed')

  const phases = role === 'sender' ? SENDER_PHASES : RECEIVER_PHASES

  const transfer = {
    role,
    phase,
    progress,
    error: phase === 'error'
      ? { kind: errorKind, message: ERROR_MESSAGES[errorKind] }
      : undefined,
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={() => setOpen(true)}>Open…</button>

        <Share
          open={open}
          transfer={transfer}
          manifest={MANIFEST}
          incoming={INCOMING}
          code="7-tuna-zebra-piano"
          link={LINK}
          peerName="Alice"
          passwordError={phase === 'password' ? 'Wrong password — try again.' : undefined}
          onGenerateCode={NOOP}
          onSend={NOOP}
          onEnterCode={NOOP}
          onAccept={NOOP}
          onCancel={() => setOpen(false)}
          onRetry={NOOP}
          onSetPassword={NOOP}
          onSubmitPassword={NOOP}
          onImport={NOOP}
        />

        {/* Controls — dogfood Toggle for every knob */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 160 }}>
          {/* Role */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              role
            </span>
            <Toggle
              checked={role === 'receiver'}
              onChange={(v) => {
                setRole(v ? 'receiver' : 'sender')
                setPhase(v ? 'idle' : 'manifest')
              }}
              size="sm"
              label="receiver"
            />
          </div>

          {/* Phase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              phase
            </span>
            {phases.map(p => (
              <Toggle key={p} checked={phase === p} onChange={() => setPhase(p)} size="sm" label={p} />
            ))}
          </div>

          {/* Error kind (only when phase=error) */}
          {phase === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                error kind
              </span>
              {ERROR_KINDS.map(k => (
                <Toggle key={k} checked={errorKind === k} onChange={() => setErrKind(k)} size="sm" label={k} />
              ))}
            </div>
          )}

          {/* Progress slider (only when phase=transferring) */}
          {phase === 'transferring' && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              <span>progress ({Math.round(progress * 100)}%)</span>
              <input
                type="range" min={0} max={1} step={0.01}
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
              />
            </label>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function ShareDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
