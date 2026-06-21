// src/components/AppShell/AppShell.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppShell } from './AppShell'
import type { AppShellProps } from './AppShell'
import type { RecordModeState, RecordModeValue } from '../RecordMode'

// ── Minimal fixture ───────────────────────────────────────────────────────────

const noop = () => {}

const BASE: AppShellProps = {
  activeSection:       'arrange',
  onSelectSection:     noop,
  playing:             false,
  recording:           false,
  playheadSeconds:     0,
  getPlayheadSeconds:  () => 0,
  bpm:                 120,
  numerator:           4,
  denominator:         4,
  loopEnabled:         false,
  recordState:         'idle' as RecordModeState,
  recordMode:          'normal' as RecordModeValue,
  selectionStart:      0,
  selectionEnd:        0,
  gridDivision:        '1/4',
  rate:                1,
  tracks:              [],
  pxPerBeat:           48,
  division:            '1/4',
  durationSeconds:     32,
  cursorSeconds:       0,
  selection:           null,
  focusedTrackId:      null,
  inputOptions:        [],
  chordItems:          [],
  lyricItems:          [],
  detailClips:         [],
  detailPlugins:       [],
  detailChainEnabled:  false,
  detailPanelHeight:   240,
  mixerOpen:           false,
  mixerChannels:       [],
  mixerMaster:         { muted: false, soloed: false, volumeDb: 0, pan: 0 },
  comments:            [],
  versions:            [],
  versionsSelected:    [],
  ideas:               [],
  ideasAppSyncUrl:     'https://example.com',
  onPlay:              noop,
  onStop:              noop,
  onGoToStart:         noop,
  onGoToEnd:           noop,
  onToggleRecord:      noop,
  onSelectRecordMode:  noop,
  onToggleLoop:        noop,
  onSetTempo:          noop,
  onSetTimeSignature:  noop,
  onToggleMixer:       noop,
  onSelectTrack:       noop,
  onSeek:              noop,
  onSelectRange:       noop,
  onClearSelection:    noop,
  onRenameTrack:       noop,
  onArmTrack:          noop,
  onMuteTrack:         noop,
  onSoloTrack:         noop,
  onVolumeTrack:       noop,
  onPanTrack:          noop,
  onSelectInput:       noop,
  onToggleChain:       noop,
  onTogglePlugin:      noop,
  onReorderPlugin:     noop,
  onRemovePlugin:      noop,
  onAddPlugin:         noop,
  onOpenPlugin:        noop,
  onDetailPanelResize: noop,
  onDetailPanelClose:  noop,
  onDetailToggleChain:   noop,
  onDetailTogglePlugin:  noop,
  onDetailReorderPlugin: noop,
  onDetailRemovePlugin:  noop,
  onDetailAddPlugin:     noop,
  onDetailOpenPlugin:    noop,
  onMixerMute:         noop,
  onMixerSolo:         noop,
  onMixerVolume:       noop,
  onMixerPan:          noop,
  onMasterVolume:      noop,
  onMasterPan:         noop,
  onPostComment:       noop,
  onReplyComment:      noop,
  onResolveComment:    noop,
  onVersionSelect:     noop,
  onVersionCompare:    noop,
  onVersionRename:     noop,
  onVersionRestore:    noop,
  onIdeaPlay:          noop,
  onIdeaDragToProject: noop,
  onIdeaLabel:         noop,
  onIdeaDelete:        noop,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppShell', () => {
  it('renders the shell root', () => {
    render(<AppShell {...BASE} />)
    expect(screen.getByTestId('app-shell')).toBeTruthy()
  })

  it('renders nav items', () => {
    render(<AppShell {...BASE} />)
    expect(screen.getByRole('navigation', { name: 'Application navigation' })).toBeTruthy()
  })

  it('renders the transport region', () => {
    render(<AppShell {...BASE} />)
    expect(screen.getByRole('toolbar', { name: 'Transport' })).toBeTruthy()
  })

  it('renders the arrangement region', () => {
    render(<AppShell {...BASE} />)
    expect(screen.getByRole('region', { name: 'Arrangement' })).toBeTruthy()
  })

  it('calls onSelectSection when a nav item is clicked', () => {
    const onSelectSection = vi.fn()
    render(<AppShell {...BASE} onSelectSection={onSelectSection} />)
    fireEvent.click(screen.getByRole('button', { name: 'Comments' }))
    expect(onSelectSection).toHaveBeenCalledWith('comments')
  })

  it('does not render CommentsPanel when section is arrange', () => {
    render(<AppShell {...BASE} activeSection="arrange" />)
    expect(screen.queryByTestId('comments-panel')).toBeNull()
  })

  it('renders CommentsPanel when section is comments', () => {
    render(<AppShell {...BASE} activeSection="comments" />)
    expect(screen.getByTestId('comments-panel')).toBeTruthy()
  })

  it('reflects versions section in data-section attribute', () => {
    render(<AppShell {...BASE} activeSection="versions" />)
    expect(screen.getByTestId('app-shell').dataset.section).toBe('versions')
  })

  it('reflects ideas section in data-section attribute', () => {
    render(<AppShell {...BASE} activeSection="ideas" />)
    expect(screen.getByTestId('app-shell').dataset.section).toBe('ideas')
  })

  it('hides the Mixer when mixerOpen is false', () => {
    render(<AppShell {...BASE} mixerOpen={false} />)
    expect(screen.queryByRole('region', { name: 'Mixer' })).toBeNull()
  })

  it('shows the Mixer when mixerOpen is true', () => {
    render(<AppShell {...BASE} mixerOpen={true} mixerChannels={[
      { trackId: 't1', name: 'Kick', color: '#e8a87c', kind: 'audio',
        armed: false, muted: false, soloed: false, volumeDb: 0, pan: 0 },
    ]} />)
    expect(screen.getByRole('region', { name: 'Mixer' })).toBeTruthy()
  })

  it('calls onToggleMixer when the mixer toggle button in transport is clicked', () => {
    const onToggleMixer = vi.fn()
    render(<AppShell {...BASE} mixerOpen={false} onToggleMixer={onToggleMixer} />)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle mixer' }))
    expect(onToggleMixer).toHaveBeenCalledWith(true)
  })

  it('does not render detail panel when detailTrack is undefined', () => {
    render(<AppShell {...BASE} detailTrack={undefined} />)
    expect(screen.queryByTestId('arrangement-detail-slot')).toBeNull()
  })

  it('renders detail panel when detailTrack is provided', () => {
    const detailTrack = {
      id: 'guitar', name: 'Guitar', color: 'var(--chroma-blue)',
      kind: 'audio' as const, armed: false, muted: false, soloed: false,
      volumeDb: -6, pan: 0,
    }
    render(<AppShell {...BASE} detailTrack={detailTrack} tracks={[{
      id: 'guitar', name: 'Guitar', color: 'var(--chroma-blue)',
      type: 'audio', armed: false, muted: false, soloed: false,
      volumeDb: -6, pan: 0, inputId: null, plugins: [], chainEnabled: true, clips: [],
    }]} />)
    expect(screen.getByTestId('arrangement-detail-slot')).toBeTruthy()
  })

  it('calls onDetailPanelClose when detail panel close button is clicked', () => {
    const onDetailPanelClose = vi.fn()
    const detailTrack = {
      id: 'guitar', name: 'Guitar', color: 'var(--chroma-blue)',
      kind: 'audio' as const, armed: false, muted: false, soloed: false,
      volumeDb: -6, pan: 0,
    }
    render(<AppShell {...BASE} detailTrack={detailTrack} onDetailPanelClose={onDetailPanelClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close inspector' }))
    expect(onDetailPanelClose).toHaveBeenCalled()
  })

  it('annotation lanes area not rendered when both lists are empty', () => {
    render(<AppShell {...BASE} chordItems={[]} lyricItems={[]} />)
    expect(screen.queryByLabelText('Annotation lanes')).toBeNull()
  })

  it('renders chord annotation lane when chordItems are provided', () => {
    const chordItems = [{ id: 'c1', start: 0, end: 4, text: 'Am' }]
    render(<AppShell {...BASE} chordItems={chordItems} />)
    expect(screen.getByTestId('annotation-lane')).toBeTruthy()
  })

  it('data-section attribute reflects activeSection', () => {
    const { rerender } = render(<AppShell {...BASE} activeSection="arrange" />)
    expect(screen.getByTestId('app-shell').dataset.section).toBe('arrange')
    rerender(<AppShell {...BASE} activeSection="comments" />)
    expect(screen.getByTestId('app-shell').dataset.section).toBe('comments')
  })

  it('right panel is hidden when section is arrange', () => {
    render(<AppShell {...BASE} activeSection="arrange" />)
    const rightPanel = screen.getByRole('complementary')
    expect(rightPanel.dataset.open).toBe('false')
  })

  it('right panel is shown when section is comments', () => {
    render(<AppShell {...BASE} activeSection="comments" />)
    const rightPanel = screen.getByRole('complementary', { name: 'Comments panel' })
    expect(rightPanel.dataset.open).toBe('true')
  })
})
