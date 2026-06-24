import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { RecordModeCalm } from './RecordMode.calm'

const noop = () => {}

describe('RecordModeCalm', () => {
  it('reflects state: label + aria-pressed + data-state', () => {
    const { rerender } = render(
      <RecordModeCalm state="idle" mode="normal" onToggleRecord={noop} onSelectMode={noop} />,
    )
    const recBtn = screen.getByRole('button', { name: 'Record' })
    expect(recBtn).toHaveAttribute('aria-pressed', 'false')
    expect(recBtn).toHaveAttribute('data-state', 'idle')

    rerender(<RecordModeCalm state="recording" mode="normal" onToggleRecord={noop} onSelectMode={noop} />)
    const live = screen.getByRole('button', { name: 'Recording' })
    expect(live).toHaveAttribute('aria-pressed', 'true')
    expect(live).toHaveAttribute('data-state', 'recording')
  })

  it('shows the loop-punch badge only in loop-punch mode', () => {
    const { queryByTestId, rerender } = render(
      <RecordModeCalm state="armed" mode="normal" onToggleRecord={noop} onSelectMode={noop} />,
    )
    expect(queryByTestId('record-loop-badge')).not.toBeInTheDocument()
    rerender(<RecordModeCalm state="armed" mode="loop-punch" onToggleRecord={noop} onSelectMode={noop} />)
    expect(queryByTestId('record-loop-badge')).toBeInTheDocument()
  })

  it('opens the mode menu (paper surface) and selects a mode', () => {
    const onSelectMode = vi.fn()
    render(<RecordModeCalm state="idle" mode="normal" onToggleRecord={noop} onSelectMode={onSelectMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record mode' }))
    expect(screen.getByRole('menu', { name: 'Record mode' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Loop / punch' }))
    expect(onSelectMode).toHaveBeenCalledWith('loop-punch')
  })
})
