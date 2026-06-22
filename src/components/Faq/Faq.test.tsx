// src/components/Faq/Faq.test.tsx
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Faq } from './Faq'
import type { FaqItem } from './Faq'

const ITEMS: FaqItem[] = [
  { id: 'export', question: 'Can I export stems?', answer: 'Yes — every track bounces to its own file.' },
  { id: 'offline', question: 'Does it work offline?', answer: 'The whole session lives on your machine.' },
  { id: 'collab', question: 'Can I collaborate?', answer: 'Share a transparent link and they import locally.' },
]

// ─── Rendering & a11y ──────────────────────────────────────────────────────────

describe('Faq – rendering', () => {
  it('renders one header button per item', () => {
    const { getAllByRole } = render(<Faq items={ITEMS} />)
    expect(getAllByRole('button')).toHaveLength(3)
  })

  it('wraps each header in a heading at the default level (3)', () => {
    const { getAllByRole } = render(<Faq items={ITEMS} />)
    expect(getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  it('honours a custom heading level', () => {
    const { getAllByRole } = render(<Faq items={ITEMS} headingLevel={2} />)
    expect(getAllByRole('heading', { level: 2 })).toHaveLength(3)
  })

  it('all items start collapsed (aria-expanded=false)', () => {
    const { getAllByRole } = render(<Faq items={ITEMS} />)
    getAllByRole('button').forEach(b => expect(b).toHaveAttribute('aria-expanded', 'false'))
  })

  it('each trigger controls a region labelled by the trigger', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const btn = getByRole('button', { name: 'Can I export stems?' })
    const panelId = btn.getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!
    expect(panel).toHaveAttribute('role', 'region')
    expect(panel).toHaveAttribute('aria-labelledby', btn.id)
  })

  it('data-size=md by default', () => {
    const { container } = render(<Faq items={ITEMS} />)
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size=sm when size=sm', () => {
    const { container } = render(<Faq items={ITEMS} size="sm" />)
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('opens items listed in defaultOpen', () => {
    const { getByRole } = render(<Faq items={ITEMS} defaultOpen={['offline']} />)
    expect(getByRole('button', { name: 'Does it work offline?' })).toHaveAttribute('aria-expanded', 'true')
    expect(getByRole('button', { name: 'Can I export stems?' })).toHaveAttribute('aria-expanded', 'false')
  })
})

// ─── Expand / collapse ─────────────────────────────────────────────────────────

describe('Faq – expand/collapse', () => {
  it('click expands the clicked item', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const btn = getByRole('button', { name: 'Can I export stems?' })
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('clicking an open item collapses it again', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const btn = getByRole('button', { name: 'Can I export stems?' })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('marks the open panel with data-open for the height transition', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const btn = getByRole('button', { name: 'Can I export stems?' })
    const panel = document.getElementById(btn.getAttribute('aria-controls')!)!
    expect(panel).not.toHaveAttribute('data-open')
    fireEvent.click(btn)
    expect(panel).toHaveAttribute('data-open')
  })

  it('closed panel content is inert', () => {
    const { getByRole, getByText } = render(<Faq items={ITEMS} />)
    const answer = getByText('Yes — every track bounces to its own file.')
    // The inert wrapper is the answer's parent.
    expect(answer.parentElement).toHaveAttribute('inert')
    fireEvent.click(getByRole('button', { name: 'Can I export stems?' }))
    expect(answer.parentElement).not.toHaveAttribute('inert')
  })
})

// ─── Single-open vs multi-open ─────────────────────────────────────────────────

describe('Faq – open mode', () => {
  it('single-open (default): opening a second item closes the first', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const a = getByRole('button', { name: 'Can I export stems?' })
    const b = getByRole('button', { name: 'Does it work offline?' })
    fireEvent.click(a)
    fireEvent.click(b)
    expect(a).toHaveAttribute('aria-expanded', 'false')
    expect(b).toHaveAttribute('aria-expanded', 'true')
  })

  it('allowMultiple: both items stay open', () => {
    const { getByRole } = render(<Faq items={ITEMS} allowMultiple />)
    const a = getByRole('button', { name: 'Can I export stems?' })
    const b = getByRole('button', { name: 'Does it work offline?' })
    fireEvent.click(a)
    fireEvent.click(b)
    expect(a).toHaveAttribute('aria-expanded', 'true')
    expect(b).toHaveAttribute('aria-expanded', 'true')
  })
})

// ─── Keyboard ──────────────────────────────────────────────────────────────────

describe('Faq – keyboard', () => {
  it('ArrowDown moves focus to the next header', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const a = getByRole('button', { name: 'Can I export stems?' })
    const b = getByRole('button', { name: 'Does it work offline?' })
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(b)
  })

  it('ArrowUp moves focus to the previous header', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const a = getByRole('button', { name: 'Can I export stems?' })
    const b = getByRole('button', { name: 'Does it work offline?' })
    b.focus()
    fireEvent.keyDown(b, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(a)
  })

  it('ArrowDown wraps from last header to first', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const first = getByRole('button', { name: 'Can I export stems?' })
    const last = getByRole('button', { name: 'Can I collaborate?' })
    last.focus()
    fireEvent.keyDown(last, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(first)
  })

  it('Home focuses the first header, End the last', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const first = getByRole('button', { name: 'Can I export stems?' })
    const last = getByRole('button', { name: 'Can I collaborate?' })
    first.focus()
    fireEvent.keyDown(first, { key: 'End' })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(last, { key: 'Home' })
    expect(document.activeElement).toBe(first)
  })

  it('unrelated key does not move focus', () => {
    const { getByRole } = render(<Faq items={ITEMS} />)
    const a = getByRole('button', { name: 'Can I export stems?' })
    a.focus()
    fireEvent.keyDown(a, { key: 'x' })
    expect(document.activeElement).toBe(a)
  })
})

// ─── Disabled ──────────────────────────────────────────────────────────────────

describe('Faq – disabled items', () => {
  const WITH_DISABLED: FaqItem[] = [
    { id: 'a', question: 'A', answer: 'a' },
    { id: 'b', question: 'B', answer: 'b', disabled: true },
    { id: 'c', question: 'C', answer: 'c' },
  ]

  it('disabled header is a disabled button', () => {
    const { getByRole } = render(<Faq items={WITH_DISABLED} />)
    expect(getByRole('button', { name: 'B' })).toBeDisabled()
  })

  it('disabled item does not expand on click', () => {
    const { getByRole } = render(<Faq items={WITH_DISABLED} />)
    const b = getByRole('button', { name: 'B' })
    fireEvent.click(b)
    expect(b).toHaveAttribute('aria-expanded', 'false')
  })

  it('keyboard navigation skips the disabled header', () => {
    const { getByRole } = render(<Faq items={WITH_DISABLED} />)
    const a = getByRole('button', { name: 'A' })
    const c = getByRole('button', { name: 'C' })
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(c)
  })
})

// ─── Empty ─────────────────────────────────────────────────────────────────────

describe('Faq – empty', () => {
  it('renders the empty label and no buttons when items is empty', () => {
    const { queryByRole, getByText, container } = render(<Faq items={[]} />)
    expect(queryByRole('button')).toBeNull()
    expect(getByText('No questions yet.')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-empty')
  })

  it('honours a custom emptyLabel', () => {
    const { getByText } = render(<Faq items={[]} emptyLabel="Nothing here." />)
    expect(getByText('Nothing here.')).toBeInTheDocument()
  })
})
