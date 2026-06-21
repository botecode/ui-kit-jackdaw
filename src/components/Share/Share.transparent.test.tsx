// src/components/Share/Share.transparent.test.tsx
// Tests for the transparent-receive composition: link/QR, password (set + enter),
// import-first, and the IncomingManifest receive view. The legacy code/manifest
// flow lives in Share.test.tsx and stays the regression gate.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Share } from './Share'
import type { ShareProps, IncomingManifestData } from './Share'

const INCOMING: IncomingManifestData = {
  trackName:       'Lead Vocal',
  clipCount:       8,
  durationSeconds: 183,
  songName:        'Summer Drift',
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

const LINK = 'jackdaw://share/7-tuna-zebra-piano'

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Sender: link + QR ───────────────────────────────────────────────────────

describe('Share — sender link/QR', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'sender', phase: 'code' },
    code:     '7-tuna-zebra-piano',
    link:     LINK,
  }

  it('renders the share link when link is provided', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(LINK)).toBeInTheDocument()
  })

  it('renders a QR of the link', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('img', { name: /qr/i })).toBeInTheDocument()
  })

  it('does NOT render the bare code readout when link is provided', () => {
    render(<Share {...PROPS} />)
    // the bare-code hero is the exact "7-tuna-zebra-piano" text node
    expect(screen.queryByText('7-tuna-zebra-piano')).not.toBeInTheDocument()
  })

  it('falls back to the bare code readout when no link is provided', () => {
    render(<Share {...PROPS} link={undefined} />)
    expect(screen.getByText('7-tuna-zebra-piano')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /qr/i })).not.toBeInTheDocument()
  })
})

// ── Sender: set password ────────────────────────────────────────────────────

describe('Share — sender set password', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:      { role: 'sender', phase: 'code' },
    code:          '7-tuna-zebra-piano',
    link:          LINK,
    onSetPassword: vi.fn(),
  }

  it('shows a password-protect toggle when onSetPassword is provided', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByRole('switch', { name: /password/i })).toBeInTheDocument()
  })

  it('does NOT show the toggle when onSetPassword is absent', () => {
    render(<Share {...PROPS} onSetPassword={undefined} />)
    expect(screen.queryByRole('switch', { name: /password/i })).not.toBeInTheDocument()
  })

  it('reveals the password field after enabling the toggle', () => {
    render(<Share {...PROPS} />)
    expect(screen.queryByLabelText(/content password/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: /password/i }))
    expect(screen.getByLabelText(/content password/i)).toBeInTheDocument()
  })

  it('submitting the password calls onSetPassword', () => {
    const onSetPassword = vi.fn()
    render(<Share {...PROPS} onSetPassword={onSetPassword} />)
    fireEvent.click(screen.getByRole('switch', { name: /password/i }))
    fireEvent.change(screen.getByLabelText(/content password/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /set password/i }))
    expect(onSetPassword).toHaveBeenCalledWith('secret')
  })
})

// ── Receiver: import-first ──────────────────────────────────────────────────

describe('Share — receiver import-first', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer: { role: 'receiver', phase: 'import-first' },
    incoming: { ...INCOMING, needsImport: true },
    onImport: vi.fn(),
  }

  it('shows the import-first prompt naming the song', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByText(/you don't have summer drift/i)).toBeInTheDocument()
  })

  it('clicking Import calls onImport', () => {
    const onImport = vi.fn()
    render(<Share {...PROPS} onImport={onImport} />)
    fireEvent.click(screen.getByRole('button', { name: /^import/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('clicking the prompt Cancel calls onCancel', () => {
    const onCancel = vi.fn()
    render(<Share {...PROPS} onCancel={onCancel} />)
    const cancels = screen.getAllByRole('button', { name: /^cancel$/i })
    fireEvent.click(cancels[0])
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── Receiver: password (enter) ──────────────────────────────────────────────

describe('Share — receiver enter password', () => {
  const PROPS: ShareProps = {
    ...BASE,
    transfer:         { role: 'receiver', phase: 'password' },
    incoming:         INCOMING,
    onSubmitPassword: vi.fn(),
  }

  it('renders a masked password field', () => {
    render(<Share {...PROPS} />)
    expect(screen.getByLabelText(/content password/i)).toHaveAttribute('type', 'password')
  })

  it('submitting calls onSubmitPassword with the value', () => {
    const onSubmitPassword = vi.fn()
    render(<Share {...PROPS} onSubmitPassword={onSubmitPassword} />)
    fireEvent.change(screen.getByLabelText(/content password/i), { target: { value: 'letmein' } })
    fireEvent.click(screen.getByRole('button', { name: /unlock/i }))
    expect(onSubmitPassword).toHaveBeenCalledWith('letmein')
  })

  it('shows the wrong-password error', () => {
    render(<Share {...PROPS} passwordError="Wrong password — try again." />)
    expect(screen.getByRole('alert')).toHaveTextContent(/wrong password/i)
  })
})

// ── Receiver: incoming manifest view ────────────────────────────────────────

describe('Share — receiver incoming manifest', () => {
  it('renders the IncomingManifest (track name) when incoming is provided', () => {
    render(<Share {...BASE} transfer={{ role: 'receiver', phase: 'manifest' }} incoming={INCOMING} />)
    expect(screen.getByText('Lead Vocal')).toBeInTheDocument()
  })

  it('shows the clip count from the incoming manifest', () => {
    render(<Share {...BASE} transfer={{ role: 'receiver', phase: 'manifest' }} incoming={INCOMING} />)
    expect(screen.getByText('8 clips')).toBeInTheDocument()
  })

  it('still shows an Accept action', () => {
    render(<Share {...BASE} transfer={{ role: 'receiver', phase: 'manifest' }} incoming={INCOMING} />)
    expect(screen.getByRole('button', { name: /^accept$/i })).toBeInTheDocument()
  })
})
