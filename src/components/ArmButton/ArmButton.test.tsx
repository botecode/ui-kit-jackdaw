import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ArmButton } from './ArmButton'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('ArmButton rendering', () => {
  const noop = vi.fn()

  it('renders a button', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('aria-pressed="false" when armed=false', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('aria-pressed="true" when armed=true', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('default aria-label is "Arm for recording"', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('aria-label')).toBe('Arm for recording')
  })

  it('custom aria-label overrides default', () => {
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={noop} aria-label="Arm track" />,
    )
    expect(getByRole('button').getAttribute('aria-label')).toBe('Arm track')
  })

  it('has data-armed when armed=true', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-armed')
  })

  it('no data-armed when armed=false', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-armed')
  })

  it('has data-recording when recording=true', () => {
    const { getByRole } = render(<ArmButton armed recording onToggle={noop} />)
    expect(getByRole('button')).toHaveAttribute('data-recording')
  })

  it('no data-recording when recording=false', () => {
    const { getByRole } = render(<ArmButton armed recording={false} onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-recording')
  })

  it('no data-recording when recording omitted', () => {
    const { getByRole } = render(<ArmButton armed onToggle={noop} />)
    expect(getByRole('button')).not.toHaveAttribute('data-recording')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<ArmButton armed={false} onToggle={noop} />)
    expect(getByRole('button').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={noop} size="sm" />,
    )
    expect(getByRole('button').getAttribute('data-size')).toBe('sm')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('ArmButton interaction', () => {
  it('clicking fires onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(<ArmButton armed={false} onToggle={onToggle} />)
    fireEvent.click(getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('disabled: clicking does not fire onToggle', () => {
    const onToggle = vi.fn()
    const { getByRole } = render(
      <ArmButton armed={false} onToggle={onToggle} disabled />,
    )
    fireEvent.click(getByRole('button'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})
