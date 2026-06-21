// src/components/ChannelStrip/ChannelStrip.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChannelStrip } from './ChannelStrip'
import type { ChannelStripProps } from './ChannelStrip'

const BASE: ChannelStripProps = {
  trackId: 'tk-1',
  name: 'Kick',
  color: '#e8a87c',
  kind: 'audio',
  armed: false,
  muted: false,
  soloed: false,
  volumeDb: 0,
  pan: 0,
  onArm: vi.fn(),
  onMute: vi.fn(),
  onSolo: vi.fn(),
  onVolume: vi.fn(),
  onPan: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ChannelStrip — rendering', () => {
  it('renders with accessible group label', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByRole('group', { name: /kick channel/i })).toBeInTheDocument()
  })

  it('renders track name', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByTitle('Kick')).toBeInTheDocument()
  })

  it('renders ARM button for audio kind', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByRole('button', { name: /arm for recording/i })).toBeInTheDocument()
  })

  it('renders Mute and Solo buttons', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
  })

  it('renders fader slider', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByRole('slider', { name: /kick volume/i })).toBeInTheDocument()
  })

  it('renders dB readout as +0.0 at unity gain', () => {
    render(<ChannelStrip {...BASE} />)
    expect(screen.getByText('+0.0')).toBeInTheDocument()
  })

  it('shows −∞ readout when volumeDb is at floor', () => {
    render(<ChannelStrip {...BASE} volumeDb={-60} />)
    expect(screen.getByText('−∞')).toBeInTheDocument()
  })

  it('shows negative readout for sub-unity volumes', () => {
    render(<ChannelStrip {...BASE} volumeDb={-12} />)
    expect(screen.getByText('-12.0')).toBeInTheDocument()
  })
})

// ── Master strip ──────────────────────────────────────────────────────────────

describe('ChannelStrip — master variant', () => {
  it('renders with master label when isMaster=true', () => {
    render(<ChannelStrip {...BASE} isMaster name="Master" />)
    expect(screen.getByRole('group', { name: /master channel/i })).toBeInTheDocument()
  })

  it('falls back to MASTER label when name is empty and isMaster', () => {
    render(<ChannelStrip {...BASE} isMaster name="" />)
    expect(screen.getByRole('group', { name: /master channel/i })).toBeInTheDocument()
  })

  it('does not render ARM button for master strip', () => {
    render(<ChannelStrip {...BASE} isMaster />)
    expect(screen.queryByRole('button', { name: /arm/i })).toBeNull()
  })

  it('sets data-master attribute', () => {
    render(<ChannelStrip {...BASE} isMaster />)
    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('data-master')
  })
})

// ── State attributes ──────────────────────────────────────────────────────────

describe('ChannelStrip — data-* state attributes', () => {
  it('sets data-armed when armed=true', () => {
    render(<ChannelStrip {...BASE} armed />)
    expect(screen.getByRole('group')).toHaveAttribute('data-armed')
  })

  it('sets data-muted when muted=true', () => {
    render(<ChannelStrip {...BASE} muted />)
    expect(screen.getByRole('group')).toHaveAttribute('data-muted')
  })

  it('sets data-soloed when soloed=true', () => {
    render(<ChannelStrip {...BASE} soloed />)
    expect(screen.getByRole('group')).toHaveAttribute('data-soloed')
  })

  it('sets data-selected when selected=true', () => {
    render(<ChannelStrip {...BASE} selected />)
    expect(screen.getByRole('group')).toHaveAttribute('data-selected')
  })

  it('sets data-dimmed when dimmed=true', () => {
    render(<ChannelStrip {...BASE} dimmed />)
    expect(screen.getByRole('group')).toHaveAttribute('data-dimmed')
  })

  it('sets data-disabled when disabled=true', () => {
    render(<ChannelStrip {...BASE} disabled />)
    expect(screen.getByRole('group')).toHaveAttribute('data-disabled')
  })

  it('sets data-kind="folder" for folder tracks', () => {
    render(<ChannelStrip {...BASE} kind="folder" />)
    expect(screen.getByRole('group')).toHaveAttribute('data-kind', 'folder')
  })

  it('does not set data-armed when armed=false', () => {
    render(<ChannelStrip {...BASE} armed={false} />)
    expect(screen.getByRole('group')).not.toHaveAttribute('data-armed')
  })
})

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('ChannelStrip — callbacks', () => {
  it('calls onArm when ARM button clicked', () => {
    const onArm = vi.fn()
    render(<ChannelStrip {...BASE} onArm={onArm} />)
    fireEvent.click(screen.getByRole('button', { name: /arm/i }))
    expect(onArm).toHaveBeenCalledTimes(1)
  })

  it('calls onMute when Mute clicked', () => {
    const onMute = vi.fn()
    render(<ChannelStrip {...BASE} onMute={onMute} />)
    fireEvent.click(screen.getByRole('button', { name: /mute/i }))
    expect(onMute).toHaveBeenCalledTimes(1)
  })

  it('calls onSolo when Solo clicked', () => {
    const onSolo = vi.fn()
    render(<ChannelStrip {...BASE} onSolo={onSolo} />)
    fireEvent.click(screen.getByRole('button', { name: /solo/i }))
    expect(onSolo).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when root is clicked', () => {
    const onSelect = vi.fn()
    render(<ChannelStrip {...BASE} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('group'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

// ── Meter visibility ──────────────────────────────────────────────────────────

describe('ChannelStrip — meter', () => {
  it('does not render meter when showMeter=false', () => {
    render(<ChannelStrip {...BASE} showMeter={false} meterL={0.5} meterR={0.5} />)
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByLabelText(/level/i)).toBeNull()
  })

  it('renders meter when showMeter=true and meterL is provided', () => {
    render(<ChannelStrip {...BASE} showMeter meterL={0.5} meterR={0.5} />)
    // Stereo meter renders two MeterChannel elements (L + R), each aria-labeled
    expect(screen.getAllByLabelText(/kick level/i).length).toBeGreaterThan(0)
  })

  it('does not render meter when showMeter=true but no meterL/meterR', () => {
    render(<ChannelStrip {...BASE} showMeter />)
    expect(screen.queryByLabelText(/level/i)).toBeNull()
  })
})

// ── Folder kind ───────────────────────────────────────────────────────────────

describe('ChannelStrip — folder kind', () => {
  it('does not render ARM button for folder kind (onArm not passed)', () => {
    render(<ChannelStrip {...BASE} kind="folder" onArm={undefined} />)
    expect(screen.queryByRole('button', { name: /arm/i })).toBeNull()
  })

  it('renders fader for folder kind', () => {
    render(<ChannelStrip {...BASE} kind="folder" />)
    expect(screen.getByRole('slider', { name: /kick volume/i })).toBeInTheDocument()
  })
})
