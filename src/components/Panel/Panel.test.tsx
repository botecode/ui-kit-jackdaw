import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Panel } from './Panel'

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('Panel rendering', () => {
  it('renders a section element', () => {
    const { container } = render(<Panel />)
    expect(container.querySelector('section')).toBeTruthy()
  })

  it('data-tone="outlined" by default', () => {
    const { container } = render(<Panel />)
    expect((container.firstChild as HTMLElement).getAttribute('data-tone')).toBe('outlined')
  })

  it('data-tone="stage" when tone=stage', () => {
    const { container } = render(<Panel tone="stage" />)
    expect((container.firstChild as HTMLElement).getAttribute('data-tone')).toBe('stage')
  })

  it('data-padding="md" by default', () => {
    const { container } = render(<Panel />)
    expect((container.firstChild as HTMLElement).getAttribute('data-padding')).toBe('md')
  })

  it('data-padding reflects the padding prop', () => {
    const { container } = render(<Panel padding="lg" />)
    expect((container.firstChild as HTMLElement).getAttribute('data-padding')).toBe('lg')
  })

  it('data-texture present when texture=true', () => {
    const { container } = render(<Panel texture />)
    expect((container.firstChild as HTMLElement).hasAttribute('data-texture')).toBe(true)
  })

  it('data-texture absent when texture=false', () => {
    const { container } = render(<Panel texture={false} />)
    expect((container.firstChild as HTMLElement).hasAttribute('data-texture')).toBe(false)
  })

  it('data-texture present by default on outlined tone', () => {
    const { container } = render(<Panel tone="outlined" />)
    expect((container.firstChild as HTMLElement).hasAttribute('data-texture')).toBe(true)
  })

  it('data-texture absent by default on stage tone', () => {
    const { container } = render(<Panel tone="stage" />)
    expect((container.firstChild as HTMLElement).hasAttribute('data-texture')).toBe(false)
  })

  it('renders children', () => {
    const { getByText } = render(<Panel>hello</Panel>)
    expect(getByText('hello')).toBeInTheDocument()
  })
})

// ─── Header ──────────────────────────────────────────────────────────────────

describe('Panel header', () => {
  it('renders title text', () => {
    const { getByText } = render(<Panel title="CHARACTER" />)
    expect(getByText('CHARACTER')).toBeInTheDocument()
  })

  it('aria-labelledby on section points to the title span', () => {
    const { container } = render(<Panel title="CHARACTER" />)
    const section = container.querySelector('section')!
    const labelId = section.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    expect(container.querySelector(`#${CSS.escape(labelId!)}`)?.textContent).toBe('CHARACTER')
  })

  it('no aria-labelledby when title is absent', () => {
    const { container } = render(<Panel />)
    expect(container.querySelector('section')!.getAttribute('aria-labelledby')).toBeNull()
  })

  it('renders headerLead slot', () => {
    const { getByTestId } = render(
      <Panel headerLead={<span data-testid="lead">LED</span>} />,
    )
    expect(getByTestId('lead')).toBeInTheDocument()
  })

  it('renders headerControl slot', () => {
    const { getByTestId } = render(
      <Panel headerControl={<span data-testid="ctrl">BTN</span>} />,
    )
    expect(getByTestId('ctrl')).toBeInTheDocument()
  })

  it('header is absent when no title, lead, or control', () => {
    const { container } = render(<Panel><span>body</span></Panel>)
    // Only the body div should be inside the section — no header sibling
    const section = container.querySelector('section')!
    expect(section.children).toHaveLength(1)
  })

  it('header is present when only a title is given', () => {
    const { container } = render(<Panel title="X" />)
    const section = container.querySelector('section')!
    expect(section.children).toHaveLength(2) // header + body
  })
})
