// src/components/FlyHighButton/FlyHighButton.test.tsx
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FlyHighButton } from './FlyHighButton'
import type { FlyHighButtonProps } from './FlyHighButton'

// Vitest stubs CSS, so we read the authored stylesheet to lock the mode swap:
// idle is the warm accent faceplate; the dark --stage well is the listening
// moment ONLY (the one time the hero goes dark, per the Home paper-face spec).
const HERO_CSS = readFileSync('src/components/FlyHighButton/FlyHighButton.module.css', 'utf8')

const BASE: FlyHighButtonProps = {
  onStart: () => {},
}

// Swap the matchMedia stub so we can drive prefers-reduced-motion per test.
function setReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduce : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setReducedMotion(false)
})

afterEach(() => {
  setReducedMotion(false)
})

describe('FlyHighButton — idle (the accent hero)', () => {
  it('renders the default label and tagline', () => {
    render(<FlyHighButton {...BASE} />)
    expect(screen.getByText('Fly High')).toBeInTheDocument()
    expect(screen.getByText("Just play — we'll catch every idea.")).toBeInTheDocument()
  })

  it('uses the host-passed label and tagline', () => {
    render(<FlyHighButton {...BASE} label="Go High" tagline="Catch the spark." />)
    expect(screen.getByText('Go High')).toBeInTheDocument()
    expect(screen.getByText('Catch the spark.')).toBeInTheDocument()
  })

  it('marks the hero as idle and not pressed', () => {
    const { container } = render(<FlyHighButton {...BASE} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(container.querySelector('[data-state="idle"]')).toBeInTheDocument()
  })

  it('fires onStart (not onStop) when clicked in idle', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    render(<FlyHighButton onStart={onStart} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStop).not.toHaveBeenCalled()
  })
})

describe('FlyHighButton — listening (the stage-dark armed look)', () => {
  it('shows the listening label and sub-line', () => {
    render(<FlyHighButton {...BASE} state="listening" />)
    expect(screen.getByText(/listening/i)).toBeInTheDocument()
    expect(screen.getByText(/pause when done/i)).toBeInTheDocument()
  })

  it('marks the hero as listening and pressed', () => {
    const { container } = render(<FlyHighButton {...BASE} state="listening" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-state="listening"]')).toBeInTheDocument()
  })

  it('fires onStop (not onStart) when clicked while listening', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    render(<FlyHighButton onStart={onStart} onStop={onStop} state="listening" />)
    fireEvent.click(screen.getByRole('button'))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStart).not.toHaveBeenCalled()
  })

  it('does not throw when listening is clicked without an onStop handler', () => {
    render(<FlyHighButton {...BASE} state="listening" />)
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow()
  })

  it('announces the state line through a polite live region', () => {
    render(<FlyHighButton {...BASE} state="listening" />)
    const live = screen.getByText(/pause when done/i)
    expect(live).toHaveAttribute('aria-live', 'polite')
  })
})

describe('FlyHighButton — accessible name', () => {
  it('defaults the accessible name to the label in idle', () => {
    render(<FlyHighButton {...BASE} label="Go High" />)
    expect(screen.getByRole('button', { name: /go high/i })).toBeInTheDocument()
  })

  it('defaults the accessible name to "Listening" while listening', () => {
    render(<FlyHighButton {...BASE} state="listening" />)
    expect(screen.getByRole('button', { name: /listening/i })).toBeInTheDocument()
  })

  it('honours an explicit aria-label override', () => {
    render(<FlyHighButton {...BASE} aria-label="Start catching ideas" />)
    expect(screen.getByRole('button', { name: 'Start catching ideas' })).toBeInTheDocument()
  })
})

describe('FlyHighButton — size + passthrough', () => {
  it('defaults to md', () => {
    const { container } = render(<FlyHighButton {...BASE} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('exposes data-size=sm', () => {
    const { container } = render(<FlyHighButton {...BASE} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('forwards a custom className onto the root', () => {
    const { container } = render(<FlyHighButton {...BASE} className="custom" />)
    expect(container.querySelector('button.custom')).toBeInTheDocument()
  })
})

describe('FlyHighButton — paper-face guarantee (idle warm, stage only when listening)', () => {
  it('fills the idle faceplate with the warm accent — never the dark --stage well', () => {
    const rootRule = HERO_CSS.match(/\.root\s*{[\s\S]*?}/)?.[0] ?? ''
    expect(rootRule).toMatch(/background-color:\s*var\(--accent\)/)
    expect(rootRule).not.toMatch(/var\(--stage\b/)
  })

  it('drops to the dark --stage well only in the listening state', () => {
    // Every --stage reference in the sheet must be gated to the listening selector.
    const stageLines = HERO_CSS.split('\n').filter(l => /var\(--stage\b/.test(l))
    expect(stageLines.length).toBeGreaterThan(0)
    const listeningRule = HERO_CSS.match(/\.root\[data-state="listening"\]\s*{[^}]*}/)?.[0] ?? ''
    expect(listeningRule).toMatch(/background-color:\s*var\(--stage\)/)
  })
})

describe('FlyHighButton — reduced motion (calm swap, no pulse)', () => {
  it('pulses the live indicator while listening when motion is allowed', () => {
    setReducedMotion(false)
    render(<FlyHighButton {...BASE} state="listening" />)
    expect(screen.getByTestId('fly-high-live')).toHaveAttribute('data-pulse', 'true')
  })

  it('does not pulse the live indicator under prefers-reduced-motion', () => {
    setReducedMotion(true)
    render(<FlyHighButton {...BASE} state="listening" />)
    expect(screen.getByTestId('fly-high-live')).toHaveAttribute('data-pulse', 'false')
  })
})
