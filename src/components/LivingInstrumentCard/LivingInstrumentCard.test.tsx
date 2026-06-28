// src/components/LivingInstrumentCard/LivingInstrumentCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

// Give the body a measurable height so drag math has travel in jsdom.
function mockBodyHeight(el: HTMLElement, height = 200) {
  el.getBoundingClientRect = () =>
    ({ height, width: 160, top: 0, left: 0, right: 160, bottom: height, x: 0, y: 0, toJSON: () => {} }) as DOMRect
}

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

  it('exposes the body as a vertical slider over volumeDb', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-6} />)
    const body = screen.getByRole('slider', { name: /guitar level/i })
    expect(body).toHaveAttribute('aria-orientation', 'vertical')
    expect(body).toHaveAttribute('aria-valuemin', '-60')
    expect(body).toHaveAttribute('aria-valuemax', '6')
    expect(body).toHaveAttribute('aria-valuenow', '-6')
  })

  it('renders the dB readout', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-12} />)
    expect(screen.getByText('-12.0')).toBeInTheDocument()
  })

  it('shows −∞ at the floor', () => {
    render(<LivingInstrumentCard {...BASE} volumeDb={-60} />)
    expect(screen.getByText('−∞')).toBeInTheDocument()
  })

  it('renders input, fx and pan controls for a normal track', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTestId('card-input')).toBeInTheDocument()
    expect(screen.getByTestId('card-fx')).toBeInTheDocument()
    expect(screen.getByTestId('card-pan')).toBeInTheDocument()
  })
})

// ── The body is the fader (drag + keyboard) ─────────────────────────────────────

describe('LivingInstrumentCard — body is the fader', () => {
  it('dragging the body up raises volumeDb', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={0} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 150, pointerId: 1 })
    fireEvent.pointerMove(body, { clientY: 40 }) // dragged up 110px
    fireEvent.pointerUp(body)
    expect(onVolumeChange).toHaveBeenCalled()
    expect(onVolumeChange.mock.calls[onVolumeChange.mock.calls.length - 1][0]).toBeGreaterThan(0)
  })

  it('dragging the body down lowers volumeDb', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={0} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 40, pointerId: 1 })
    fireEvent.pointerMove(body, { clientY: 150 }) // dragged down 110px
    fireEvent.pointerUp(body)
    expect(onVolumeChange.mock.calls[onVolumeChange.mock.calls.length - 1][0]).toBeLessThan(0)
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
    fireEvent.keyDown(screen.getByTestId('card-body'), { key: 'ArrowUp' })
    expect(onVolumeChange).toHaveBeenCalledWith(-9)
  })

  it('ArrowDown nudges volumeDb down by 1 dB', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} volumeDb={-10} onVolumeChange={onVolumeChange} />)
    fireEvent.keyDown(screen.getByTestId('card-body'), { key: 'ArrowDown' })
    expect(onVolumeChange).toHaveBeenCalledWith(-11)
  })

  it('End jumps to the ceiling, Home to the floor', () => {
    const onVolumeChange = vi.fn()
    render(<LivingInstrumentCard {...BASE} onVolumeChange={onVolumeChange} />)
    const body = screen.getByTestId('card-body')
    fireEvent.keyDown(body, { key: 'End' })
    expect(onVolumeChange).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(body, { key: 'Home' })
    expect(onVolumeChange).toHaveBeenLastCalledWith(-60)
  })
})

// ── Display-only fallback ───────────────────────────────────────────────────────

describe('LivingInstrumentCard — display-only body', () => {
  it('is non-interactive when onVolumeChange is absent', () => {
    render(<LivingInstrumentCard {...BASE} onVolumeChange={undefined} />)
    const body = screen.getByTestId('card-body')
    expect(body).toHaveAttribute('tabindex', '-1')
    expect(body).toHaveAttribute('aria-readonly', 'true')
  })

  it('ignores drag when display-only', () => {
    render(<LivingInstrumentCard {...BASE} onVolumeChange={undefined} />)
    const body = screen.getByTestId('card-body')
    mockBodyHeight(body)
    fireEvent.pointerDown(body, { clientY: 100, pointerId: 1 })
    expect(body).not.toHaveAttribute('data-dragging')
  })
})

// ── Pan leans the fill (favoured side only) ─────────────────────────────────────

describe('LivingInstrumentCard — pan lean', () => {
  it('centres the fill at pan 0 (full width)', () => {
    render(<LivingInstrumentCard {...BASE} pan={0} />)
    const fill = screen.getByTestId('card-fill')
    expect(fill).toHaveAttribute('data-lean', 'center')
    expect(fill.style.getPropertyValue('--fill-scale')).toBe('1')
  })

  it('leans the fill right and narrows it when panned right', () => {
    render(<LivingInstrumentCard {...BASE} pan={0.6} />)
    const fill = screen.getByTestId('card-fill')
    expect(fill).toHaveAttribute('data-lean', 'right')
    expect(Number(fill.style.getPropertyValue('--fill-scale'))).toBeLessThan(1)
  })

  it('leans the fill left when panned left', () => {
    render(<LivingInstrumentCard {...BASE} pan={-0.6} />)
    expect(screen.getByTestId('card-fill')).toHaveAttribute('data-lean', 'left')
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
    expect(screen.getByTestId('card-fill')).toHaveAttribute('data-active')
  })

  it('lights the body when selected (the "now" card)', () => {
    render(<LivingInstrumentCard {...BASE} selected />)
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-active')
  })

  it('does not light the body at rest', () => {
    render(<LivingInstrumentCard {...BASE} />)
    expect(screen.getByTestId('card-body')).not.toHaveAttribute('data-active')
  })

  it('reflects the set level as lit fader segments', () => {
    const { container } = render(<LivingInstrumentCard {...BASE} volumeDb={0} />)
    const fader = container.querySelectorAll('[data-zone="fader"]')
    expect(fader.length).toBeGreaterThan(0)
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

  it('does not select when a control is clicked', () => {
    const onSelect = vi.fn()
    render(<LivingInstrumentCard {...BASE} onSelect={onSelect} />)
    const pan = screen.getByTestId('card-pan')
    fireEvent.click(within(pan).getByRole('slider'))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('omits the ARM button when onArm is absent', () => {
    render(<LivingInstrumentCard {...BASE} onArm={undefined} />)
    expect(screen.queryByRole('button', { name: /arm/i })).toBeNull()
  })
})
