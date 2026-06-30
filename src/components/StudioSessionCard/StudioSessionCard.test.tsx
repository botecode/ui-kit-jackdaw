// src/components/StudioSessionCard/StudioSessionCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  StudioSessionCard,
  sessionMode,
  trackCountLabel,
  ctaLabel,
  laneColor,
  visibleLanes,
} from './StudioSessionCard'

// ─── Pure helpers ────────────────────────────────────────────────────────────

describe('sessionMode', () => {
  it('a song with a session → "session" (regardless of import origin)', () => {
    expect(sessionMode(true, false)).toBe('session')
    expect(sessionMode(true, true)).toBe('session')
  })
  it('no session but imported from a master → "imported"', () => {
    expect(sessionMode(false, true)).toBe('imported')
  })
  it('no session and not imported → "new"', () => {
    expect(sessionMode(false, false)).toBe('new')
  })
})

describe('trackCountLabel', () => {
  it('zero → "No tracks"', () => {
    expect(trackCountLabel(0)).toBe('No tracks')
  })
  it('one → singular', () => {
    expect(trackCountLabel(1)).toBe('1 track')
  })
  it('many → plural', () => {
    expect(trackCountLabel(7)).toBe('7 tracks')
  })
  it('a negative/garbage count clamps to "No tracks"', () => {
    expect(trackCountLabel(-3)).toBe('No tracks')
  })
})

describe('ctaLabel', () => {
  it('idle → "Open studio"', () => {
    expect(ctaLabel(false)).toBe('Open studio')
  })
  it('opening → "Opening…"', () => {
    expect(ctaLabel(true)).toBe('Opening…')
  })
})

describe('laneColor', () => {
  it('maps index to the cyclic track-colour spine (1-indexed token)', () => {
    expect(laneColor(0)).toBe('var(--track-color-1)')
    expect(laneColor(5)).toBe('var(--track-color-6)')
  })
  it('wraps past the 6-colour ramp', () => {
    expect(laneColor(6)).toBe('var(--track-color-1)')
    expect(laneColor(7)).toBe('var(--track-color-2)')
  })
})

describe('visibleLanes', () => {
  it('shows every lane when under the cap', () => {
    expect(visibleLanes(3, 6)).toEqual({ lanes: 3, overflow: 0 })
  })
  it('caps the lanes and reports the overflow', () => {
    expect(visibleLanes(9, 6)).toEqual({ lanes: 6, overflow: 3 })
  })
  it('never goes negative', () => {
    expect(visibleLanes(0, 6)).toEqual({ lanes: 0, overflow: 0 })
    expect(visibleLanes(-2, 6)).toEqual({ lanes: 0, overflow: 0 })
  })
})

// ─── has-session ───────────────────────────────────────────────────────────────

describe('StudioSessionCard — has-session', () => {
  it('reads the eyebrow plate "SESSION"', () => {
    render(<StudioSessionCard hasSession trackCount={3} importedFromMaster={false} onOpenStudio={() => {}} />)
    expect(screen.getByText('SESSION')).toBeInTheDocument()
  })

  it('shows the real track count at a glance', () => {
    const { container } = render(
      <StudioSessionCard hasSession trackCount={4} importedFromMaster={false} onOpenStudio={() => {}} />,
    )
    expect(container).toHaveTextContent('4')
    expect(screen.getByText('4 tracks')).toBeInTheDocument()
  })

  it('renders one lane pill per track (capped) reflecting the count', () => {
    const { container } = render(
      <StudioSessionCard hasSession trackCount={5} importedFromMaster={false} onOpenStudio={() => {}} />,
    )
    expect(container.querySelectorAll('[data-lane]')).toHaveLength(5)
  })

  it('shows lastEdited when provided', () => {
    render(
      <StudioSessionCard
        hasSession
        trackCount={3}
        importedFromMaster={false}
        lastEdited="2 hours ago"
        onOpenStudio={() => {}}
      />,
    )
    expect(screen.getByText('2 hours ago')).toBeInTheDocument()
  })

  it('reflects data-mode="session"', () => {
    const { container } = render(
      <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} onOpenStudio={() => {}} />,
    )
    expect(container.querySelector('[data-mode="session"]')).toBeInTheDocument()
  })
})

// ─── imported / no session ───────────────────────────────────────────────────────

describe('StudioSessionCard — imported / no session', () => {
  it('reflects data-mode="imported" and prompts to start a session from the master', () => {
    const { container } = render(
      <StudioSessionCard hasSession={false} trackCount={0} importedFromMaster onOpenStudio={() => {}} />,
    )
    expect(container.querySelector('[data-mode="imported"]')).toBeInTheDocument()
    expect(screen.getByText(/start a session from this master/i)).toBeInTheDocument()
  })

  it('a fresh song with no session reflects data-mode="new"', () => {
    const { container } = render(
      <StudioSessionCard hasSession={false} trackCount={0} importedFromMaster={false} onOpenStudio={() => {}} />,
    )
    expect(container.querySelector('[data-mode="new"]')).toBeInTheDocument()
  })

  it('does not render lane pills when there is no session', () => {
    const { container } = render(
      <StudioSessionCard hasSession={false} trackCount={0} importedFromMaster onOpenStudio={() => {}} />,
    )
    expect(container.querySelectorAll('[data-lane]')).toHaveLength(0)
  })
})

// ─── the hero CTA ────────────────────────────────────────────────────────────────

describe('StudioSessionCard — Open studio CTA', () => {
  it('fires onOpenStudio when clicked', () => {
    const onOpen = vi.fn()
    render(<StudioSessionCard hasSession trackCount={3} importedFromMaster={false} onOpenStudio={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /open studio/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('relabels to "Opening…" and goes busy + disabled while opening', () => {
    render(
      <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} isOpening onOpenStudio={() => {}} />,
    )
    const cta = screen.getByRole('button', { name: /opening/i })
    expect(cta).toBeDisabled()
    expect(cta).toHaveAttribute('aria-busy', 'true')
  })

  it('does not fire onOpenStudio while opening', () => {
    const onOpen = vi.fn()
    render(
      <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} isOpening onOpenStudio={onOpen} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /opening/i }))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('uses no aria-pressed — it is an action button (relabel pattern)', () => {
    render(<StudioSessionCard hasSession trackCount={3} importedFromMaster={false} onOpenStudio={() => {}} />)
    expect(screen.getByRole('button', { name: /open studio/i })).not.toHaveAttribute('aria-pressed')
  })
})

// ─── size axis ──────────────────────────────────────────────────────────────────

describe('StudioSessionCard — size', () => {
  it('defaults to md', () => {
    const { container } = render(
      <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} onOpenStudio={() => {}} />,
    )
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })
  it('reflects sm', () => {
    const { container } = render(
      <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} size="sm" onOpenStudio={() => {}} />,
    )
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})
