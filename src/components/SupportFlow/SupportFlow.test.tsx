// src/components/SupportFlow/SupportFlow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SupportFlow } from './SupportFlow'

const BASE = {
  phase: 'countdown' as const,
  remainingSeconds: 90,
  onDefer: vi.fn(),
  onDonate: vi.fn(),
  onContinueFree: vi.fn(),
}

beforeEach(() => { vi.clearAllMocks() })

// ── Countdown ─────────────────────────────────────────────────────────────────

describe('SupportFlow — countdown', () => {
  it('renders the badge with formatted time', () => {
    render(<SupportFlow {...BASE} remainingSeconds={90} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()
  })

  it('formats single-digit seconds with leading zero', () => {
    render(<SupportFlow {...BASE} remainingSeconds={65} />)
    expect(screen.getByText('1:05')).toBeInTheDocument()
  })

  it('does NOT show the defer button when >60 s remain', () => {
    render(<SupportFlow {...BASE} remainingSeconds={90} />)
    expect(screen.queryByTestId('defer-btn')).not.toBeInTheDocument()
  })

  it('shows the defer button when ≤60 s remain', () => {
    render(<SupportFlow {...BASE} remainingSeconds={60} />)
    expect(screen.getByTestId('defer-btn')).toBeInTheDocument()
  })

  it('shows the defer button at 0 s', () => {
    render(<SupportFlow {...BASE} remainingSeconds={0} />)
    expect(screen.getByTestId('defer-btn')).toBeInTheDocument()
  })

  it('defer button calls onDefer', () => {
    const onDefer = vi.fn()
    render(<SupportFlow {...BASE} remainingSeconds={30} onDefer={onDefer} />)
    fireEvent.click(screen.getByTestId('defer-btn'))
    expect(onDefer).toHaveBeenCalledTimes(1)
  })

  it('does not render the dialog when phase=countdown', () => {
    render(<SupportFlow {...BASE} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ── Dialog ────────────────────────────────────────────────────────────────────

describe('SupportFlow — dialog', () => {
  const DIALOG = { ...BASE, phase: 'dialog' as const, remainingSeconds: 0 }

  it('renders the dialog when phase=dialog', () => {
    render(<SupportFlow {...DIALOG} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render the countdown badge when phase=dialog', () => {
    render(<SupportFlow {...DIALOG} />)
    // badge is only rendered in countdown phase
    expect(screen.queryByText('0:00')).not.toBeInTheDocument()
  })

  it('shows "free" in the amount display when slider is at $0', () => {
    render(<SupportFlow {...DIALOG} />)
    expect(screen.getByTestId('amount-display')).toHaveTextContent('free')
  })

  it('continue-free button is always present', () => {
    render(<SupportFlow {...DIALOG} />)
    expect(screen.getByTestId('continue-free')).toBeInTheDocument()
  })

  it('continue-free calls onContinueFree', () => {
    const onContinueFree = vi.fn()
    render(<SupportFlow {...DIALOG} onContinueFree={onContinueFree} />)
    fireEvent.click(screen.getByTestId('continue-free'))
    expect(onContinueFree).toHaveBeenCalledTimes(1)
  })

  it('donate button does NOT call onDonate when amount is $0', () => {
    const onDonate = vi.fn()
    render(<SupportFlow {...DIALOG} onDonate={onDonate} />)
    fireEvent.click(screen.getByTestId('donate-btn'))
    expect(onDonate).not.toHaveBeenCalled()
  })

  it('donate button calls onDonate with the chosen amount when slider >$0', () => {
    const onDonate = vi.fn()
    render(<SupportFlow {...DIALOG} onDonate={onDonate} />)
    const slider = screen.getByRole('slider', { name: 'Donation amount' })
    // ArrowRight increments by step=100 cents ($1)
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    fireEvent.click(screen.getByTestId('donate-btn'))
    expect(onDonate).toHaveBeenCalledTimes(1)
    expect(onDonate.mock.calls[0][0]).toBeGreaterThan(0)
  })

  it('amount display updates when slider moves to max', () => {
    render(<SupportFlow {...DIALOG} />)
    const slider = screen.getByRole('slider', { name: 'Donation amount' })
    fireEvent.keyDown(slider, { key: 'End' })
    expect(screen.getByTestId('amount-display')).toHaveTextContent('$25')
  })

  it('Esc key calls onContinueFree (Dialog onClose passthrough)', () => {
    const onContinueFree = vi.fn()
    render(<SupportFlow {...DIALOG} onContinueFree={onContinueFree} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onContinueFree).toHaveBeenCalledTimes(1)
  })
})

// ── Thank-you ─────────────────────────────────────────────────────────────────

describe('SupportFlow — thankyou', () => {
  const TY = { ...BASE, phase: 'thankyou' as const, remainingSeconds: 0 }

  it('renders thank-you content when phase=thankyou', () => {
    render(<SupportFlow {...TY} />)
    expect(screen.getByTestId('thankyou')).toBeInTheDocument()
  })

  it('"Keep going" calls onContinueFree', () => {
    const onContinueFree = vi.fn()
    render(<SupportFlow {...TY} onContinueFree={onContinueFree} />)
    fireEvent.click(screen.getByText('Keep going'))
    expect(onContinueFree).toHaveBeenCalledTimes(1)
  })

  it('does not show the donation slider in thankyou state', () => {
    render(<SupportFlow {...TY} />)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })
})

// ── Dismissed ─────────────────────────────────────────────────────────────────

describe('SupportFlow — dismissed', () => {
  it('renders nothing when phase=dismissed', () => {
    const { container } = render(
      <SupportFlow {...BASE} phase="dismissed" remainingSeconds={0} />,
    )
    expect(container.firstChild).toBeNull()
  })
})
