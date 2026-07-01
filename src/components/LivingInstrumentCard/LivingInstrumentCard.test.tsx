// src/components/LivingInstrumentCard/LivingInstrumentCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LivingInstrumentCard } from './LivingInstrumentCard'
import type { LivingInstrumentCardProps } from './LivingInstrumentCard'

const BASE: LivingInstrumentCardProps = {
  trackId: 'tk-1',
  name: 'Guitar',
  color: '#7eb8d4',
  input: { value: 'in1', options: [{ id: 'in1', label: 'Input 1' }, { id: 'in2', label: 'Input 2' }] },
  fx: [{ id: 'fx1', name: 'Drive', enabled: true }],
  volumeDb: 0,
  pan: 0,
  armed: false,
  muted: false,
  soloed: false,
  onVolumeChange: vi.fn(),
  onPanChange: vi.fn(),
  onArm: vi.fn(),
  onMute: vi.fn(),
  onSolo: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

// Give the body a measurable height so vertical drag math has travel in jsdom.
function mockBodyHeight(el: HTMLElement, height = 200) {
  el.getBoundingClientRect = () =>
    ({ height, width: 160, top: 0, left: 0, right: 160, bottom: height, x: 0, y: 0, toJSON: () => {} }) as DOMRect
}

const lastArg = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[fn.mock.calls.length - 1][0]
const stripLit = (el: HTMLElement) => Number(el.getAttribute('data-lit'))

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('LivingInstrumentCard — rendering', () => {
  it('renders an accessible group', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByRole('group', { name: /guitar instrument/i })).toBeInTheDocument()
  })

  it('renders the track name', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTitle('Guitar')).toBeInTheDocument()
  })

  it('keeps the name static (no textbox) when onNameChange is absent', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders an inline rename field and emits every edit when onNameChange is given', () => {
    const onNameChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} onNameChange={onNameChange} />)
    const field = screen.getByRole('textbox', { name: /rename guitar/i })
    expect(field).toHaveValue('Guitar')
    fireEvent.change(field, { target: { value: 'Lead Guitar' } })
    expect(onNameChange).toHaveBeenCalledWith('Lead Guitar')
  })

  it('never offers rename on the master bus', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" onNameChange={vi.fn()} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('exposes the volume line as a vertical slider over volumeDb', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-6} />)
    const line = screen.getByRole('slider', { name: /guitar level/i })
    expect(line).toHaveAttribute('aria-orientation', 'vertical')
    expect(line).toHaveAttribute('aria-valuemin', '-60')
    expect(line).toHaveAttribute('aria-valuemax', '6')
    expect(line).toHaveAttribute('aria-valuenow', '-6')
  })

  it('the volume line IS the set-point line (one element, one role)', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByRole('slider', { name: /guitar level/i })).toBe(screen.getByTestId('card-setpoint'))
  })

  it('renders the combined readout with the db unit and pan text', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-12} pan={0} />)
    expect(screen.getByText('-12.0 db / center')).toBeInTheDocument()
  })

  it('reads pan as N% left / N% right with the db unit', () => {
    const { rerender } = render(<LivingInstrumentCard {...BASE} volumeDb={-24.3} pan={-0.1} />)
    expect(screen.getByText('-24.3 db / 10% left')).toBeInTheDocument()
    rerender(<LivingInstrumentCard {...BASE} volumeDb={-6} pan={0.5} />)
    expect(screen.getByText('-6.0 db / 50% right')).toBeInTheDocument()
  })

  it('shows −∞ db at the floor', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-60} pan={0} />)
    expect(screen.getByText('−∞ db / center')).toBeInTheDocument()
  })

  it('drops the pan half of the readout on the master variant', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" volumeDb={0} />)
    expect(screen.getByText('+0.0 db')).toBeInTheDocument()
  })

  it('labels the ends of the pan travel with L / R', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('omits the L / R labels on the master variant (no pan)', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" />)
    expect(screen.queryByText('L')).toBeNull()
    expect(screen.queryByText('R')).toBeNull()
  })

  it('renders input, fx and pan controls for a normal track', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTestId('card-input')).toBeInTheDocument()
    expect(screen.getByTestId('card-fx')).toBeInTheDocument()
    expect(screen.getByTestId('card-pan')).toBeInTheDocument()
  })
})

// ── No volume fill: the body is the meter, not a fill ───────────────────────────

