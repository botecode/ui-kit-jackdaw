// src/components/HighMode/HighMode.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { HighMode, type HighInstrumentOption } from './HighMode'

const INSTRUMENTS: HighInstrumentOption[] = [
  { id: 'gtr', name: 'Guitar', color: 'var(--track-color-1)', input: 'In 1 · Mono' },
  { id: 'voc', name: 'Vocals', color: 'var(--track-color-3)', input: 'In 2 · Mono' },
  { id: 'keys', name: 'Keys', color: 'var(--track-color-4)', input: 'In 3 · Mono' },
]

function setup(props: Partial<React.ComponentProps<typeof HighMode>> = {}) {
  return render(<HighMode instruments={INSTRUMENTS} bpm={120} {...props} />)
}

beforeEach(() => {
  // jsdom: stub matchMedia for the kit's reduced-motion reads.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  })
})

describe('HighMode — how it works (intro)', () => {
  it('opens on the capture explainer by default', () => {
    setup()
    expect(screen.getByText("Just play. We'll catch it.")).toBeInTheDocument()
  })

  it('continues from the explainer into the instrument pick', () => {
    setup()
    expect(screen.queryByText('What are you playing?')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /got it, let's play/i }))
    expect(screen.getByText('What are you playing?')).toBeInTheDocument()
  })

  it('leaving from the explainer exits High mode', () => {
    const onExit = vi.fn()
    setup({ onExit })
    fireEvent.click(screen.getByRole('button', { name: /leave the nest/i }))
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})

describe('HighMode — select', () => {
  it('opens on the "what are you playing?" pick', () => {
    setup({ initialPhase: 'selecting' })
    expect(screen.getByText('What are you playing?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guitar' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('cannot proceed with nothing picked', () => {
    setup({ initialPhase: 'selecting' })
    expect(screen.getByRole('button', { name: /set up inputs/i })).toBeDisabled()
  })

  it('selects a card on click', () => {
    setup({ initialPhase: 'selecting' })
    fireEvent.click(screen.getByRole('button', { name: 'Guitar' }))
    expect(screen.getByRole('button', { name: 'Guitar' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /set up inputs/i })).toBeEnabled()
  })

  it('enforces the max selection (1–2)', () => {
    setup({ maxSelect: 2, initialPhase: 'selecting' })
    fireEvent.click(screen.getByRole('button', { name: 'Guitar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vocals' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keys' }))
    const pressed = ['Guitar', 'Vocals', 'Keys'].filter(
      n => screen.getByRole('button', { name: n }).getAttribute('aria-pressed') === 'true',
    )
    expect(pressed).toHaveLength(2)
  })
})

describe('HighMode — setup (soundcheck)', () => {
  it('selection lands on the input/FX setup screen with a card per chosen instrument', () => {
    setup({ initialPhase: 'selecting', initialSelectedIds: ['gtr', 'voc'] })
    fireEvent.click(screen.getByRole('button', { name: /set up inputs/i }))
    expect(screen.getByText('Dial in your inputs')).toBeInTheDocument()
    // A LivingInstrumentCard per chosen instrument (role=group, "<name> instrument").
    expect(screen.getByRole('group', { name: 'Guitar instrument' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Vocals instrument' })).toBeInTheDocument()
    // Each card exposes input + FX + level controls.
    expect(screen.getByRole('slider', { name: 'Guitar level' })).toBeInTheDocument()
  })

  it('starts the tape from the setup screen', () => {
    setup({ initialPhase: 'setup', initialSelectedIds: ['gtr'] })
    fireEvent.click(screen.getByRole('button', { name: /start the tape/i }))
    expect(screen.getByText(/listening for your idea/i)).toBeInTheDocument()
  })
})

describe('HighMode — setup FX (host-driven, presentational)', () => {
  it('renders an instrument\'s FX chain straight from props', () => {
    setup({
      initialPhase: 'setup',
      initialSelectedIds: ['gtr'],
      fx: { gtr: { plugins: [{ id: 'eq', name: 'EQ', enabled: true }, { id: 'comp', name: 'Comp', enabled: false }], chainEnabled: true } },
    })
    // Open the Guitar FX chain panel (the studio card's real FxChip affordance).
    fireEvent.click(screen.getByRole('button', { name: 'Guitar FX' }))
    // Plugins come from props, not a fabricated default chain.
    expect(screen.getByRole('checkbox', { name: 'EQ' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Comp' })).toBeInTheDocument()
  })

  it('an instrument with no FX shows an empty chain (no seeded default)', () => {
    setup({ initialPhase: 'setup', initialSelectedIds: ['gtr'] }) // no fx prop → fresh instrument
    const chip = screen.getByRole('button', { name: 'Guitar FX' })
    expect(chip).toHaveTextContent('+ FX')
    fireEvent.click(chip)
    // No plugins seeded — the old DEFAULT_FX() (EQ/Comp/Reverb) is gone.
    expect(screen.queryByRole('checkbox', { name: 'EQ' })).not.toBeInTheDocument()
  })

  it('“+ Add plugin…” fires onFxAdd(instrumentId) and appends no placeholder', () => {
    const onFxAdd = vi.fn()
    setup({
      initialPhase: 'setup',
      initialSelectedIds: ['gtr'],
      fx: { gtr: { plugins: [], chainEnabled: true } },
      onFxAdd,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guitar FX' }))
    fireEvent.click(screen.getByRole('button', { name: /add plugin/i }))
    // Fires the intent — the host opens the real picker.
    expect(onFxAdd).toHaveBeenCalledTimes(1)
    expect(onFxAdd).toHaveBeenCalledWith('gtr')
    // …and nothing is fabricated locally (no "New FX" placeholder).
    expect(screen.queryByRole('checkbox', { name: /new fx/i })).not.toBeInTheDocument()
  })

  it('toggling a plugin fires onFxTogglePlugin(instrumentId, fxId, next)', () => {
    const onFxTogglePlugin = vi.fn()
    setup({
      initialPhase: 'setup',
      initialSelectedIds: ['gtr'],
      fx: { gtr: { plugins: [{ id: 'eq', name: 'EQ', enabled: true }], chainEnabled: true } },
      onFxTogglePlugin,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guitar FX' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'EQ' }))
    expect(onFxTogglePlugin).toHaveBeenCalledWith('gtr', 'eq', false)
  })
})

describe('HighMode — record', () => {
  it('moves inputs to topbar arm pills (selected armed, others off) + metronome', () => {
    setup({ initialPhase: 'recording', initialSelectedIds: ['gtr', 'voc'] })
    // Every instrument is an arm pill; the picked two are armed, the rest off.
    expect(screen.getByRole('button', { name: /guitar — armed/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /vocals — armed/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /keys — off/i })).toHaveAttribute('aria-pressed', 'false')
    // The metronome click control is present.
    expect(screen.getByRole('button', { name: /metronome click/i })).toBeInTheDocument()
  })

  it('shows the live capture track', () => {
    setup({ initialPhase: 'recording', initialSelectedIds: ['gtr'] })
    expect(screen.getByText(/listening for your idea/i)).toBeInTheDocument()
  })

  it('arms / unarms a track from the topbar pill', () => {
    setup({ initialPhase: 'recording', initialSelectedIds: ['gtr'] })
    expect(screen.getByRole('button', { name: /vocals — off/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /vocals — off/i }))
    expect(screen.getByRole('button', { name: /vocals — armed/i })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /guitar — armed/i }))
    expect(screen.getByRole('button', { name: /guitar — off/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('caps arming at two instruments', () => {
    setup({ initialPhase: 'recording', initialSelectedIds: ['gtr', 'voc'], maxSelect: 2 })
    // A third arm is a no-op while two are already armed.
    fireEvent.click(screen.getByRole('button', { name: /keys — off/i }))
    expect(screen.getByRole('button', { name: /keys — off/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /guitar — armed/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /vocals — armed/i })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('HighMode — pause → processing → takes', () => {
  it('pausing runs processing then reveals the takes', async () => {
    setup({ initialPhase: 'recording', initialSelectedIds: ['gtr', 'voc'], processingMs: 0, takesCount: 3 })
    fireEvent.click(screen.getByRole('button', { name: /pause and review/i }))
    // Processing cue first…
    expect(screen.getByText('Processing your takes')).toBeInTheDocument()
    // …then the takes review.
    expect(await screen.findByText('Keep the bits you love')).toBeInTheDocument()
    expect(screen.getByText('Take 1')).toBeInTheDocument()
    expect(screen.getByText('Take 3')).toBeInTheDocument()
  })
})

describe('HighMode — review', () => {
  it('renders a playable, trimmable take per split', () => {
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, takesCount: 3 })
    expect(screen.getAllByRole('slider', { name: 'Trim start' })).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /play take/i })).toHaveLength(3)
  })

  it('trimming a take updates its range', () => {
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, takesCount: 1 })
    const start = screen.getByRole('slider', { name: 'Trim start' })
    const before = Number(start.getAttribute('aria-valuenow'))
    fireEvent.keyDown(start, { key: 'ArrowRight' })
    const after = Number(screen.getByRole('slider', { name: 'Trim start' }).getAttribute('aria-valuenow'))
    expect(after).toBeGreaterThan(before)
  })

  it('toggles take playback (play → pause label)', () => {
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, takesCount: 1 })
    fireEvent.click(screen.getByRole('button', { name: /play take 1/i }))
    expect(screen.getByRole('button', { name: /pause take 1/i })).toBeInTheDocument()
  })

  it('"+ save" opens the name modal and saves an idea to the nest', () => {
    const onSaveIdea = vi.fn()
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, takesCount: 1, onSaveIdea })
    // The take's own save button (HighTake → "save").
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Name this idea')).toBeInTheDocument()
    const input = within(dialog).getByLabelText('Idea name')
    fireEvent.change(input, { target: { value: 'Kitchen riff' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /save to ideas/i }))
    expect(onSaveIdea).toHaveBeenCalledTimes(1)
    expect(onSaveIdea.mock.calls[0][0]).toMatchObject({ name: 'Kitchen riff', takeId: 'take-1', bpm: 120 })
  })

  it('marks the take saved after saving', () => {
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, takesCount: 1, onSaveIdea: vi.fn() })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /save to ideas/i }))
    expect(screen.getByText(/Take 1 · saved/)).toBeInTheDocument()
  })
})

describe('HighMode — close confirm', () => {
  it('closing the session asks to save or discard', () => {
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4 })
    fireEvent.click(screen.getByRole('button', { name: /close session/i }))
    expect(screen.getByText('Keep this High session?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep session/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /discard session/i })).toBeInTheDocument()
  })

  it('keep session fires onKeepSession then onExit', () => {
    const onKeepSession = vi.fn()
    const onExit = vi.fn()
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, onKeepSession, onExit })
    fireEvent.click(screen.getByRole('button', { name: /close session/i }))
    fireEvent.click(screen.getByRole('button', { name: /keep session/i }))
    expect(onKeepSession).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('discard session fires onDiscardSession then onExit', () => {
    const onDiscardSession = vi.fn()
    const onExit = vi.fn()
    setup({ initialPhase: 'reviewing', initialSelectedIds: ['gtr'], takesSeed: 4, onDiscardSession, onExit })
    fireEvent.click(screen.getByRole('button', { name: /close session/i }))
    fireEvent.click(screen.getByRole('button', { name: /discard session/i }))
    expect(onDiscardSession).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
  })
})
