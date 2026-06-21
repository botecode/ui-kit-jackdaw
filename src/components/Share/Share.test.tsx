// src/components/Share/Share.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Share } from './Share'
import type { ShareProps, TakeManifest } from './Share'

const MANIFEST: TakeManifest = {
  songName:        'Summer Drift',
  takeLabel:       'Main Mix',
  takeNumber:      3,
  durationSeconds: 183,
  trackCount:      8,
  sizeBytes:       32_400_000,
  hasLyrics:       true,
  hasChords:       false,
}

const BASE: ShareProps = {
  open:           true,
  transfer:       { role: 'sender', phase: 'idle' },
  onGenerateCode: vi.fn(),
  onSend:         vi.fn(),
  onEnterCode:    vi.fn(),
  onAccept:       vi.fn(),
  onCancel:       vi.fn(),
  onRetry:        vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Dialog open/close ─────────────────────────────────────────────────────────

describe('Share — dialog', () => {
  it('renders nothing when open=false', () => {
    render(<Share {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a dialog when open=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog has aria-modal=true', () => {
    render(<Share {...BASE} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('Close/Cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /close|cancel/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Esc calls onCancel when in idle phase (dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...BASE} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Sender: idle ──────────────────────────────────────────────────────────────

describe('Share — sender idle', () => {
  const PROPS: ShareProps = { ...BASE, transfer: { role: 'sender', phase: 'idle' } }

  it('shows "Send a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Send a Take')).toBeInTheDocument()
  })

  it('shows a preparing status indicator', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does NOT show manifest card when no manifest prop', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByText('Summer Drift')).not.toBeInTheDocument()
  })

  it('does NOT show manifest even when manifest prop present in idle phase', () => {
    render(<Share {...PROPS} manifest={MANIFEST} />)
    expect(screen.queryByText('Summer Drift')).not.toBeInTheDocument()
  })
})

// ── Sender: manifest ──────────────────────────────────────────────────────────

describe('Share — sender manifest', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'manifest' },
    manifest: MANIFEST,
  }

  it('shows "Send a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Send a Take')).toBeInTheDocument()
  })

  it('shows the manifest card with song name', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows take number in manifest', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('shows track count in manifest', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows Lyrics badge when hasLyrics=true', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
  })

  it('does NOT show Chords badge when hasChords=false', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByText('Chords')).not.toBeInTheDocument()
  })

  it('shows a Generate code button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument()
  })

  it('clicking Generate code calls onGenerateCode', () => {
    const onGenerateCode = vi.fn()
    render(<Share {...PROPS} onGenerateCode={onGenerateCode} />)
    fireEvent.click(screen.getByRole('button', { name: /generate code/i }))
    expect(onGenerateCode).toHaveBeenCalledTimes(1)
  })
})

// ── Sender: code ──────────────────────────────────────────────────────────────