describe('LivingInstrumentCard — no volume fill (body = meter only)', () => {
  it('never paints a fader-fill zone over the meter', () => {
    const { container } = render(<LivingInstrumentCard {...BASE} volumeDb={0} meterL={-6} meterR={-8} />)
    expect(container.querySelectorAll('[data-zone="fader"]').length).toBe(0)
  })

  it('shows the signal as lit meter segments when playing', () => {
    const { container } = render(<LivingInstrumentCard {...BASE} channels="mono" meterL={0} />)
    expect(container.querySelectorAll('[data-zone="bloom"]').length).toBeGreaterThan(0)
  })

  it('keeps the strips dark at rest (no signal)', () => {
    const { container } = render(<LivingInstrumentCard {...BASE} channels="mono" />)
    expect(container.querySelectorAll('[data-zone="bloom"]').length).toBe(0)
  })

  it('the set-point line tracks volumeDb (higher level → higher line)', () => {
    const { rerender } = render(<LivingInstrumentCard {...BASE} volumeDb={-40} />)
    const low = Number(screen.getByTestId('card-setpoint').style.getPropertyValue('--setpoint-pos'))
    rerender(<LivingInstrumentCard {...BASE} volumeDb={0} />)
    const high = Number(screen.getByTestId('card-setpoint').style.getPropertyValue('--setpoint-pos'))
    expect(high).toBeGreaterThan(low)
  })
})

// ── The volume line is the fader — VERTICAL drag + keyboard ──────────────────────

describe('LivingInstrumentCard — volume = vertical drag on the body', () => {
  it('dragging the body up raises volumeDb', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={0} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 150, pointerId: 1 })
    fireEvent.pointerMove(body, { clientY: 40 }) // dragged up 110px
    fireEvent.pointerUp(body)
    expect(onVolumeChange).toHaveBeenCalled()
    expect(lastArg(onVolumeChange)).toBeGreaterThan(0)
  })

  it('dragging the body down lowers volumeDb', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={0} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 40, pointerId: 1 })
    fireEvent.pointerMove(body, { clientY: 150 }) // dragged down 110px
    fireEvent.pointerUp(body)
    expect(lastArg(onVolumeChange)).toBeLessThan(0)
  })

  it('a purely HORIZONTAL drag on the body does not change the level', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={-6} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientX: 40, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(body, { clientX: 150, clientY: 100 }) // only X changes
    fireEvent.pointerUp(body)
    if (onVolumeChange.mock.calls.length) expect(lastArg(onVolumeChange)).toBeCloseTo(-6, 1)
  })

  it('sets data-dragging while dragging', () => {
    render(<LivingInstrumentCard {...BASE} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 100, pointerId: 1 })
    expect(body).toHaveAttribute('data-dragging')
    fireEvent.pointerUp(body)
    expect(body).not.toHaveAttribute('data-dragging')
  })

  it('ArrowUp nudges volumeDb up by 1 dB', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={-10} onVolumeChange={onVolumeChange} />)
    fireEvent.keyDown(screen.getByRole('slider', { name: /guitar level/i }), { key: 'ArrowUp' })
    expect(onVolumeChange).toHaveBeenCalledWith(-9)
  })

  it('ArrowDown nudges volumeDb down by 1 dB', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={-10} onVolumeChange={onVolumeChange} />)
    fireEvent.keyDown(screen.getByRole('slider', { name: /guitar level/i }), { key: 'ArrowDown' })
    expect(onVolumeChange).toHaveBeenCalledWith(-11)
  })

  it('End jumps to the ceiling, Home to the floor', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} onVolumeChange={onVolumeChange} />)
    const line = screen.getByRole('slider', { name: /guitar level/i })
    fireEvent.keyDown(line, { key: 'End' })
    expect(onVolumeChange).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(line, { key: 'Home' })
    expect(onVolumeChange).toHaveBeenLastCalledWith(-60)
  })
})

// ── Display-only fallback ───────────────────────────────────────────────────────

describe('LivingInstrumentCard — display-only body', () => {
  it('is non-interactive when onVolumeChange is absent', () => {
    render(<LivingInstrumentCard {...BASE} onVolumeChange={undefined} />)
    const line = screen.getByTestId('card-setpoint')
    expect(line).toHaveAttribute('tabindex', '-1')
    expect(line).toHaveAttribute('aria-readonly', 'true')
  })

  it('ignores drag when display-only', () => {
    render(<LivingInstrumentCard {...BASE} onVolumeChange={undefined} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 100, pointerId: 1 })
    expect(body).not.toHaveAttribute('data-dragging')
  })
})

// ── Pan = a VERTICAL line set by HORIZONTAL drag (lives in the meter) ─────────────

