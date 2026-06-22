// src/gallery/Sidebar.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Sidebar } from './Sidebar'

// Sidebar only needs the default ThemeContext (ThemeSwitcher), so render bare —
// no ThemeRoot, which would touch localStorage outside the gallery shell.
function renderSidebar() {
  return render(<Sidebar />)
}

afterEach(cleanup)

describe('Sidebar surface filter', () => {
  it('defaults to All — both DAW-only and web components are visible', () => {
    renderSidebar()
    expect(screen.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('link', { name: 'Mixer' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hero' })).toBeInTheDocument()
  })

  it('hides DAW-only components when filtering to Web', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('radio', { name: 'Web' }))
    expect(screen.queryByRole('link', { name: 'Mixer' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hero' })).toBeInTheDocument()
  })

  it('hides web-only components when filtering to DAW', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('radio', { name: 'DAW' }))
    expect(screen.queryByRole('link', { name: 'Hero' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mixer' })).toBeInTheDocument()
  })

  it('shows multi-surface components on each of their surfaces (Fader = app + daw)', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('radio', { name: 'App' }))
    expect(screen.getByRole('link', { name: 'Fader' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'DAW' }))
    expect(screen.getByRole('link', { name: 'Fader' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Web' }))
    expect(screen.queryByRole('link', { name: 'Fader' })).not.toBeInTheDocument()
  })

  it('keeps cross-cutting Foundation links visible on every surface', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('radio', { name: 'Web' }))
    expect(screen.getByRole('link', { name: 'Tokens' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Design Language' })).toBeInTheDocument()
  })

  it('returning to All restores the full list', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('radio', { name: 'Web' }))
    expect(screen.queryByRole('link', { name: 'Mixer' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'All' }))
    expect(screen.getByRole('link', { name: 'Mixer' })).toBeInTheDocument()
  })
})
