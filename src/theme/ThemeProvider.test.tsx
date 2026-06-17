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
})
