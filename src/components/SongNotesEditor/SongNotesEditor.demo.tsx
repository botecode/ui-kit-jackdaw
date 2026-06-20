import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SongNotesEditor } from './SongNotesEditor'

export const meta: DemoMeta = {
  name: 'SongNotesEditor',
  group: 'Composites',
  route: '/song-notes-editor',
  order: 50,
}

// ── Fixture content ───────────────────────────────────────────────────────────

const FIXTURE_WITH_CONTENT = `# Midnight Sessions

Working title for this one. **Key of A minor** — feels right for the mood.

## Arrangement ideas

Try bringing in the *cello* earlier, maybe bar 4 instead of 8. The verse feels too sparse.

- Double the bass on the chorus
- Cut the bridge by 8 bars
- Add reverb tail on the outro pad

## Tasks

[ ] Record scratch vocals
[x] Fix the click track timing issue
[ ] Send rough mix to Marcus`

const FIXTURE_LONG = `# Live at the Roundhouse

Everything below is work-in-progress thinking. Do not share yet.

## Setlist ideas

Working from the new album forward, then dip into the earlier stuff mid-set.

- River Song (opener — crowd knows it)
- Paper Walls
- Glass House
- **Midnight Sessions** (new single, front-load it)
- Interlude / ambient piece — 3 min
- Letters to Nobody
- The Return
- Encore: just the two of us, acoustic, no mics

## Stage plot

[ ] Talk to venue about the riser height
[ ] Confirm FOH has the stems backup
[x] Send tech rider to Roundhouse crew
[ ] Order extra drum heads — Lars says his are shot

## Notes from soundcheck

The room has a weird flutter echo between 2kHz and 4kHz. Ask FOH to notch it. *Do not boost the hi-hats* — they cut through already.

**Sidechain the kick into the bass** on the loud songs. This worked brilliantly at Brixton.

## After show

- Press photos at 10pm
- Meet and greet: 30 min cap, no exceptions
- Bus call: midnight`

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  const noop = () => {}

  return (
    <StatesGrid>
      <State label="Empty (placeholder)">
        <SongNotesEditor value="" onChange={noop} />
      </State>

      <State label="With content">
        <SongNotesEditor value={FIXTURE_WITH_CONTENT} onChange={noop} />
      </State>

      <State label="Focused">
        {/* autoFocus via the contenteditable would need a ref; we show the focus ring via CSS demo */}
        <SongNotesEditor
          value="Click here to focus — the warm focus ring appears around the notebook."
          onChange={noop}
        />
      </State>

      <State label="Long (scrolls)">
        <SongNotesEditor value={FIXTURE_LONG} onChange={noop} />
      </State>

      <State label="Read-only">
        <SongNotesEditor
          value={FIXTURE_WITH_CONTENT}
          onChange={noop}
          readOnly
        />
      </State>

      <State label="Disabled">
        <SongNotesEditor
          value="Disabled state — muted and not interactive."
          onChange={noop}
          disabled
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [value, setValue] = useState(FIXTURE_WITH_CONTENT)
  const [readOnly, setReadOnly] = useState(false)
  const [disabled, setDisabled] = useState(false)

  return (
    <Playground>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        {/* Live editor */}
        <SongNotesEditor
          value={value}
          onChange={setValue}
          readOnly={readOnly}
          disabled={disabled}
          aria-label="Song notes playground"
        />

        {/* Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Toggle
            checked={readOnly}
            onChange={(next) => setReadOnly(next)}
            size="sm"
            label="readOnly"
          />
          <Toggle
            checked={disabled}
            onChange={(next) => setDisabled(next)}
            size="sm"
            label="disabled"
          />
        </div>

        {/* Markdown source preview — shows what value prop contains */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--stage-text)',
            backgroundColor: 'var(--stage)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '160px',
            overflowY: 'auto',
          }}
        >
          {value || '(empty)'}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function SongNotesEditorDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
