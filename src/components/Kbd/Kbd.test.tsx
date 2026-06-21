// src/components/Kbd/Kbd.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Kbd } from './Kbd'

// ── Rendering ────────────────────────────────────────────────────────────────

describe('Kbd rendering', () => {
  it('renders a span with role="img"', () => {
    const { getByRole } = render(<Kbd keys={['C']} platform="mac" />)
    expect(getByRole('img')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<Kbd keys={['C']} platform="mac" />)
    expect(getByRole('img').getAttribute('data-size')).toBe('md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<Kbd keys={['C']} size="sm" platform="mac" />)
    expect(getByRole('img').getAttribute('data-size')).toBe('sm')
  })
})

// ── Mac glyph mapping ─────────────────────────────────────────────────────────

describe('Kbd mac glyphs', () => {
  it('Meta → ⌘ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Meta']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⌘')
  })

  it('Shift → ⇧ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Shift']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⇧')
  })

  it('Alt → ⌥ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Alt']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⌥')
  })

  it('Control → ⌃ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Control']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⌃')
  })

  it('Enter → ⏎ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Enter']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⏎')
  })

  it('Backspace → ⌫ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Backspace']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⌫')
  })

  it('Escape → ⎋ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Escape']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⎋')
  })

  it('Tab → ⇥ on mac', () => {
    const { getByRole } = render(<Kbd keys={['Tab']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('⇥')
  })

  it('ArrowUp → ↑ on mac', () => {
    const { getByRole } = render(<Kbd keys={['ArrowUp']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('↑')
  })

  it('single letter uppercased', () => {
    const { getByRole } = render(<Kbd keys={['c']} platform="mac" />)
    expect(getByRole('img').textContent).toBe('C')
  })
})

// ── Win text mapping ──────────────────────────────────────────────────────────

describe('Kbd win text', () => {
  it('Meta → Win on win', () => {
    const { getByRole } = render(<Kbd keys={['Meta']} platform="win" />)
    expect(getByRole('img').textContent).toBe('Win')
  })

  it('Shift → Shift on win', () => {
    const { getByRole } = render(<Kbd keys={['Shift']} platform="win" />)
    expect(getByRole('img').textContent).toBe('Shift')
  })

  it('Control → Ctrl on win', () => {
    const { getByRole } = render(<Kbd keys={['Control']} platform="win" />)
    expect(getByRole('img').textContent).toBe('Ctrl')
  })

  it('Escape → Esc on win', () => {
    const { getByRole } = render(<Kbd keys={['Escape']} platform="win" />)
    expect(getByRole('img').textContent).toBe('Esc')
  })

  it('Backspace → Bksp on win', () => {
    const { getByRole } = render(<Kbd keys={['Backspace']} platform="win" />)
    expect(getByRole('img').textContent).toBe('Bksp')
  })
})

// ── Combos ────────────────────────────────────────────────────────────────────

describe('Kbd combos', () => {
  it('2-key combo renders 2 kbd elements', () => {
    const { container } = render(<Kbd keys={['Meta', 'C']} platform="mac" />)
    expect(container.querySelectorAll('kbd').length).toBe(2)
  })

  it('3-key combo renders 3 kbd elements', () => {
    const { container } = render(<Kbd keys={['Meta', 'Shift', 'Z']} platform="mac" />)
    expect(container.querySelectorAll('kbd').length).toBe(3)
  })

  it('aria-label is spoken form joined by spaces', () => {
    const { getByRole } = render(<Kbd keys={['Meta', 'Z']} platform="mac" />)
    expect(getByRole('img').getAttribute('aria-label')).toBe('Command Z')
  })

  it('3-key combo aria-label', () => {
    const { getByRole } = render(<Kbd keys={['Meta', 'Shift', 'Z']} platform="mac" />)
    expect(getByRole('img').getAttribute('aria-label')).toBe('Command Shift Z')
  })
})

// ── Binding string parsing ────────────────────────────────────────────────────

describe('Kbd binding string', () => {
  it('parses "⌘Z" → 2 caps on mac', () => {
    const { container } = render(<Kbd binding="⌘Z" platform="mac" />)
    expect(container.querySelectorAll('kbd').length).toBe(2)
  })

  it('parses "⌘⇧Z" → 3 caps on mac', () => {
    const { container } = render(<Kbd binding="⌘⇧Z" platform="mac" />)
    expect(container.querySelectorAll('kbd').length).toBe(3)
  })

  it('parses "Ctrl+X" → 2 caps', () => {
    const { container } = render(<Kbd binding="Ctrl+X" platform="win" />)
    expect(container.querySelectorAll('kbd').length).toBe(2)
  })

  it('single named key "Space" → 1 cap', () => {
    const { container } = render(<Kbd binding="Space" platform="mac" />)
    expect(container.querySelectorAll('kbd').length).toBe(1)
    expect(container.querySelector('kbd')!.textContent).toBe('Space')
  })

  it('"Backspace" → ⌫ on mac', () => {
    const { container } = render(<Kbd binding="Backspace" platform="mac" />)
    expect(container.querySelector('kbd')!.textContent).toBe('⌫')
  })

  it('"Backspace" → Bksp on win', () => {
    const { container } = render(<Kbd binding="Backspace" platform="win" />)
    expect(container.querySelector('kbd')!.textContent).toBe('Bksp')
  })
})

// ── Empty / unbound ───────────────────────────────────────────────────────────

describe('Kbd unbound', () => {
  it('empty keys array → data-unbound attribute', () => {
    const { getByRole } = render(<Kbd keys={[]} platform="mac" />)
    expect(getByRole('img')).toHaveAttribute('data-unbound')
  })

  it('empty keys array → aria-label "Unbound"', () => {
    const { getByRole } = render(<Kbd keys={[]} platform="mac" />)
    expect(getByRole('img').getAttribute('aria-label')).toBe('Unbound')
  })

  it('no keys and no binding → data-unbound', () => {
    const { getByRole } = render(<Kbd platform="mac" />)
    expect(getByRole('img')).toHaveAttribute('data-unbound')
  })
})