describe('LivingInstrumentCard — pan = vertical line, horizontal drag in the meter', () => {
  it('the pan line lives in the meter body (no separate bottom control)', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTestId('card-body')).toContainElement(screen.getByTestId('card-pan'))
  })

  it('exposes the pan line as a horizontal slider', () => {
    render(<LivingInstrumentCard {...BASE} pan={-0.5} />)
    const pan = screen.getByRole('slider', { name: /guitar pan/i })
    expect(pan).toHaveAttribute('aria-orientation', 'horizontal')
    expect(pan).toHaveAttribute('aria-valuemin', '-1')
    expect(pan).toHaveAttribute('aria-valuemax', '1')
    expect(pan).toHaveAttribute('aria-valuenow', '-0.5')
  })

  it('the pan line tracks pan (right → line moves right)', () => {
    const { rerender } = render(<LivingInstrumentCard {...BASE} pan={-0.8} />)
    const left = Number(screen.getByTestId('card-pan').style.getPropertyValue('--pan-pos'))
    rerender(<LivingInstrumentCard {...BASE} pan={0.8} />)
    const right = Number(screen.getByTestId('card-pan').style.getPropertyValue('--pan-pos'))
    expect(right).toBeGreaterThan(left)
  })

  it('dragging the pan line right sets a positive pan', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} onPanChange={onPanChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body) // measures the meter width (160) for pan travel
    const pan = screen.getByTestId('card-pan')
    fireEvent.pointerDown(pan, { clientX: 60, pointerId: 1 })
    fireEvent.pointerMove(pan, { clientX: 110 }) // dragged right
    fireEvent.pointerUp(pan)
    expect(onPanChange).toHaveBeenCalled()
    expect(lastArg(onPanChange)).toBeGreaterThan(0)
  })

  it('dragging the pan line left sets a negative pan', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} onPanChange={onPanChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    const pan = screen.getByTestId('card-pan')
    fireEvent.pointerDown(pan, { clientX: 60, pointerId: 1 })
    fireEvent.pointerMove(pan, { clientX: 10 }) // dragged left
    fireEvent.pointerUp(pan)
    expect(lastArg(onPanChange)).toBeLessThan(0)
  })

  it('a horizontal drag on the pan line does NOT change the level', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    const pan = screen.getByTestId('card-pan')
    fireEvent.pointerDown(pan, { clientX: 60, pointerId: 1 })
    fireEvent.pointerMove(pan, { clientX: 110 })
    fireEvent.pointerUp(pan)
    expect(onVolumeChange).not.toHaveBeenCalled()
  })

  it('ArrowRight nudges pan right, ArrowLeft nudges pan left', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} onPanChange={onPanChange} />)
    const pan = screen.getByTestId('card-pan')
    fireEvent.keyDown(pan, { key: 'ArrowRight' })
    expect(lastArg(onPanChange)).toBeGreaterThan(0)
    fireEvent.keyDown(pan, { key: 'ArrowLeft' })
    expect(lastArg(onPanChange)).toBeLessThan(0)
  })

  it('Home pans hard left, End pans hard right', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} onPanChange={onPanChange} />)
    const pan = screen.getByTestId('card-pan')
    fireEvent.keyDown(pan, { key: 'Home' })
    expect(onPanChange).toHaveBeenLastCalledWith(-1)
    fireEvent.keyDown(pan, { key: 'End' })
    expect(onPanChange).toHaveBeenLastCalledWith(1)
  })

  it('omits the pan line on the master variant', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" />)
    expect(screen.queryByTestId('card-pan')).toBeNull()
  })
})

// ── Double-click resets each line (fader / knob convention) ──────────────────────

describe('LivingInstrumentCard — double-click resets', () => {
  it('double-clicking the volume line resets it to 0 dB (unity) and emits', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={-24} onVolumeChange={onVolumeChange} />)
    fireEvent.doubleClick(screen.getByTestId('card-setpoint'))
    expect(onVolumeChange).toHaveBeenLastCalledWith(0)
  })

  it('honours a custom resetVolumeDb', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={0} resetVolumeDb={-6} onVolumeChange={onVolumeChange} />)
    fireEvent.doubleClick(screen.getByTestId('card-body'))
    expect(onVolumeChange).toHaveBeenLastCalledWith(-6)
  })

  it('double-clicking the pan line resets it to center (0) and emits', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0.6} onPanChange={onPanChange} />)
    fireEvent.doubleClick(screen.getByTestId('card-pan'))
    expect(onPanChange).toHaveBeenLastCalledWith(0)
  })

  it('honours a custom resetPan', () => {
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0} resetPan={-0.5} onPanChange={onPanChange} />)
    fireEvent.doubleClick(screen.getByTestId('card-pan'))
    expect(onPanChange).toHaveBeenLastCalledWith(-0.5)
  })

  it('double-clicking the pan line does not reset the volume', () => {
    const onVolumeChange = vi.fn()
    const onPanChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} pan={0.6} onPanChange={onPanChange} onVolumeChange={onVolumeChange} />)
    fireEvent.doubleClick(screen.getByTestId('card-pan'))
    expect(onPanChange).toHaveBeenCalled()
    expect(onVolumeChange).not.toHaveBeenCalled()
  })
})

