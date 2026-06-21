// src/gallery/ui/Playground.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Playground } from './Playground'

describe('Playground', () => {
  it('renders null when no children are provided', () => {
    const { container } = render(<Playground />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a "Playground" heading when children are provided', () => {
    render(<Playground><div>content</div></Playground>)
    expect(screen.getByRole('heading', { level: 2, name: 'Playground' })).toBeInTheDocument()
  })

  it('renders children inside the controls container', () => {
    render(
      <Playground>
        <div data-testid="child">control</div>
      </Playground>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('single child is the direct child of the controls div', () => {
    const { container } = render(
      <Playground>
        <div data-testid="only-child">only</div>
      </Playground>
    )
    const section = container.querySelector('section')!
    const controls = section.lastElementChild!
    expect(controls.childElementCount).toBe(1)
    expect(controls.firstElementChild?.getAttribute('data-testid')).toBe('only-child')
  })

  it('multiple children are all direct children of the controls div', () => {
    const { container } = render(
      <Playground>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Playground>
    )
    const section = container.querySelector('section')!
    const controls = section.lastElementChild!
    expect(controls.childElementCount).toBe(3)
  })

  it('is a labeled region for screen reader navigation', () => {
    render(<Playground><div>content</div></Playground>)
    expect(screen.getByRole('region', { name: 'Playground' })).toBeInTheDocument()
  })
})
