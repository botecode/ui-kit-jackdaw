// src/components/Playhead/Playhead.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Playhead } from './Playhead'

const noop = () => {}
const getSecondsStub = () => 0
const identity = (s: number) => s * 10

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Playhead rendering', () => {
  it('renders root with data-testid="playhead-root"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-root"]')).not.toBeNull()
  })

  it('renders line with data-testid="playhead-line"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-line"]')).not.toBeNull()
  })

  it('renders handle with data-testid="playhead-handle"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-handle"]')).not.toBeNull()
  })

  it('root has aria-hidden="true"', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    expect(container.querySelector('[data-testid="playhead-root"]'))
      .toHaveAttribute('aria-hidden', 'true')
  })
})

// ─── State attributes ─────────────────────────────────────────────────────────

describe('Playhead state attributes', () => {
  it('data-playing absent when playing=false (default)', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.playing).toBeUndefined()
  })

  it('data-playing present when playing=true', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} playing />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.playing).toBeDefined()
  })

  it('data-recording absent by default', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.recording).toBeUndefined()
  })

  it('data-recording present when recording=true', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} recording />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.recording).toBeDefined()
  })

  it('data-interactive absent when onScrub not provided', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.interactive).toBeUndefined()
  })

  it('data-interactive present when onScrub provided', () => {
    const { container } = render(
      <Playhead seconds={0} getSeconds={getSecondsStub} secondsToX={identity} onScrub={noop} />
    )
    const root = container.querySelector('[data-testid="playhead-root"]') as HTMLElement
    expect(root.dataset.interactive).toBeDefined()
  })
})
