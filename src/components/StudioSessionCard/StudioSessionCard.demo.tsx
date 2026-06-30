// src/components/StudioSessionCard/StudioSessionCard.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { Fader } from '../Fader'
import { StudioSessionCard } from './StudioSessionCard'

export const meta: DemoMeta = {
  name: 'StudioSessionCard',
  group: 'Composites',
  route: '/studio-session-card',
  order: 128,
}

const noop = () => {}

// ─── States ───────────────────────────────────────────────────────────────────
// The card's true axes are mode (session / imported / new) × isOpening; the grid's
// nine required cells map onto those honestly (no invented disabled/selected/error
// props — a door is always openable and isn't a gallery selectable).

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default">
        {/* has-session — the real track count, lanes glowing in the window, last edited. */}
        <StudioSessionCard
          hasSession
          trackCount={4}
          importedFromMaster={false}
          lastEdited="2 hours ago"
          onOpenStudio={noop}
        />
      </State>

      <State label="hover">
        {/* Hover the CTA → it deepens and the door-arrow nudges forward. */}
        <StudioSessionCard
          hasSession
          trackCount={6}
          importedFromMaster={false}
          lastEdited="yesterday"
          onOpenStudio={noop}
        />
      </State>

      <State label="focus">
        {/* Tab to the CTA → :focus-visible accent ring. */}
        <StudioSessionCard
          hasSession
          trackCount={3}
          importedFromMaster={false}
          lastEdited="just now"
          onOpenStudio={noop}
        />
      </State>

      <State label="active">
        {/* Press the CTA → it seats 1px like a real key. */}
        <StudioSessionCard
          hasSession
          trackCount={8}
          importedFromMaster
          lastEdited="3 days ago"
          onOpenStudio={noop}
        />
      </State>

      <State label="disabled">
        {/* No `disabled` prop — the only non-interactive state is Opening (CTA owns the load). */}
        <StudioSessionCard
          hasSession
          trackCount={4}
          importedFromMaster={false}
          lastEdited="2 hours ago"
          isOpening
          onOpenStudio={noop}
        />
      </State>

      <State label="selected">
        {/* Not selectable — shown: a large session (12 tracks) → "+N" overflow plate in the window. */}
        <StudioSessionCard
          hasSession
          trackCount={12}
          importedFromMaster={false}
          lastEdited="last week"
          onOpenStudio={noop}
        />
      </State>

      <State label="error">
        {/* No error state — the closest attention state is the no-session "new song" prompt. */}
        <StudioSessionCard
          hasSession={false}
          trackCount={0}
          importedFromMaster={false}
          onOpenStudio={noop}
        />
      </State>

      <State label="empty">
        {/* The genuine empty: imported master, no session yet — dark room, lights off. */}
        <StudioSessionCard
          hasSession={false}
          trackCount={0}
          importedFromMaster
          onOpenStudio={noop}
        />
      </State>

      <State label="loading">
        {/* Opening… — the spinner turns, the CTA goes busy + disabled. */}
        <StudioSessionCard
          hasSession
          trackCount={6}
          importedFromMaster={false}
          lastEdited="yesterday"
          isOpening
          onOpenStudio={noop}
        />
      </State>
    </StatesGrid>
  )
}

// ─── Gallery row — the three modes side by side, on the song-page paper face ──────

function GalleryRow() {
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--text)',
        margin: '0 0 var(--space-4)',
      }}>
        The door into the studio
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        <StudioSessionCard hasSession trackCount={5} importedFromMaster={false} lastEdited="2 hours ago" onOpenStudio={noop} />
        <StudioSessionCard hasSession={false} trackCount={0} importedFromMaster onOpenStudio={noop} />
        <StudioSessionCard hasSession trackCount={24} importedFromMaster lastEdited="last month" onOpenStudio={noop} />
        {/* sm density — a tighter song-page column. */}
        <StudioSessionCard hasSession trackCount={3} importedFromMaster={false} lastEdited="just now" size="sm" onOpenStudio={noop} />
      </div>
    </section>
  )
}

// ─── Playground — dogfood Toggle / Checkbox / Fader ─────────────────────────────

function PlaygroundDemo() {
  const [hasSession, setHasSession] = useState(true)
  const [imported, setImported] = useState(false)
  const [withLastEdited, setWithLastEdited] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const [small, setSmall] = useState(false)
  const [trackCount, setTrackCount] = useState(4)
  const [lastAction, setLastAction] = useState('')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 280 }}>
          <StudioSessionCard
            hasSession={hasSession}
            trackCount={trackCount}
            importedFromMaster={imported}
            lastEdited={withLastEdited ? '2 hours ago' : undefined}
            isOpening={isOpening}
            size={small ? 'sm' : 'md'}
            onOpenStudio={() => setLastAction('onOpenStudio')}
          />
        </div>

        {/* ── Controls — dogfood Toggle / Checkbox / Fader ───────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 220 }}>
          <Toggle checked={hasSession} onChange={setHasSession} size="sm" label="has session" />
          <Toggle checked={imported} onChange={setImported} size="sm" label="imported from master" />
          <Checkbox checked={withLastEdited} onChange={setWithLastEdited} size="sm" label="last edited" />
          <Checkbox checked={isOpening} onChange={setIsOpening} size="sm" label="opening…" />
          <Checkbox checked={small} onChange={setSmall} size="sm" label="small density" />

          <label style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-2)',
            fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
          }}>
            track count — {trackCount}
            <Fader
              value={trackCount}
              min={0}
              max={24}
              step={1}
              onChange={(v) => setTrackCount(Math.round(v))}
              size="sm"
              orientation="horizontal"
              aria-label="track count"
            />
          </label>

          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent)',
              background: 'var(--stage)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-2) var(--space-3)',
            }}>
              {lastAction}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function StudioSessionCardDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <GalleryRow />
      <PlaygroundDemo />
    </DemoShell>
  )
}