// ── Pan visualization = channel balance (attenuate the OPPOSITE channel) ─────────

describe('LivingInstrumentCard — pan attenuates the opposite channel', () => {
  it('center → both strips show their full signal', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" pan={0} meterL={0} meterR={0} />)
    const [l, r] = screen.getAllByTestId('card-strip')
    expect(stripLit(l)).toBe(stripLit(r))
    expect(stripLit(l)).toBeGreaterThan(0)
  })

  it('pan left by 0.5 floors the RIGHT strip to ~half, left stays full', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" pan={-0.5} meterL={0} meterR={0} />)
    const [l, r] = screen.getAllByTestId('card-strip')
    expect(Math.abs(stripLit(r) - stripLit(l) / 2)).toBeLessThanOrEqual(1)
  })

  it('pan right by 0.5 floors the LEFT strip to ~half, right stays full', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" pan={0.5} meterL={0} meterR={0} />)
    const [l, r] = screen.getAllByTestId('card-strip')
    expect(Math.abs(stripLit(l) - stripLit(r) / 2)).toBeLessThanOrEqual(1)
  })

  it('hard left floors the RIGHT strip, left full', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" pan={-1} meterL={0} meterR={0} />)
    const [l, r] = screen.getAllByTestId('card-strip')
    expect(stripLit(r)).toBe(0)
    expect(stripLit(l)).toBeGreaterThan(0)
  })

  it('does NOT move/narrow the strips horizontally (no lean / scaleX)', () => {
    const { container } = render(<LivingInstrumentCard {...BASE} channels="stereo" pan={0.8} meterL={0} meterR={0} />)
    expect(container.querySelector('[data-lean]')).toBeNull()
    expect(container.querySelector('[style*="--fill-scale"]')).toBeNull()
  })
})

// ── Stereo / mono strips + the set-point line ───────────────────────────────────

describe('LivingInstrumentCard — stereo / mono meter', () => {
  it('renders two strips for a stereo track', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" />)
    expect(screen.getAllByTestId('card-strip')).toHaveLength(2)
  })

  it('renders one strip for a mono track', () => {
    render(<LivingInstrumentCard {...BASE} channels="mono" />)
    expect(screen.getAllByTestId('card-strip')).toHaveLength(1)
  })

  it('infers stereo when meterR is present', () => {
    render(<LivingInstrumentCard {...BASE} meterL={-6} meterR={-8} />)
    expect(screen.getAllByTestId('card-strip')).toHaveLength(2)
  })

  it('infers mono when only meterL is present', () => {
    render(<LivingInstrumentCard {...BASE} meterL={-6} />)
    expect(screen.getAllByTestId('card-strip')).toHaveLength(1)
  })

  it('infers mono when no signal is present', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getAllByTestId('card-strip')).toHaveLength(1)
  })

  it('channels="stereo" wins even when only meterL is fed', () => {
    const { getAllByTestId } = render(<LivingInstrumentCard {...BASE} channels="stereo" meterL={-6} />)
    expect(getAllByTestId('card-strip')).toHaveLength(2)
  })

  it('channels="mono" wins even when both L and R are fed', () => {
    const { getAllByTestId } = render(<LivingInstrumentCard {...BASE} channels="mono" meterL={-6} meterR={-8} />)
    expect(getAllByTestId('card-strip')).toHaveLength(1)
  })

  it('mono pan does not floor the single strip (one channel = no balance)', () => {
    render(<LivingInstrumentCard {...BASE} channels="mono" pan={-1} meterL={0} />)
    const [strip] = screen.getAllByTestId('card-strip')
    expect(stripLit(strip)).toBeGreaterThan(0)
  })

  it('draws a single set-point line spanning both strips in stereo', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" volumeDb={-10} />)
    const line = screen.getByTestId('card-setpoint')
    expect(line).toBeInTheDocument()
    expect(line.style.getPropertyValue('--setpoint-pos')).not.toBe('')
  })

  it('draws the set-point line in mono too', () => {
    render(<LivingInstrumentCard {...BASE} channels="mono" volumeDb={-10} />)
    expect(screen.getByTestId('card-setpoint')).toBeInTheDocument()
  })

  it('lights the set-point line with the accent when active', () => {
    render(<LivingInstrumentCard {...BASE} channels="stereo" armed />)
    expect(screen.getByTestId('card-setpoint')).toHaveAttribute('data-active')
  })
})

