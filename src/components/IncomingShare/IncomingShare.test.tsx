// src/components/IncomingShare/IncomingShare.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IncomingShare } from './IncomingShare'
import type { ShareManifest } from './IncomingShare'

const MANIFEST: ShareManifest = {
  senderName: 'Maya',
  origin: 'phone',
  items: [
    { id: 'v1', kind: 'voice-idea', name: 'Hook idea',    durationSec: 42, sizeBytes: 220_000 },
    { id: 'v2', kind: 'voice-idea', name: 'Verse melody', durationSec: 78, sizeBytes: 410_000 },
    { id: 'v3', kind: 'voice-idea', name: 'Bridge hum',   durationSec: 31, sizeBytes: 160_000 },
    { id: 'l1', kind: 'lyric',      name: 'Chorus draft', sizeBytes: 3_000 },
  ],
}

const noop = () => {}

function setup(props: Partial<React.ComponentProps<typeof IncomingShare>> = {}) {
  const onAccept = vi.fn()
  const onDecline = vi.fn()
  const utils = render(
    <IncomingShare manifest={MANIFEST} onAccept={onAccept} onDecline={onDecline} {...props} />,
  )
  return { onAccept, onDecline, ...utils }
}

describe('IncomingShare — header', () => {
  it('names who wants to share', () => {
    setup()
    expect(screen.getByText(/Maya wants to share with you/i)).toBeInTheDocument()
  })

  it('says it comes from a phone', () => {
    setup()
    expect(screen.getByText(/from their phone/i)).toBeInTheDocument()
  })

  it('says it comes from the desktop when origin is daw', () => {
    setup({ manifest: { ...MANIFEST, origin: 'daw' } })
    expect(screen.getByText(/from their (jackdaw|desktop)/i)).toBeInTheDocument()
  })

  it('labels the dialog by its title', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName(/Maya wants to share with you/i)
  })
})

describe('IncomingShare — manifest preview', () => {
  it('summarizes the bundle, pluralized', () => {
    setup()
    expect(screen.getByText(/3 voice ideas · 1 lyric/i)).toBeInTheDocument()
  })

  it('singularizes a one-of-each bundle', () => {
    setup({
      manifest: {
        ...MANIFEST,
        items: [
          { id: 'v1', kind: 'voice-idea', name: 'One idea', durationSec: 20, sizeBytes: 100_000 },
          { id: 'l1', kind: 'lyric', name: 'One lyric', sizeBytes: 2_000 },
        ],
      },
    })
    expect(screen.getByText(/1 voice idea · 1 lyric/i)).toBeInTheDocument()
  })

  it('omits a kind with zero items from the summary', () => {
    setup({
      manifest: {
        ...MANIFEST,
        items: [{ id: 'l1', kind: 'lyric', name: 'Only lyric', sizeBytes: 2_000 }],
      },
    })
    const summary = screen.getByText(/1 lyric/i)
    expect(summary.textContent).not.toMatch(/voice idea/i)
  })

  it('lists every item by name', () => {
    setup()
    expect(screen.getByText('Hook idea')).toBeInTheDocument()
    expect(screen.getByText('Verse melody')).toBeInTheDocument()
    expect(screen.getByText('Bridge hum')).toBeInTheDocument()
    expect(screen.getByText('Chorus draft')).toBeInTheDocument()
  })

  it('shows voice-idea duration as mm:ss', () => {
    setup()
    expect(screen.getByText('0:42')).toBeInTheDocument()
  })

  it('shows a human-readable size for each item', () => {
    setup()
    // 220_000 bytes → 220 KB
    expect(screen.getByText(/220 KB/)).toBeInTheDocument()
  })

  it('does not show a duration for a lyric item', () => {
    const { container } = setup()
    const lyricRow = container.querySelector('[data-kind="lyric"]')
    expect(lyricRow?.textContent).not.toMatch(/\d:\d\d/)
  })
})

describe('IncomingShare — actions (fireEvent)', () => {
  it('fires onAccept when Accept is clicked', () => {
    const { onAccept } = setup()
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('fires onDecline when Decline is clicked', () => {
    const { onDecline } = setup()
    fireEvent.click(screen.getByRole('button', { name: /decline/i }))
    expect(onDecline).toHaveBeenCalledTimes(1)
  })

  it('does not auto-write — neither intent fires on mount', () => {
    const { onAccept, onDecline } = setup()
    expect(onAccept).not.toHaveBeenCalled()
    expect(onDecline).not.toHaveBeenCalled()
  })

  it('uses the relabel pattern (no aria-pressed on the action buttons)', () => {
    setup()
    expect(screen.getByRole('button', { name: /accept/i })).not.toHaveAttribute('aria-pressed')
    expect(screen.getByRole('button', { name: /decline/i })).not.toHaveAttribute('aria-pressed')
  })
})

describe('IncomingShare — accepting', () => {
  it('announces the transfer is starting', () => {
    setup({ status: 'accepting' })
    expect(screen.getByText(/starting transfer/i)).toBeInTheDocument()
  })

  it('disables the actions while accepting', () => {
    setup({ status: 'accepting' })
    expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled()
  })

  it('does not fire onAccept again from the disabled button', () => {
    const { onAccept } = setup({ status: 'accepting' })
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(onAccept).not.toHaveBeenCalled()
  })
})

describe('IncomingShare — declined', () => {
  it('shows a calm "nothing was saved" terminal message', () => {
    setup({ status: 'declined' })
    expect(screen.getByText(/nothing was saved/i)).toBeInTheDocument()
  })

  it('is calm — not an alert', () => {
    setup({ status: 'declined' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not show the manifest preview', () => {
    setup({ status: 'declined' })
    expect(screen.queryByText('Hook idea')).not.toBeInTheDocument()
  })

  it('dismisses via onDismiss (falling back to onDecline)', () => {
    const { onDecline } = setup({ status: 'declined' })
    fireEvent.click(screen.getByRole('button', { name: /dismiss|done|close/i }))
    expect(onDecline).toHaveBeenCalledTimes(1)
  })

  it('prefers onDismiss when provided', () => {
    const onDismiss = vi.fn()
    const onDecline = vi.fn()
    render(
      <IncomingShare manifest={MANIFEST} status="declined" onAccept={noop} onDecline={onDecline} onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss|done|close/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onDecline).not.toHaveBeenCalled()
  })
})

describe('IncomingShare — expired / invalid link', () => {
  it('shows a clear expired message', () => {
    setup({ status: 'expired' })
    expect(screen.getByText(/expired/i)).toBeInTheDocument()
  })

  it('shows a clear invalid message', () => {
    setup({ status: 'invalid' })
    expect(screen.getByText(/can.?t be opened/i)).toBeInTheDocument()
  })

  it('flags expired/invalid as an alert for assistive tech', () => {
    setup({ status: 'expired' })
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not show the manifest or Accept on an expired link', () => {
    setup({ status: 'expired' })
    expect(screen.queryByText('Hook idea')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
  })

  it('renders an invalid state even with no manifest', () => {
    render(<IncomingShare status="invalid" onAccept={noop} onDecline={noop} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('falls back to invalid when previewing with no manifest', () => {
    render(<IncomingShare onAccept={noop} onDecline={noop} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
  })
})

describe('IncomingShare — size', () => {
  it('exposes data-size=sm', () => {
    const { container } = setup({ size: 'sm' })
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('defaults to md', () => {
    const { container } = setup()
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('reflects status on a data attribute', () => {
    const { container } = setup({ status: 'accepting' })
    expect(container.querySelector('[data-status="accepting"]')).toBeInTheDocument()
  })
})
