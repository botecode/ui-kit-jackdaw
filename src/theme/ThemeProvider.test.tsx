// src/theme/ThemeProvider.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'

describe('ThemeProvider', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ThemeProvider theme="default"><span>hello</span></ThemeProvider>
    )
    expect(getByText('hello')).toBeDefined()
  })

  it('sets data-theme attribute', () => {
    const { container } = render(
      <ThemeProvider theme="bowie"><span /></ThemeProvider>
    )
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe('bowie')
  })

  it('applies --bg as inline style for default theme', () => {
    const { container } = render(
      <ThemeProvider theme="default"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--bg')).toBe('#0a0a0a')
  })

  it('applies --accent for bowie theme', () => {
    const { container } = render(
      <ThemeProvider theme="bowie"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--accent')).toBe('#ef2b3d')
  })

  // Layout-transparency: the wrapper used to have no height, so a consumer whose
  // root is height:100% collapsed to content height (100% of an auto-height parent)
  // and the page background showed through below it. The wrapper now carries
  // height:100% so a full-height child reaches the real viewport root.
  it('makes the wrapper full-height so height:100% children reach the viewport root', () => {
    const { container } = render(
      <ThemeProvider theme="default"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.height).toBe('100%')
  })

  // Bonus: the active theme's --bg paints the wrapper so a consumer's body
  // default (e.g. the :root #0a0a0a) never shows through.
  it('paints the active theme bg so the page default never shows through', () => {
    const { container } = render(
      <ThemeProvider theme="default"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.background).toBe('var(--bg)')
  })
})
