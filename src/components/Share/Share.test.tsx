// src/components/Share/Share.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Share } from './Share'

const BASE = {
  open: true,
  scope: 'project' as const,
  status: 'idle' as const,
  onScopeChange: vi.fn(),
  onGenerate: vi.fn(),
  onCopy: vi.fn(),
  onCancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Idle state ────────────────────────────────────────────────────────────────

describe('Share — idle state', () => {
  it('renders a dialog when open=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('renders project title when scope=project', () => {
    render(<Share {...BASE} />)
    expect(screen.getByText('Send project')).toBeInTheDocument()
  })

  it('renders scope control group', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('group', { name: 'What to send' })).toBeInTheDocument()
  })

  it('renders Project and Track radio options', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('radio', { name: 'Project' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Track' })).toBeInTheDocument()
  })

  it('marks Project as checked when scope=project', () => {
    render(<Share {...BASE} scope="project" />)
    expect(screen.getByRole('radio', { name: 'Project' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Track' })).toHaveAttribute('aria-checked', 'false')
  })

  it('marks Track as checked when scope=track', () => {
    render(<Share {...BASE} scope="track" />)
    expect(screen.getByRole('radio', { name: 'Track' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Project' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking Track calls onScopeChange("track")', () => {
    const onScopeChange = vi.fn()
    render(<Share {...BASE} scope="project" onScopeChange={onScopeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Track' }))
    expect(onScopeChange).toHaveBeenCalledWith('track')
  })

  it('clicking Project calls onScopeChange("project")', () => {
    const onScopeChange = vi.fn()
    render(<Share {...BASE} scope="track" onScopeChange={onScopeChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Project' }))
    expect(onScopeChange).toHaveBeenCalledWith('project')
  })

  it('renders a Generate code button', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument()
  })

  it('clicking Generate code calls onGenerate', () => {
    const onGenerate = vi.fn()
    render(<Share {...BASE} onGenerate={onGenerate} />)
    fireEvent.click(screen.getByRole('button', { name: /generate code/i }))
    expect(onGenerate).toHaveBeenCalledTimes(1)
  })

  it('does NOT show code well when status=idle', () => {
    render(<Share {...BASE} code="MANGO-TIGER-7" />)
    expect(screen.queryByText('MANGO-TIGER-7')).not.toBeInTheDocument()
  })
})

// ── Generating state ──────────────────────────────────────────────────────────

describe('Share — generating state', () => {
  const GENERATING = { ...BASE, status: 'generating' as const }

  it('shows scope control (disabled)', () => {
    render(<Share {...GENERATING} />)
    const group = screen.getByRole('group', { name: 'What to send' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Project' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Track' })).toBeDisabled()
  })

  it('shows a status live region with generating text', () => {
    render(<Share {...GENERATING} />)
    expect(screen.getByRole('status')).toHaveTextContent(/generating/i)
  })

  it('does NOT show Generate code button', () => {
    render(<Share {...GENERATING} />)
    expect(screen.queryByRole('button', { name: /generate code/i })).not.toBeInTheDocument()
  })

  it('does NOT show the code well', () => {
    render(<Share {...GENERATING} code="MANGO-TIGER-7" />)
    expect(screen.queryByText('MANGO-TIGER-7')).not.toBeInTheDocument()
  })
})

// ── Waiting state ─────────────────────────────────────────────────────────────

describe('Share — waiting state', () => {
  const WAITING = { ...BASE, status: 'waiting' as const, code: 'MANGO-TIGER-7' }

  it('shows the share code', () => {
    render(<Share {...WAITING} />)
    expect(screen.getByText('MANGO-TIGER-7')).toBeInTheDocument()
  })

  it('shows a Copy code button', () => {
    render(<Share {...WAITING} />)
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })

  it('clicking Copy code calls onCopy', () => {
    const onCopy = vi.fn()
    render(<Share {...WAITING} onCopy={onCopy} />)
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    expect(onCopy).toHaveBeenCalledTimes(1)
  })

  it('shows "Waiting for peer" status', () => {
    render(<Share {...WAITING} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(el => el.textContent?.toLowerCase().includes('waiting'))).toBe(true)
  })

  it('does NOT show a progressbar', () => {
    render(<Share {...WAITING} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('does NOT show scope control', () => {
    render(<Share {...WAITING} />)
    expect(screen.queryByRole('group', { name: 'What to send' })).not.toBeInTheDocument()
  })
})

// ── Transferring state ────────────────────────────────────────────────────────

describe('Share — transferring state', () => {
  const TRANSFERRING = {
    ...BASE,
    status: 'transferring' as const,
    code: 'MANGO-TIGER-7',
    progress: 0.6,
  }

  it('renders a progressbar', () => {
    render(<Share {...TRANSFERRING} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar has correct aria-valuenow (60)', () => {
    render(<Share {...TRANSFERRING} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60')
  })

  it('progressbar has aria-valuemin=0 and aria-valuemax=100', () => {
    render(<Share {...TRANSFERRING} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('progress=0 → aria-valuenow=0', () => {
    render(<Share {...TRANSFERRING} progress={0} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('progress=1 → aria-valuenow=100', () => {
    render(<Share {...TRANSFERRING} progress={1} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps progress above 1 to 100', () => {
    render(<Share {...TRANSFERRING} progress={1.5} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps progress below 0 to 0', () => {
    render(<Share {...TRANSFERRING} progress={-0.5} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows the share code', () => {
    render(<Share {...TRANSFERRING} />)
    expect(screen.getByText('MANGO-TIGER-7')).toBeInTheDocument()
  })

  it('shows Copy code button', () => {
    render(<Share {...TRANSFERRING} />)
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument()
  })
})

// ── Done state ────────────────────────────────────────────────────────────────

describe('Share — done state', () => {
  const DONE = { ...BASE, status: 'done' as const, code: 'MANGO-TIGER-7' }

  it('shows the share code', () => {
    render(<Share {...DONE} />)
    expect(screen.getByText('MANGO-TIGER-7')).toBeInTheDocument()
  })

  it('shows "Transfer complete" in a status live region', () => {
    render(<Share {...DONE} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(el => /transfer complete/i.test(el.textContent ?? ''))).toBe(true)
  })

  it('Esc closes the dialog (dismissible=true in done state)', () => {
    const onCancel = vi.fn()
    render(<Share {...DONE} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does NOT show a progressbar', () => {
    render(<Share {...DONE} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

// ── Error state ───────────────────────────────────────────────────────────────

describe('Share — error state', () => {
  const ERROR = {
    ...BASE,
    status: 'error' as const,
    code: 'MANGO-TIGER-7',
    errorMessage: 'Peer disconnected.',
  }

  it('shows the error message in an alert role', () => {
    render(<Share {...ERROR} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Peer disconnected.')
  })

  it('falls back to default error text when errorMessage omitted', () => {
    render(<Share {...BASE} status="error" code="MANGO-TIGER-7" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert').textContent?.length).toBeGreaterThan(0)
  })

  it('Esc closes the dialog (dismissible=true in error state)', () => {
    const onCancel = vi.fn()
    render(<Share {...ERROR} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Dialog accessibility ──────────────────────────────────────────────────────

describe('Share — dialog accessibility', () => {
  it('renders nothing when open=false', () => {
    render(<Share {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dialog has aria-modal=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('Esc calls onCancel when idle (dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('renders "Send track" title when scope=track and no trackName', () => {
    render(<Share {...BASE} scope="track" />)
    expect(screen.getByText('Send track')).toBeInTheDocument()
  })

  it('renders track name in title when scope=track and trackName provided', () => {
    render(<Share {...BASE} scope="track" trackName="Drums" />)
    expect(screen.getByText('Send "Drums"')).toBeInTheDocument()
  })

  it('Cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Copied toast ──────────────────────────────────────────────────────────────

describe('Share — copied toast', () => {
  it('shows "Copied!" after clicking Copy code', () => {
    render(<Share {...BASE} status="waiting" code="MANGO-TIGER-7" />)
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(el => el.textContent?.includes('Copied'))).toBe(true)
  })

  it('"Copied!" is not visible before Copy is clicked', () => {
    render(<Share {...BASE} status="waiting" code="MANGO-TIGER-7" />)
    expect(screen.queryByText(/copied/i)).not.toBeInTheDocument()
  })
})
