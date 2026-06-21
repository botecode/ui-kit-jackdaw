// src/components/ExportDialog/ExportDialog.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportDialog } from './ExportDialog'
import type { ExportDialogProps } from './ExportDialog'

const BASE: ExportDialogProps = {
  open: true,
  mode: 'master',
  format: { bitDepth: 24, sampleRate: 48000 },
  filename: 'My Song',
  status: 'idle',
  onModeChange: vi.fn(),
  onFormatChange: vi.fn(),
  onFilenameChange: vi.fn(),
  onRender: vi.fn(),
  onReveal: vi.fn(),
  onCancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering per status ──────────────────────────────────────────────────────

describe('ExportDialog — rendering', () => {
  it('renders nothing when open=false', () => {
    render(<ExportDialog {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog when open=true', () => {
    render(<ExportDialog {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('idle: shows "Export" title', () => {
    render(<ExportDialog {...BASE} status="idle" />)
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('rendering: shows "Rendering…" title', () => {
    render(<ExportDialog {...BASE} status="rendering" />)
    expect(screen.getByText('Rendering…')).toBeInTheDocument()
  })

  it('done: shows "Export complete" title', () => {
    render(<ExportDialog {...BASE} status="done" />)
    expect(screen.getByText('Export complete')).toBeInTheDocument()
  })

  it('error: shows "Export failed" title', () => {
    render(<ExportDialog {...BASE} status="error" />)
    expect(screen.getByText('Export failed')).toBeInTheDocument()
  })

  it('idle: renders mode segmented control', () => {
    render(<ExportDialog {...BASE} status="idle" />)
    expect(screen.getByRole('radiogroup', { name: 'Export mode' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Master' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Stems' })).toBeInTheDocument()
  })

  it('idle: Master option is checked when mode=master', () => {
    render(<ExportDialog {...BASE} mode="master" />)
    expect(screen.getByRole('radio', { name: 'Master' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Stems' })).toHaveAttribute('aria-checked', 'false')
  })

  it('idle: Stems option is checked when mode=stems', () => {
    render(<ExportDialog {...BASE} mode="stems" />)
    expect(screen.getByRole('radio', { name: 'Stems' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Master' })).toHaveAttribute('aria-checked', 'false')
  })

  it('idle: renders Render and Cancel buttons', () => {
    render(<ExportDialog {...BASE} status="idle" />)
    expect(screen.getByRole('button', { name: 'Render' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('rendering: renders progress bar', () => {
    render(<ExportDialog {...BASE} status="rendering" progress={0.5} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('rendering: renders Cancel button (not Render)', () => {
    render(<ExportDialog {...BASE} status="rendering" />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Render' })).not.toBeInTheDocument()
  })

  it('done: renders Reveal in Finder button', () => {
    render(<ExportDialog {...BASE} status="done" />)
    expect(screen.getByRole('button', { name: 'Reveal in Finder' })).toBeInTheDocument()
  })

  it('error: renders Retry button', () => {
    render(<ExportDialog {...BASE} status="error" />)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('error: renders default error message', () => {
    render(<ExportDialog {...BASE} status="error" />)
    expect(screen.getByText(/The export failed/)).toBeInTheDocument()
  })

  it('error: renders custom errorMessage', () => {
    render(<ExportDialog {...BASE} status="error" errorMessage="Disk full." />)
    expect(screen.getByText('Disk full.')).toBeInTheDocument()
  })
})

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('ExportDialog — callbacks', () => {
  it('Render button calls onRender', () => {
    const onRender = vi.fn()
    render(<ExportDialog {...BASE} status="idle" onRender={onRender} />)
    fireEvent.click(screen.getByRole('button', { name: 'Render' }))
    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('Close button calls onCancel in idle state', () => {
    const onCancel = vi.fn()
    render(<ExportDialog {...BASE} status="idle" onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Cancel button calls onCancel during rendering', () => {
    const onCancel = vi.fn()
    render(<ExportDialog {...BASE} status="rendering" onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Reveal in Finder button calls onReveal', () => {
    const onReveal = vi.fn()
    render(<ExportDialog {...BASE} status="done" onReveal={onReveal} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reveal in Finder' }))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it('Retry button calls onRender', () => {
    const onRender = vi.fn()
    render(<ExportDialog {...BASE} status="error" onRender={onRender} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRender).toHaveBeenCalledTimes(1)
  })

  it('clicking Master option calls onModeChange("master")', () => {
    const onModeChange = vi.fn()
    render(<ExportDialog {...BASE} mode="stems" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Master' }))
    expect(onModeChange).toHaveBeenCalledWith('master')
  })

  it('clicking Stems option calls onModeChange("stems")', () => {
    const onModeChange = vi.fn()
    render(<ExportDialog {...BASE} mode="master" onModeChange={onModeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Stems' }))
    expect(onModeChange).toHaveBeenCalledWith('stems')
  })

  it('Esc calls onCancel in idle state', () => {
    const onCancel = vi.fn()
    render(<ExportDialog {...BASE} status="idle" onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc calls onCancel during rendering', () => {
    const onCancel = vi.fn()
    render(<ExportDialog {...BASE} status="rendering" onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Segmented control keyboard navigation ─────────────────────────────────────

describe('ExportDialog — seg control keyboard', () => {
  it('ArrowRight moves from Master to Stems', () => {
    const onModeChange = vi.fn()
    render(<ExportDialog {...BASE} mode="master" onModeChange={onModeChange} />)
    const master = screen.getByRole('radio', { name: 'Master' })
    fireEvent.keyDown(master, { key: 'ArrowRight' })
    expect(onModeChange).toHaveBeenCalledWith('stems')
  })

  it('ArrowLeft wraps from Master to Stems', () => {
    const onModeChange = vi.fn()
    render(<ExportDialog {...BASE} mode="master" onModeChange={onModeChange} />)
    const master = screen.getByRole('radio', { name: 'Master' })
    fireEvent.keyDown(master, { key: 'ArrowLeft' })
    expect(onModeChange).toHaveBeenCalledWith('stems')
  })

  it('ArrowLeft moves from Stems to Master', () => {
    const onModeChange = vi.fn()
    render(<ExportDialog {...BASE} mode="stems" onModeChange={onModeChange} />)
    const stems = screen.getByRole('radio', { name: 'Stems' })
    fireEvent.keyDown(stems, { key: 'ArrowLeft' })
    expect(onModeChange).toHaveBeenCalledWith('master')
  })
})

// ── Progress value ────────────────────────────────────────────────────────────

describe('ExportDialog — progress', () => {
  it('passes aria-valuenow to progressbar when progress provided', () => {
    render(<ExportDialog {...BASE} status="rendering" progress={0.6} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60')
  })

  it('omits aria-valuenow when progress is undefined (indeterminate)', () => {
    render(<ExportDialog {...BASE} status="rendering" />)
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
  })
})

// ── ARIA ──────────────────────────────────────────────────────────────────────

describe('ExportDialog — ARIA', () => {
  it('dialog has role=dialog and aria-modal=true', () => {
    render(<ExportDialog {...BASE} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('done section has role=status for live announce', () => {
    render(<ExportDialog {...BASE} status="done" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('error section has role=alert for live announce', () => {
    render(<ExportDialog {...BASE} status="error" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