// ── Armed shows the accent ──────────────────────────────────────────────────────

describe('LivingInstrumentCard — armed / active accent', () => {
  it('lights the body with the accent when armed', () => {
    render(<LivingInstrumentCard {...BASE} armed />)
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-active')
  })

  it('lights the body when selected (the "now" card)', () => {
    render(<LivingInstrumentCard {...BASE} selected />)
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-active')
  })

  it('does not light the body at rest', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTestId('card-body')).not.toHaveAttribute('data-active')
  })
})

// ── Master variant ──────────────────────────────────────────────────────────────

describe('LivingInstrumentCard — master variant', () => {
  it('hides input, fx and pan', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" />)
    expect(screen.queryByTestId('card-input')).toBeNull()
    expect(screen.queryByTestId('card-fx')).toBeNull()
    expect(screen.queryByTestId('card-pan')).toBeNull()
  })

  it('hides the ARM button', () => {
    render(<LivingInstrumentCard {...BASE} isMaster />)
    expect(screen.queryByRole('button', { name: /arm/i })).toBeNull()
  })

  it('still renders the body slider', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="Master" />)
    expect(screen.getByRole('slider', { name: /master level/i })).toBeInTheDocument()
  })

  it('falls back to the MASTER label when name is empty', () => {
    render(<LivingInstrumentCard {...BASE} isMaster name="" />)
    expect(screen.getByRole('group', { name: /master instrument/i })).toBeInTheDocument()
  })

  it('sets data-master', () => {
    render(<LivingInstrumentCard {...BASE} isMaster />)
    expect(screen.getByRole('group')).toHaveAttribute('data-master')
  })
})

// ── State attributes ────────────────────────────────────────────────────────────

describe('LivingInstrumentCard — data-* state', () => {
  it('sets data-armed', () => {
    render(<LivingInstrumentCard {...BASE} armed />)
    expect(screen.getByRole('group')).toHaveAttribute('data-armed')
  })
  it('sets data-muted', () => {
    render(<LivingInstrumentCard {...BASE} muted />)
    expect(screen.getByRole('group')).toHaveAttribute('data-muted')
  })
  it('sets data-soloed', () => {
    render(<LivingInstrumentCard {...BASE} soloed />)
    expect(screen.getByRole('group')).toHaveAttribute('data-soloed')
  })
  it('sets data-selected', () => {
    render(<LivingInstrumentCard {...BASE} selected />)
    expect(screen.getByRole('group')).toHaveAttribute('data-selected')
  })
  it('sets data-disabled', () => {
    render(<LivingInstrumentCard {...BASE} disabled />)
    expect(screen.getByRole('group')).toHaveAttribute('data-disabled')
  })
  it('marks the body live when a signal is present', () => {
    render(<LivingInstrumentCard {...BASE} meterL={-6} meterR={-8} />)
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-live')
  })
})

// ── Callbacks ───────────────────────────────────────────────────────────────────

describe('LivingInstrumentCard — callbacks', () => {
  it('calls onArm when ARM clicked', () => {
    const onArm = vi.fn()
    render(<LivingInstrumentCard {...BASE} onArm={onArm} />)
    fireEvent.click(screen.getByRole('button', { name: /arm/i }))
    expect(onArm).toHaveBeenCalledTimes(1)
  })

  it('calls onMute / onSolo', () => {
    const onMute = vi.fn()
    const onSolo = vi.fn()
    render(<LivingInstrumentCard {...BASE} onMute={onMute} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
    expect(onSolo).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when the card is clicked', () => {
    const onSelect = vi.fn()
    render(<LivingInstrumentCard {...BASE} onSelect={onSelect} />)
    fireEvent.click(screen.getByTitle('Guitar'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('does not select when the pan zone is used', () => {
    const onSelect = vi.fn()
    render(<LivingInstrumentCard {...BASE} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('card-pan'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('omits the ARM button when onArm is absent', () => {
    render(<LivingInstrumentCard {...BASE} onArm={undefined} />)
    expect(screen.queryByRole('button', { name: /arm/i })).toBeNull()
  })
})
