// src/components/AutomationLane/AutomationLane.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AutomationLane, EnvelopeLane } from './AutomationLane'
import type {
  AutomationLaneProps,
  AutomationEnvelope,
  EnvelopeLaneProps,
  EnvelopePoint,
} from './AutomationLane'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // setPointerCapture is not implemented in jsdom
  HTMLDivElement.prototype.setPointerCapture  = vi.fn()
  HTMLDivElement.prototype.releasePointerCapture = vi.fn()

  // useSpring reads matchMedia for prefers-reduced-motion
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media:   query,
      onchange: null,
      addEventListener:    vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent:       vi.fn(),
    })),
  })
})

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// BPM=120, pxPerBeat=48 → 1 beat = 0.5s → secondsToX(1, 48, 120) = 96px
const BPM        = 120
const PX_PER_BEAT = 48

const VOL_ENV: AutomationEnvelope = {
  id:     'volume',
  label:  'Volume',
  points: [
    { t: 0, value: 1.0 },   // x=0,   y=0   (top = max)
    { t: 1, value: 0.75 },  // x=96,  y=20
    { t: 2, value: 0.5 },   // x=192, y=40
  ],
}

const PAN_ENV: AutomationEnvelope = {
  id:     'pan',
  label:  'Pan',
  points: [
    { t: 0, value: 0.5 },   // x=0, y=40 (center)
    { t: 2, value: 0.75 },  // x=192, y=20 (25%R)
  ],
}

const BASE_PROPS: AutomationLaneProps = {
  trackId:          't1',
  envelopes:        [VOL_ENV],
  visibleEnvelopes: ['volume'],
  view:             'collapsed',
  bpm:              BPM,
  pxPerBeat:        PX_PER_BEAT,
  laneWidth:        480,
}

function lane(overrides: Partial<AutomationLaneProps> = {}) {
  return render(<AutomationLane {...BASE_PROPS} {...overrides} />)
}

const BASE_LANE_PROPS: EnvelopeLaneProps = {
  envelope:    VOL_ENV,
  pxPerBeat:   PX_PER_BEAT,
  bpm:         BPM,
  canvasWidth: 332,   // 480 - 88 - 60
  laneHeight:  80,
}

function envLane(overrides: Partial<EnvelopeLaneProps> = {}) {
  return render(<EnvelopeLane {...BASE_LANE_PROPS} {...overrides} />)
}

// ─── AutomationLane — view=none ───────────────────────────────────────────────

describe('AutomationLane view=none', () => {
  it('renders nothing', () => {
    const { container } = lane({ view: 'none' })
    expect(container.firstChild).toBeNull()
  })
})

// ─── AutomationLane — view=collapsed ──────────────────────────────────────────

