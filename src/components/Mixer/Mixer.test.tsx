// src/components/Mixer/Mixer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { Mixer } from './Mixer'
import type { MixerChannel, MixerMaster, MixerProps } from './Mixer'

const MASTER: MixerMaster = {
  name: 'Master',
  muted: false,
  soloed: false,
  volumeDb: 0,
  pan: 0,
}

const TRACKS: MixerChannel[] = [
  {
    trackId: 'tk-1',
    name: 'Kick',
    color: '#e8a87c',
    kind: 'audio',
    armed: false,
    muted: false,
    soloed: false,
    volumeDb: 0,
    pan: 0,
  },
  {
    trackId: 'tk-2',
    name: 'Snare',
    color: '#e47a7a',
    kind: 'audio',
    armed: false,
    muted: false,
    soloed: false,
    volumeDb: -3,
    pan: 0.1,
  },
  {
    trackId: 'tk-3',
    name: 'Drums',
    color: '#7ec8a4',
    kind: 'folder',
    armed: false,
    muted: false,
    soloed: false,
    volumeDb: 0,
    pan: 0,
  },
]

const BASE: MixerProps = {
  tracks: TRACKS,
  master: MASTER,
  open: true,
  onToggle: vi.fn(),
  onMute: vi.fn(),
  onSolo: vi.fn(),
  onVolume: vi.fn(),
  onPan: vi.fn(),
  onMasterVolume: vi.fn(),
  onMasterPan: vi.fn(),
}

beforeEach(() => vi.clearAllMocks())

// ── Visibility ────────────────────────────────────────────────────────────────

describe('Mixer — visibility', () => {
  it('renders when open=true', () => {
    render(<Mixer {...BASE} open />)
    expect(screen.getByRole('region', { name: /mixer/i })).toBeInTheDocument()
  })

  it('renders nothing when open=false', () => {
    render(<Mixer {...BASE} open={false} />)
    expect(screen.queryByRole('region', { name: /mixer/i })).toBeNull()
  })
})

// ── Master strip ──────────────────────────────────────────────────────────────

describe('Mixer — master strip', () => {
  it('renders the master channel group', () => {
    render(<Mixer {...BASE} />)
    expect(screen.getByRole('group', { name: /master channel/i })).toBeInTheDocument()
  })

  it('master strip has data-master attribute', () => {
    render(<Mixer {...BASE} />)
    expect(screen.getByRole('group', { name: /master channel/i }))
      .toHaveAttribute('data-master')
  })
})

// ── Track strips ──────────────────────────────────────────────────────────────

describe('Mixer — track strips', () => {
  it('renders a channel group for each track', () => {
    render(<Mixer {...BASE} />)
    expect(screen.getByRole('group', { name: /kick channel/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /snare channel/i })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /drums channel/i })).toBeInTheDocument()
  })

  it('renders the scrollable track list', () => {
    render(<Mixer {...BASE} />)
    expect(screen.getByRole('list', { name: /track channels/i })).toBeInTheDocument()
  })

  it('renders folder strips inline without ARM button', () => {
    render(<Mixer {...BASE} onArm={vi.fn()} />)
    const drumsGroup = screen.getByRole('group', { name: /drums channel/i })
    expect(drumsGroup).toHaveAttribute('data-kind', 'folder')
  })

  it('renders ARM button for audio tracks when onArm is provided', () => {
    render(<Mixer {...BASE} onArm={vi.fn()} />)
    // Kick and Snare are audio; Drums is folder — only audio get ARM
    const armButtons = screen.getAllByRole('button', { name: /arm for recording/i })
    expect(armButtons.length).toBe(2)
  })
})

// ── Solo dimming ──────────────────────────────────────────────────────────────

