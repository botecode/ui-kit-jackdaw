// src/components/ExportDialog/ExportDialog.demo.tsx
import { useState, useRef } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { ExportDialog } from './ExportDialog'
import type { ExportMode, ExportFormat, ExportStatus } from './ExportDialog'

export const meta: DemoMeta = {
  name: 'ExportDialog',
  group: 'Composites',
  route: '/export-dialog',
  order: 30,
}

// ── Shared trigger button style (kit tokens) ──────────────────────────────────

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
  lineHeight: 1,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
}

// ── Default format fixture ────────────────────────────────────────────────────

const DEFAULT_FORMAT: ExportFormat = { bitDepth: 24, sampleRate: 48000 }

// ── State cards ───────────────────────────────────────────────────────────────

function IdleMasterCard() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ExportMode>('master')
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_FORMAT)
  const [filename, setFilename] = useState('My Song')

  return (
    <State label="Idle — Master">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        Export…
      </button>
      <ExportDialog
        open={open}
        mode={mode}
        format={format}
        filename={filename}
        status="idle"
        onModeChange={setMode}
        onFormatChange={setFormat}
        onFilenameChange={setFilename}
        onRender={() => setOpen(false)}
        onReveal={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function IdleStemsCard() {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_FORMAT)
  const [filename, setFilename] = useState('My Song')

  return (
    <State label="Idle — Stems">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        Export stems…
      </button>
      <ExportDialog
        open={open}
        mode="stems"
        format={format}
        filename={filename}
        status="idle"
        onModeChange={() => {}}
        onFormatChange={setFormat}
        onFilenameChange={setFilename}
        onRender={() => setOpen(false)}
        onReveal={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function RenderingCard() {
  const [open, setOpen] = useState(false)

  return (
    <State label="Rendering (indeterminate)">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        See rendering…
      </button>
      <ExportDialog
        open={open}
        mode="master"
        format={DEFAULT_FORMAT}
        filename="My Song"
        status="rendering"
        onModeChange={() => {}}
        onFormatChange={() => {}}
        onFilenameChange={() => {}}
        onRender={() => {}}
        onReveal={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function RenderingProgressCard() {
  const [open, setOpen] = useState(false)

  return (
    <State label="Rendering 62%">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        See rendering 62%…
      </button>
      <ExportDialog
        open={open}
        mode="master"
        format={DEFAULT_FORMAT}
        filename="My Song"
        status="rendering"
        progress={0.62}
        onModeChange={() => {}}
        onFormatChange={() => {}}
        onFilenameChange={() => {}}
        onRender={() => {}}
        onReveal={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function DoneCard() {
  const [open, setOpen] = useState(false)

  return (
    <State label="Done">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        See done state…
      </button>
      <ExportDialog
        open={open}
        mode="master"
        format={DEFAULT_FORMAT}
        filename="My Song"
        status="done"
        onModeChange={() => {}}
        onFormatChange={() => {}}
        onFilenameChange={() => {}}
        onRender={() => {}}
        onReveal={() => { alert('Reveal in Finder') }}
        onShare={() => { alert('Share → macOS share sheet') }}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

function ErrorCard() {
  const [open, setOpen] = useState(false)

  return (
    <State label="Error">
      <button style={TRIGGER} onClick={() => setOpen(true)}>
        See error state…
      </button>
      <ExportDialog
        open={open}
        mode="master"
        format={DEFAULT_FORMAT}
        filename="My Song"
        status="error"
        errorMessage="Could not write to disk. Check available storage and try again."
        onModeChange={() => {}}
        onFormatChange={() => {}}
        onFilenameChange={() => {}}
        onRender={() => setOpen(false)}
        onReveal={() => {}}
        onCancel={() => setOpen(false)}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <IdleMasterCard />
      <IdleStemsCard />
      <RenderingCard />
      <RenderingProgressCard />
      <DoneCard />
      <ErrorCard />
    </StatesGrid>
  )
}

// ── Playground — full walkthrough ──────────────────────────────────────────────

function PlaygroundDemo() {
  const [open,       setOpen]       = useState(false)
  const [mode,       setMode]       = useState<ExportMode>('master')
  const [format,     setFormat]     = useState<ExportFormat>(DEFAULT_FORMAT)
  const [filename,   setFilename]   = useState('My Song')
  const [status,     setStatus]     = useState<ExportStatus>('idle')
  const [progress,   setProgress]   = useState<number | undefined>(undefined)
  const [errorMsg,   setErrorMsg]   = useState('')
  // Playground toggles
  const [stems,      setStems]      = useState(false)
  const [simError,   setSimError]   = useState(false)
  const [showPct,    setShowPct]    = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleRender() {
    setStatus('rendering')
    setProgress(showPct ? 0 : undefined)

    if (showPct) {
      let pct = 0
      timerRef.current = setInterval(() => {
        pct += 0.04
        if (pct >= 1) {
          clearInterval(timerRef.current!)
          setProgress(1)
          setTimeout(() => {
            if (simError) {
              setStatus('error')
              setErrorMsg('Simulated export failure.')
            } else {
              setStatus('done')
            }
          }, 300)
        } else {
          setProgress(pct)
        }
      }, 80)
    } else {
      // Indeterminate — resolve after 2s
      setTimeout(() => {
        if (simError) {
          setStatus('error')
          setErrorMsg('Simulated export failure.')
        } else {
          setStatus('done')
        }
      }, 2000)
    }
  }

  function handleCancel() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setOpen(false)
    setStatus('idle')
    setProgress(undefined)
  }

  function handleOpen() {
    setStatus('idle')
    setProgress(undefined)
    setMode(stems ? 'stems' : 'master')
    setOpen(true)
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button style={TRIGGER} onClick={handleOpen}>
          Export…
        </button>

        <ExportDialog
          open={open}
          mode={mode}
          format={format}
          filename={filename}
          status={status}
          progress={progress}
          errorMessage={errorMsg || undefined}
          onModeChange={setMode}
          onFormatChange={setFormat}
          onFilenameChange={setFilename}
          onRender={handleRender}
          onReveal={() => alert('Reveal in Finder')}
          onShare={() => alert('Share → macOS share sheet')}
          onCancel={handleCancel}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <Toggle checked={stems}    onChange={v => setStems(v)}    size="sm" label="start in stems mode" />
          <Toggle checked={showPct}  onChange={v => setShowPct(v)}  size="sm" label="determinate progress" />
          <Toggle checked={simError} onChange={v => setSimError(v)} size="sm" label="simulate error" />
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function ExportDialogDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