describe('AutomationLane view=collapsed', () => {
  it('renders data-testid="automation-lane"', () => {
    lane()
    expect(screen.getByTestId('automation-lane')).toBeInTheDocument()
  })

  it('sets data-view="collapsed"', () => {
    lane()
    expect(screen.getByTestId('automation-lane')).toHaveAttribute('data-view', 'collapsed')
  })

  it('sets data-track-id from trackId prop', () => {
    lane({ trackId: 'guitar' })
    expect(screen.getByTestId('automation-lane')).toHaveAttribute('data-track-id', 'guitar')
  })

  it('renders the collapsed tab with "Expand automation" role', () => {
    lane()
    expect(screen.getByRole('button', { name: 'Expand automation' })).toBeInTheDocument()
  })

  it('renders envelope label in the tab', () => {
    lane()
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('renders "Volume + Pan" when both visible', () => {
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume', 'pan'] })
    expect(screen.getByText('Volume + Pan')).toBeInTheDocument()
  })

  it('does NOT render envelope canvas in collapsed state', () => {
    lane()
    expect(screen.queryByTestId('envelope-canvas-volume')).not.toBeInTheDocument()
  })

  it('clicking the tab calls onViewChange("expanded")', () => {
    const onViewChange = vi.fn()
    lane({ onViewChange })
    fireEvent.click(screen.getByRole('button', { name: 'Expand automation' }))
    expect(onViewChange).toHaveBeenCalledWith('expanded')
  })

  it('Enter key on tab calls onViewChange("expanded")', () => {
    const onViewChange = vi.fn()
    lane({ onViewChange })
    const tab = screen.getByRole('button', { name: 'Expand automation' })
    fireEvent.keyDown(tab, { key: 'Enter' })
    expect(onViewChange).toHaveBeenCalledWith('expanded')
  })

  it('Space key on tab calls onViewChange("expanded")', () => {
    const onViewChange = vi.fn()
    lane({ onViewChange })
    const tab = screen.getByRole('button', { name: 'Expand automation' })
    fireEvent.keyDown(tab, { key: ' ' })
    expect(onViewChange).toHaveBeenCalledWith('expanded')
  })
})

// ─── AutomationLane — visibility menu ─────────────────────────────────────────

describe('AutomationLane visibility menu', () => {
  it('caret button opens the automation lanes menu', () => {
    lane({ envelopes: [VOL_ENV, PAN_ENV] })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    expect(screen.getByRole('menu', { name: 'Automation lanes' })).toBeInTheDocument()
  })

  it('menu contains Volume and Pan items', () => {
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume'] })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Volume' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pan' })).toBeInTheDocument()
  })

  it('Volume is aria-checked=true when visible', () => {
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume'] })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Volume' })).toHaveAttribute('aria-checked', 'true')
  })

  it('Pan is aria-checked=false when not visible', () => {
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume'] })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    expect(screen.getByRole('menuitemcheckbox', { name: 'Pan' })).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking Pan calls onVisibilityChange with pan added', () => {
    const onVisibilityChange = vi.fn()
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume'], onVisibilityChange })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Pan' }))
    expect(onVisibilityChange).toHaveBeenCalledWith(['volume', 'pan'])
  })

  it('clicking Volume (when visible) calls onVisibilityChange with volume removed', () => {
    const onVisibilityChange = vi.fn()
    lane({ envelopes: [VOL_ENV, PAN_ENV], visibleEnvelopes: ['volume', 'pan'], onVisibilityChange })
    fireEvent.click(screen.getByRole('button', { name: 'Choose automation lanes' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Volume' }))
    expect(onVisibilityChange).toHaveBeenCalledWith(['pan'])
  })
})

// ─── AutomationLane — view=expanded ───────────────────────────────────────────

describe('AutomationLane view=expanded', () => {
  it('sets data-view="expanded"', () => {
    lane({ view: 'expanded' })
    expect(screen.getByTestId('automation-lane')).toHaveAttribute('data-view', 'expanded')
  })

  it('renders envelope canvas when expanded', () => {
    lane({ view: 'expanded' })
    expect(screen.getByTestId('envelope-canvas-volume')).toBeInTheDocument()
  })

  it('renders two canvases when both envelopes are visible', () => {
    lane({
      view:             'expanded',
      envelopes:        [VOL_ENV, PAN_ENV],
      visibleEnvelopes: ['volume', 'pan'],
    })
    expect(screen.getByTestId('envelope-canvas-volume')).toBeInTheDocument()
    expect(screen.getByTestId('envelope-canvas-pan')).toBeInTheDocument()
  })

  it('only renders visible envelopes', () => {
    lane({
      view:             'expanded',
      envelopes:        [VOL_ENV, PAN_ENV],
      visibleEnvelopes: ['volume'],
    })
    expect(screen.getByTestId('envelope-canvas-volume')).toBeInTheDocument()
    expect(screen.queryByTestId('envelope-canvas-pan')).not.toBeInTheDocument()
  })

  it('tab is still rendered in expanded view (for collapse)', () => {
    lane({ view: 'expanded' })
    expect(screen.getByRole('button', { name: 'Expand automation' })).toBeInTheDocument()
  })

  it('collapse button fires onViewChange("collapsed")', () => {
    const onViewChange = vi.fn()
    lane({ view: 'expanded', onViewChange })
    fireEvent.click(screen.getByRole('button', { name: 'Collapse automation' }))
    expect(onViewChange).toHaveBeenCalledWith('collapsed')
  })
})

// ─── EnvelopeLane — rendering ─────────────────────────────────────────────────

describe('EnvelopeLane rendering', () => {
  it('renders the canvas with correct testid', () => {
    envLane()
    expect(screen.getByTestId('envelope-canvas-volume')).toBeInTheDocument()
  })

  it('renders param name label', () => {
    envLane()
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('renders gear options button', () => {
    envLane()
    expect(screen.getByRole('button', { name: 'Volume options' })).toBeInTheDocument()
  })

  it('renders collapse button when showCollapseButton=true', () => {
    envLane({ showCollapseButton: true })
    expect(screen.getByRole('button', { name: 'Collapse automation' })).toBeInTheDocument()
  })

  it('no collapse button when showCollapseButton=false (default)', () => {
    envLane()
    expect(screen.queryByRole('button', { name: 'Collapse automation' })).not.toBeInTheDocument()
  })

  it('canvas is keyboard-focusable (tabIndex=0)', () => {
    envLane()
    const canvas = screen.getByTestId('envelope-canvas-volume')
    expect(canvas.tabIndex).toBe(0)
  })

  it('canvas tabIndex=-1 when disabled', () => {
    envLane({ disabled: true })
    const canvas = screen.getByTestId('envelope-canvas-volume')
    expect(canvas.tabIndex).toBe(-1)
  })

  it('renders data-envelope-id on the lane row', () => {
    const { container } = envLane()
    expect(container.querySelector('[data-envelope-id="volume"]')).toBeInTheDocument()
  })

  it('data-bypassed present when envelope is bypassed', () => {
    const { container } = envLane({ envelope: { ...VOL_ENV, bypassed: true } })
    expect(container.querySelector('[data-bypassed]')).toBeInTheDocument()
  })

  it('data-bypassed absent by default', () => {
    const { container } = envLane()
    expect(container.querySelector('[data-bypassed]')).not.toBeInTheDocument()
  })
})

// ─── EnvelopeLane — gear menu ─────────────────────────────────────────────────

describe('EnvelopeLane gear menu', () => {
  it('opens menu on gear click', () => {
    envLane()
    fireEvent.click(screen.getByRole('button', { name: 'Volume options' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('"Bypass" item visible when not bypassed', () => {
    envLane()
    fireEvent.click(screen.getByRole('button', { name: 'Volume options' }))
    expect(screen.getByRole('menuitem', { name: 'Bypass' })).toBeInTheDocument()
  })

  it('"Unbypass" item visible when bypassed', () => {
    envLane({ envelope: { ...VOL_ENV, bypassed: true } })
    fireEvent.click(screen.getByRole('button', { name: 'Volume options' }))
    expect(screen.getByRole('menuitem', { name: 'Unbypass' })).toBeInTheDocument()
  })

  it('"Bypass" click calls onBypassToggle(true)', () => {
    const onBypassToggle = vi.fn()
    envLane({ onBypassToggle })
    fireEvent.click(screen.getByRole('button', { name: 'Volume options' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Bypass' }))
    expect(onBypassToggle).toHaveBeenCalledWith(true)
  })

  it('"Remove" click calls onRemove', () => {
    const onRemove = vi.fn()
    envLane({ onRemove })
    fireEvent.click(screen.getByRole('button', { name: 'Volume options' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalled()
  })
})

// ─── EnvelopeLane — collapse button ───────────────────────────────────────────

describe('EnvelopeLane collapse button', () => {
  it('clicking collapse button fires onCollapse', () => {
    const onCollapse = vi.fn()
    envLane({ showCollapseButton: true, onCollapse })
    fireEvent.click(screen.getByRole('button', { name: 'Collapse automation' }))
    expect(onCollapse).toHaveBeenCalled()
  })
})

// ─── EnvelopeLane — click-to-add point ────────────────────────────────────────

describe('EnvelopeLane click-to-add', () => {
  it('pointerDown + pointerUp at the same spot calls onPointAdd', () => {
    const onPointAdd = vi.fn()
    const env: AutomationEnvelope = { ...VOL_ENV, points: [] }  // no existing points
    envLane({ envelope: env, onPointAdd })

    const canvas = screen.getByTestId('envelope-canvas-volume')
    // Click at (200, 40): t ≈ 2.08s, value = 1 - 40/80 = 0.5
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(canvas,   { clientX: 200, clientY: 40, pointerId: 1 })

    expect(onPointAdd).toHaveBeenCalledOnce()
    const pt: EnvelopePoint = onPointAdd.mock.calls[0][0]
    expect(pt.value).toBeCloseTo(0.5, 2)
    expect(pt.t).toBeGreaterThan(0)
  })

  it('large pointer move cancels click-to-add', () => {
    const onPointAdd = vi.fn()
    const env: AutomationEnvelope = { ...VOL_ENV, points: [] }
    envLane({ envelope: env, onPointAdd })

    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 40, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 200, clientY: 40, pointerId: 1 })  // moved >4px
    fireEvent.pointerUp(canvas,   { clientX: 200, clientY: 40, pointerId: 1 })

    expect(onPointAdd).not.toHaveBeenCalled()
  })

  it('does NOT call onPointAdd when disabled', () => {
    const onPointAdd = vi.fn()
    const env: AutomationEnvelope = { ...VOL_ENV, points: [] }
    envLane({ envelope: env, onPointAdd, disabled: true })

    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.pointerDown(canvas, { clientX: 200, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(canvas,   { clientX: 200, clientY: 40, pointerId: 1 })

    expect(onPointAdd).not.toHaveBeenCalled()
  })
})

// ─── EnvelopeLane — drag a point ──────────────────────────────────────────────

describe('EnvelopeLane drag point', () => {
  // VOL_ENV point[1] is at t=1s (x=96), value=0.75 (y=20).
  // Dragging from (96, 20) to (192, 40) should move it to t≈2s, value≈0.5.

  it('drags existing point and calls onPointMove on pointer up', () => {
    const onPointMove = vi.fn()
    envLane({ onPointMove })

    const canvas = screen.getByTestId('envelope-canvas-volume')
    // Hit point[1] at its natural position: x=96, y=20
    fireEvent.pointerDown(canvas, { clientX: 96, clientY: 20, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 144, clientY: 40, pointerId: 1 })
    fireEvent.pointerUp(canvas,   { clientX: 144, clientY: 40, pointerId: 1 })

    expect(onPointMove).toHaveBeenCalledOnce()
    const [index, pt] = onPointMove.mock.calls[0] as [number, EnvelopePoint]
    expect(index).toBe(1)
    // value = clamp(1 - (20 + (40-20)) / 80) = clamp(1 - 40/80) = 0.5
    expect(pt.value).toBeCloseTo(0.5, 2)
  })

  it('sets data-dragging on canvas during drag', () => {
    envLane()
    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.pointerDown(canvas, { clientX: 96, clientY: 20, pointerId: 1 })
    expect(canvas).toHaveAttribute('data-dragging')
  })

  it('clears data-dragging after pointer up', () => {
    envLane()
    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.pointerDown(canvas, { clientX: 96, clientY: 20, pointerId: 1 })
    fireEvent.pointerUp(canvas,   { clientX: 96, clientY: 20, pointerId: 1 })
    expect(canvas).not.toHaveAttribute('data-dragging')
  })

  it('pointer cancel also clears drag (same path as pointer up)', () => {
    const onPointMove = vi.fn()
    envLane({ onPointMove })
    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.pointerDown(canvas, { clientX: 96, clientY: 20, pointerId: 1 })
    fireEvent.pointerMove(canvas, { clientX: 144, clientY: 40, pointerId: 1 })
    fireEvent.pointerCancel(canvas)
    expect(canvas).not.toHaveAttribute('data-dragging')
  })
})

// ─── EnvelopeLane — keyboard delete ───────────────────────────────────────────

describe('EnvelopeLane keyboard delete', () => {
  it('Delete key on focused canvas (with selected point) calls onPointDelete', () => {
    const onPointDelete = vi.fn()
    envLane({ onPointDelete })

    // Focus a point to set selectedIdx, then fire Delete on the canvas
    const canvas  = screen.getByTestId('envelope-canvas-volume')
    const circles = canvas.querySelectorAll('circle')
    // Focus first circle → selectedIdx = 0
    fireEvent.focus(circles[0])
    fireEvent.keyDown(canvas, { key: 'Delete' })
    expect(onPointDelete).toHaveBeenCalledWith(0)
  })

  it('Backspace key also calls onPointDelete', () => {
    const onPointDelete = vi.fn()
    envLane({ onPointDelete })

    const canvas  = screen.getByTestId('envelope-canvas-volume')
    const circles = canvas.querySelectorAll('circle')
    fireEvent.focus(circles[0])
    fireEvent.keyDown(canvas, { key: 'Backspace' })
    expect(onPointDelete).toHaveBeenCalledWith(0)
  })

  it('Delete without a selected point does NOT call onPointDelete', () => {
    const onPointDelete = vi.fn()
    envLane({ onPointDelete })
    const canvas = screen.getByTestId('envelope-canvas-volume')
    fireEvent.keyDown(canvas, { key: 'Delete' })
    expect(onPointDelete).not.toHaveBeenCalled()
  })

  it('other keys do not call onPointDelete', () => {
    const onPointDelete = vi.fn()
    envLane({ onPointDelete })
    const canvas  = screen.getByTestId('envelope-canvas-volume')
    const circles = canvas.querySelectorAll('circle')
    fireEvent.focus(circles[0])
    fireEvent.keyDown(canvas, { key: 'ArrowLeft' })
    expect(onPointDelete).not.toHaveBeenCalled()
  })
})

// ─── EnvelopeLane — value readout ─────────────────────────────────────────────

describe('EnvelopeLane value readout', () => {
  it('shows dB value for volume', () => {
    // playheadSeconds=1 → value=0.75 → 20*log10(0.75) ≈ -2.5 dB
    const { container } = envLane({ playheadSeconds: 1 })
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout?.textContent).toMatch(/dB/)
  })

  it('shows %L/R value for pan', () => {
    const { container } = render(
      <EnvelopeLane
        {...BASE_LANE_PROPS}
        envelope={PAN_ENV}
        playheadSeconds={2}  // value=0.75 → 50%R
      />,
    )
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout?.textContent).toMatch(/[LRC]/)
  })

  it('shows "C" when pan value is 0.5', () => {
    const centeredPan: AutomationEnvelope = {
      id: 'pan', label: 'Pan', points: [{ t: 0, value: 0.5 }],
    }
    const { container } = render(
      <EnvelopeLane {...BASE_LANE_PROPS} envelope={centeredPan} playheadSeconds={0} />,
    )
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout?.textContent).toBe('C')
  })
})

// ─── EnvelopeLane — SVG points ────────────────────────────────────────────────

describe('EnvelopeLane SVG point handles', () => {
  it('renders one circle per envelope point', () => {
    const { container } = envLane()
    // VOL_ENV has 3 points
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(3)
  })

  it('each circle has an aria-label', () => {
    const { container } = envLane()
    const circles = container.querySelectorAll('circle')
    circles.forEach(c => {
      expect(c.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('no circles when envelope has no points', () => {
    const { container } = envLane({ envelope: { ...VOL_ENV, points: [] } })
    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })
})

// ─── formatValue utility (via readout) ────────────────────────────────────────

describe('value formatting', () => {
  it('volume value=1.0 shows 0.0 dB', () => {
    const env: AutomationEnvelope = { id: 'volume', label: 'Volume', points: [{ t: 0, value: 1.0 }] }
    const { container } = render(
      <EnvelopeLane {...BASE_LANE_PROPS} envelope={env} playheadSeconds={0} />,
    )
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout?.textContent).toBe('+0.0 dB')
  })

  it('volume value≤0.001 shows −∞ dB', () => {
    const env: AutomationEnvelope = { id: 'volume', label: 'Volume', points: [{ t: 0, value: 0 }] }
    const { container } = render(
      <EnvelopeLane {...BASE_LANE_PROPS} envelope={env} playheadSeconds={0} />,
    )
    const readout = container.querySelector('[class*="readoutValue"]')
    expect(readout?.textContent).toBe('−∞ dB')
  })
})