describe('Mixer — solo dimming', () => {
  it('dims non-soloed channels when one track is soloed', () => {
    const soloedTracks: MixerChannel[] = [
      { ...TRACKS[0], soloed: true },
      { ...TRACKS[1], soloed: false },
      { ...TRACKS[2], soloed: false },
    ]
    render(<Mixer {...BASE} tracks={soloedTracks} />)

    expect(screen.getByRole('group', { name: /kick channel/i }))
      .not.toHaveAttribute('data-dimmed')
    expect(screen.getByRole('group', { name: /snare channel/i }))
      .toHaveAttribute('data-dimmed')
  })

  it('does not dim any channel when no solo is active', () => {
    render(<Mixer {...BASE} />)
    TRACKS.forEach(t => {
      expect(screen.getByRole('group', { name: `${t.name} channel` }))
        .not.toHaveAttribute('data-dimmed')
    })
  })

  it('dims non-soloed tracks when master is soloed', () => {
    render(<Mixer {...BASE} master={{ ...MASTER, soloed: true }} />)
    expect(screen.getByRole('group', { name: /kick channel/i }))
      .toHaveAttribute('data-dimmed')
  })
})

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe('Mixer — callbacks', () => {
  it('calls onMute with trackId and toggled state when Mute clicked', () => {
    const onMute = vi.fn()
    render(<Mixer {...BASE} onMute={onMute} />)
    const kickGroup = screen.getByRole('group', { name: /kick channel/i })
    fireEvent.click(within(kickGroup).getByRole('button', { name: /mute/i }))
    expect(onMute).toHaveBeenCalledWith('tk-1', true)
  })

  it('calls onSolo with trackId when Solo clicked', () => {
    const onSolo = vi.fn()
    render(<Mixer {...BASE} onSolo={onSolo} />)
    const kickGroup = screen.getByRole('group', { name: /kick channel/i })
    fireEvent.click(within(kickGroup).getByRole('button', { name: /solo/i }))
    expect(onSolo).toHaveBeenCalledWith('tk-1', true)
  })

  it('calls onArm with trackId when ARM clicked', () => {
    const onArm = vi.fn()
    render(<Mixer {...BASE} onArm={onArm} />)
    const [kickArm] = screen.getAllByRole('button', { name: /arm for recording/i })
    fireEvent.click(kickArm)
    expect(onArm).toHaveBeenCalledWith('tk-1')
  })

  it('calls onSelectTrack when a strip is clicked', () => {
    const onSelectTrack = vi.fn()
    render(<Mixer {...BASE} onSelectTrack={onSelectTrack} />)
    fireEvent.click(screen.getByRole('group', { name: /kick channel/i }))
    expect(onSelectTrack).toHaveBeenCalledWith('tk-1')
  })

  it('calls onMasterMute when master Mute clicked', () => {
    const onMasterMute = vi.fn()
    render(<Mixer {...BASE} onMasterMute={onMasterMute} />)
    // Master mute is the first mute button (master strip is first)
    const muteBtns = screen.getAllByRole('button', { name: /mute/i })
    fireEvent.click(muteBtns[0])
    expect(onMasterMute).toHaveBeenCalledWith(true)
  })
})

// ── Meters ────────────────────────────────────────────────────────────────────

describe('Mixer — meters', () => {
  it('does not show track meters by default when no meter values', () => {
    render(<Mixer {...BASE} />)
    // No meter labels expected for tracks without meterL/meterR
    expect(screen.queryAllByLabelText(/level/i)).toHaveLength(0)
  })

  it('shows meters when showAllMeters=true and meterL is provided', () => {
    const tracksWithMeters = TRACKS.map(t => ({ ...t, meterL: 0.5, meterR: 0.4 }))
    render(<Mixer {...BASE} tracks={tracksWithMeters} showAllMeters />)
    const meterLabels = screen.getAllByLabelText(/level/i)
    expect(meterLabels.length).toBeGreaterThan(0)
  })
})

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Mixer — empty tracks', () => {
  it('renders only master when tracks=[]', () => {
    render(<Mixer {...BASE} tracks={[]} />)
    expect(screen.getByRole('group', { name: /master channel/i })).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).toBeNull()
  })
})