describe('Share — sender code', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'code' },
    manifest: MANIFEST,
    code:     '7-tuna-zebra-piano',
  }

  it('shows the pairing code', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })

  it('shows the manifest card', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows a Copy code button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /copy.*code/i })).toBeInTheDocument()
  })

  it('shows waiting hint in a status region', () => {
    render(<Share {...PROPS} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(el => /waiting/i.test(el.textContent ?? ''))).toBe(true)
  })

  it('does NOT show Generate code button in code phase', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('button', { name: /generate code/i })).not.toBeInTheDocument()
  })

  it('does NOT show progressbar in code phase', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('Esc calls onCancel (Esc is always an escape hatch; backdrop click is blocked)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Sender: connecting ────────────────────────────────────────────────────────

describe('Share — sender connecting', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'connecting' },
    code:     '7-tuna-zebra-piano',
  }

  it('shows "Connecting…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('heading', { name: 'Connecting…' })).toBeInTheDocument()
  })

  it('shows the code readout', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })

  it('shows a status region for connecting', () => {
    render(<Share {...PROPS} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses.some(el => /connect/i.test(el.textContent ?? ''))).toBe(true)
  })

  it('does NOT show progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

// ── Sender: transferring ──────────────────────────────────────────────────────

describe('Share — sender transferring', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'transferring', progress: 0.65 },
    code:     '7-tuna-zebra-piano',
  }

  it('shows "Sending…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Sending…')).toBeInTheDocument()
  })

  it('shows a progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar aria-valuenow reflects progress (65)', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65')
  })

  it('progressbar has aria-valuemin=0 and aria-valuemax=100', () => {
    render(<Share {...PROPS} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('progressbar aria-label is "Send progress"', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Send progress')
  })

  it('clamps progress above 1 to 100', () => {
    render(<Share {...PROPS} transfer={{ role: 'sender', phase: 'transferring', progress: 1.5 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps progress below 0 to 0', () => {
    render(<Share {...PROPS} transfer={{ role: 'sender', phase: 'transferring', progress: -0.2 }} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('shows the code readout', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
  })
})

// ── Sender: success ───────────────────────────────────────────────────────────

describe('Share — sender success', () => {
  const PROPS: ShareProps = { ...BASE, transfer: { role: 'sender', phase: 'success' } }

  it('shows "Take Sent" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Take Sent')).toBeInTheDocument()
  })

  it('shows success status with sent text', () => {
    render(<Share {...PROPS} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/sent/i)
  })

  it('Esc closes (dismissible in success)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does NOT show progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})

// ── Sender: error states ──────────────────────────────────────────────────────

describe('Share — sender error', () => {
  function makeErrorProps(message: string): ShareProps {
    return { ...BASE, transfer: { role: 'sender', phase: 'error', error: { kind: 'failed', message } } }
  }

  it('shows error message in an alert region', () => {
    render(<Share {...makeErrorProps('Transfer failed.')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Transfer failed.')
  })

  it('shows "Send Failed" title', () => {
    render(<Share {...makeErrorProps('Failed.')} />)
    expect(screen.getByText('Send Failed')).toBeInTheDocument()
  })

  it('shows expired error message', () => {
    render(<Share {...BASE} transfer={{ role: 'sender', phase: 'error', error: { kind: 'expired', message: 'Pairing code expired — generate a new one.' } }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/expired/i)
  })

  it('shows no-peer error message', () => {
    render(<Share {...BASE} transfer={{ role: 'sender', phase: 'error', error: { kind: 'no-peer', message: 'No peer connected.' } }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/no peer/i)
  })

  it('shows dropped error message', () => {
    render(<Share {...BASE} transfer={{ role: 'sender', phase: 'error', error: { kind: 'dropped', message: 'Connection dropped.' } }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/dropped/i)
  })

  it('shows version-mismatch error message', () => {
    render(<Share {...BASE} transfer={{ role: 'sender', phase: 'error', error: { kind: 'version-mismatch', message: 'Incompatible version.' } }} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/version/i)
  })

  it('shows a Retry button', () => {
    render(<Share {...makeErrorProps('Failed.')} />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('clicking Retry calls onRetry', () => {
    const onRetry = vi.fn()
    render(<Share {...makeErrorProps('Failed.')} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('Esc closes in error state (dismissible)', () => {
    const onCancel = vi.fn()
    render(<Share {...makeErrorProps('Failed.')} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Receiver: idle ────────────────────────────────────────────────────────────

describe('Share — receiver idle', () => {
  const PROPS: ShareProps = { ...BASE, transfer: { role: 'receiver', phase: 'idle' } }

  it('shows "Receive a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive a Take')).toBeInTheDocument()
  })

  it('renders a code input field', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('textbox', { name: /pairing code/i })).toBeInTheDocument()
  })

  it('renders a Connect button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /^connect$/i })).toBeInTheDocument()
  })

  it('Connect button is disabled when code input is empty', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /^connect$/i })).toBeDisabled()
  })

  it('typing in the code field enables Connect', () => {
    render(<Share {...PROPS} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: '7-tuna-zebra-piano' } })
    expect(screen.getByRole('button', { name: /^connect$/i })).not.toBeDisabled()
  })

  it('clicking Connect calls onEnterCode with the trimmed code', () => {
    const onEnterCode = vi.fn()
    render(<Share {...PROPS} onEnterCode={onEnterCode} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: '7-tuna-zebra-piano' } })
    fireEvent.click(screen.getByRole('button', { name: /^connect$/i }))
    expect(onEnterCode).toHaveBeenCalledWith('7-tuna-zebra-piano')
  })

  it('pressing Enter in the code field calls onEnterCode', () => {
    const onEnterCode = vi.fn()
    render(<Share {...PROPS} onEnterCode={onEnterCode} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: 'cedar-wolf-3' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onEnterCode).toHaveBeenCalledWith('cedar-wolf-3')
  })

  it('does NOT call onEnterCode when input is whitespace only', () => {
    const onEnterCode = vi.fn()
    render(<Share {...PROPS} onEnterCode={onEnterCode} />)
    const input = screen.getByRole('textbox', { name: /pairing code/i })
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onEnterCode).not.toHaveBeenCalled()
  })

  it('Esc closes (dismissible in idle)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Receiver: manifest ────────────────────────────────────────────────────────

describe('Share — receiver manifest', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:  { role: 'receiver', phase: 'manifest' },
    manifest:  MANIFEST,
    peerName: 'Alice',
  }

  it('shows "Receive a Take" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive a Take')).toBeInTheDocument()
  })

  it('shows the manifest card', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('shows Accept button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument()
  })

  it('clicking Accept calls onAccept', () => {
    const onAccept = vi.fn()
    render(<Share {...PROPS} onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: /^accept$/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows Lyrics badge', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
  })
})

// ── Receiver: connecting ──────────────────────────────────────────────────────

describe('Share — receiver connecting', () => {
  const PROPS: ShareProps = { ...BASE, transfer: { role: 'receiver', phase: 'connecting' } }

  it('shows "Connecting…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('heading', { name: 'Connecting…' })).toBeInTheDocument()
  })

  it('shows a status region for connecting', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toHaveTextContent(/connect/i)
  })
})

// ── Receiver: transferring ────────────────────────────────────────────────────

describe('Share — receiver transferring', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'transferring', progress: 0.4 },
  }

  it('shows "Receiving…" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receiving…')).toBeInTheDocument()
  })

  it('shows a progressbar', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progressbar aria-valuenow reflects progress (40)', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
  })

  it('progressbar aria-label is "Receive progress"', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Receive progress')
  })

  it('does NOT show code entry in transferring phase', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

// ── Receiver: confirm ─────────────────────────────────────────────────────────

describe('Share — receiver confirm', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:  { role: 'receiver', phase: 'confirm' },
    manifest:  MANIFEST,
    peerName: 'Alice',
  }

  it('shows "Apply Take?" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Apply Take?')).toBeInTheDocument()
  })

  it('shows the confirm summary with take label', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/Main Mix/)).toBeInTheDocument()
  })

  it('shows the song name in the confirm summary', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/Summer Drift/)).toBeInTheDocument()
  })

  it('shows peer name in the confirm summary', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('shows an Apply button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /^apply$/i })).toBeInTheDocument()
  })

  it('clicking Apply calls onAccept', () => {
    const onAccept = vi.fn()
    render(<Share {...PROPS} onAccept={onAccept} />)
    fireEvent.click(screen.getByRole('button', { name: /^apply$/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows a Cancel button in the confirm body', () => {
    render(<Share {...PROPS} />)
    const buttons = screen.getAllByRole('button', { name: /cancel/i })
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('clicking the inline Cancel calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    const cancelBtns = screen.getAllByRole('button', { name: /cancel/i })
    fireEvent.click(cancelBtns[0])
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── Receiver: applied ─────────────────────────────────────────────────────────

describe('Share — receiver applied', () => {
  const PROPS: ShareProps = { ...BASE, transfer: { role: 'receiver', phase: 'applied' } }

  it('shows "Take Applied" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Take Applied')).toBeInTheDocument()
  })

  it('shows success status with applied text', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('status')).toHaveTextContent(/applied/i)
  })

  it('Esc closes (dismissible in applied)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Receiver: error ───────────────────────────────────────────────────────────

describe('Share — receiver error', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'error', error: { kind: 'failed', message: 'Receive failed.' } },
  }

  it('shows "Receive Failed" title', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText('Receive Failed')).toBeInTheDocument()
  })

  it('shows error message in alert', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Receive failed.')
  })

  it('shows Retry button', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('clicking Retry calls onRetry', () => {
    const onRetry = vi.fn()
    render(<Share {...PROPS} onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('Esc closes (dismissible in error)', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ── Manifest: badges and formatting ──────────────────────────────────────────

describe('Share — manifest formatting', () => {
  function withManifest(m: Partial<TakeManifest>): ShareProps {
    return {
      ...BASE,
      transfer: { role: 'sender', phase: 'manifest' },
      manifest: { ...MANIFEST, ...m },
    }
  }

  it('formats duration as mm:ss (3:03)', () => {
    render(<Share {...withManifest({ durationSeconds: 183 })} />)
    expect(screen.getByText('3:03')).toBeInTheDocument()
  })

  it('formats duration with zero-padded seconds (2:05)', () => {
    render(<Share {...withManifest({ durationSeconds: 125 })} />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })

  it('formats size in MB', () => {
    render(<Share {...withManifest({ sizeBytes: 5_200_000 })} />)
    expect(screen.getByText('5.2 MB')).toBeInTheDocument()
  })

  it('formats size in KB when < 1MB', () => {
    render(<Share {...withManifest({ sizeBytes: 340_000 })} />)
    expect(screen.getByText('340 KB')).toBeInTheDocument()
  })

  it('shows Chords badge when hasChords=true', () => {
    render(<Share {...withManifest({ hasChords: true })} />)
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('shows both Lyrics and Chords badges', () => {
    render(<Share {...withManifest({ hasLyrics: true, hasChords: true })} />)
    expect(screen.getByText('Lyrics')).toBeInTheDocument()
    expect(screen.getByText('Chords')).toBeInTheDocument()
  })

  it('shows NO badges when hasLyrics=false and hasChords=false', () => {
    render(<Share {...withManifest({ hasLyrics: false, hasChords: false })} />)
    expect(screen.queryByText('Lyrics')).not.toBeInTheDocument()
    expect(screen.queryByText('Chords')).not.toBeInTheDocument()
  })

  it('shows take label when takeLabel provided', () => {
    render(<Share {...withManifest({ takeLabel: 'Main Mix' })} />)
    expect(screen.getByText(/Main Mix/)).toBeInTheDocument()
  })
})
