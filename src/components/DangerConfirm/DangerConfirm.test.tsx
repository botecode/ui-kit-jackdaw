// src/components/DangerConfirm/DangerConfirm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DangerConfirm } from './DangerConfirm'

const BASE = {
  open: true as const,
  title: 'Delete song?',
  message: "This can't be undone — everything will be lost.",
  destructiveLabel: 'Delete song',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('DangerConfirm — rendering', () => {
  it('renders a dialog with the title and message when open', () => {
    render(<DangerConfirm {...BASE} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete song?')).toBeInTheDocument()
    expect(
      screen.getByText("This can't be undone — everything will be lost."),
    ).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<DangerConfirm {...BASE} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('labels the destructive button with destructiveLabel', () => {
    render(<DangerConfirm {...BASE} />)
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeInTheDocument()
  })

  it('renders a Cancel button', () => {
    render(<DangerConfirm {...BASE} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})

// ── Plain confirm (no phrase) ──────────────────────────────────────────────────

describe('DangerConfirm — plain confirm (no phrase)', () => {
  it('enables the destructive button immediately', () => {
    render(<DangerConfirm {...BASE} />)
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeEnabled()
  })

  it('does not render a confirm text field', () => {
    render(<DangerConfirm {...BASE} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('calls onConfirm when the destructive button is clicked', () => {
    render(<DangerConfirm {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete song' }))
    expect(BASE.onConfirm).toHaveBeenCalledTimes(1)
  })
})

// ── Type-to-confirm (phrase) ───────────────────────────────────────────────────

describe('DangerConfirm — type-to-confirm', () => {
  const PHRASE = 'delete My Song'

  it('renders a text field with an accessible name referencing the phrase', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    const field = screen.getByRole('textbox')
    expect(field).toHaveAccessibleName(`Type ${PHRASE} to confirm`)
  })

  it('shows the phrase in the visible instruction', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    // The phrase renders inside a <b> in the instruction line.
    const bold = screen.getByText(PHRASE, { selector: 'b' })
    expect(bold).toBeInTheDocument()
  })

  it('disables the destructive button until the phrase matches', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeDisabled()
  })

  it('keeps the button disabled while the typed value is a partial / wrong match', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'delete My' } })
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeDisabled()
  })

  it('stays disabled for a case-mismatched value (exact match required)', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'delete my song' } })
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeDisabled()
  })

  it('enables the button once the typed value exactly matches', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: PHRASE } })
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeEnabled()
  })

  it('calls onConfirm exactly once when confirming after an exact match', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: PHRASE } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete song' }))
    expect(BASE.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('confirms on Enter in the field when the phrase matches', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: PHRASE } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(BASE.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not confirm on Enter while the phrase does not match', () => {
    render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: 'nope' } })
    fireEvent.keyDown(field, { key: 'Enter' })
    expect(BASE.onConfirm).not.toHaveBeenCalled()
  })

  it('resets the typed value (and re-disables) when reopened', () => {
    const { rerender } = render(<DangerConfirm {...BASE} confirmPhrase={PHRASE} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: PHRASE } })
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeEnabled()

    rerender(<DangerConfirm {...BASE} confirmPhrase={PHRASE} open={false} />)
    rerender(<DangerConfirm {...BASE} confirmPhrase={PHRASE} open />)

    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Delete song' })).toBeDisabled()
  })
})

// ── Cancellation ───────────────────────────────────────────────────────────────

describe('DangerConfirm — cancellation', () => {
  it('calls onCancel when the Cancel button is clicked', () => {
    render(<DangerConfirm {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(BASE.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel on Escape', () => {
    render(<DangerConfirm {...BASE} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(BASE.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onConfirm when cancelling', () => {
    render(<DangerConfirm {...BASE} confirmPhrase="delete My Song" />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(BASE.onConfirm).not.toHaveBeenCalled()
  })
})
