// src/components/LyricCRUD/LyricCRUD.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Checkbox } from '../Checkbox'
import { TextField } from '../TextField'
import { Dialog } from '../Dialog'
import { SongNotesEditor } from '../SongNotesEditor'
import { ProductFrame } from '../ProductFrame'
import { LyricCard, LyricList } from './LyricCRUD'
import type { LyricIdea } from './LyricCRUD'

export const meta: DemoMeta = {
  name: 'LyricCRUD',
  group: 'Composites',
  route: '/lyric-crud',
  order: 73,
}

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const day = 86_400_000
const t0 = Date.parse('2026-06-20T09:00:00Z')

const SEED: LyricIdea[] = [
  {
    id: 'l1',
    title: 'Rooftop in the Rain',
    text: 'We were chasing taxi lights\ndown a street that wouldn’t end\nholding everything but tight',
    comments: 'needs a bridge',
    createdAt: t0,
  },
  {
    id: 'l2',
    title: 'Slow Burn',
    text: 'low and patient like a fuse\nnothing here we want to lose',
    comments: 'chorus is too long',
    createdAt: t0 - day * 3,
  },
  {
    id: 'l3',
    title: 'Paper Moon',
    text: 'cut a crescent out of card\nhung it where the night went hard',
    comments: '',
    createdAt: t0 - day * 9,
  },
  {
    id: 'l4',
    title: 'Untitled idea',
    text: '',
    comments: 'just a title — voice memo on phone',
    createdAt: t0 - day * 14,
  },
]

const noop = () => {}

// ─── Box (consistent demo width) ─────────────────────────────────────────────────

function Box({ children, width = 360 }: { children: React.ReactNode; width?: number }) {
  return <div style={{ width, maxWidth: '100%' }}>{children}</div>
}

// ─── Staged card harness (gallery only) ──────────────────────────────────────────
// The card owns its own ⋮ menu; to show the menu-open state statically we click the
// real button on mount — no contract pollution, just driving the real DOM (the same
// approach DemoPlayer uses for its transient states). The delete-confirm scrim is a
// full-screen overlay, so that state is exercised interactively in the playground
// instead of stacked here.

function StagedMenu(props: React.ComponentProps<typeof LyricCard>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const btn = ref.current?.querySelector('[data-testid="lyric-menu-btn"]') as HTMLElement | null
    btn?.click()
  }, [])
  return <div ref={ref}><LyricCard {...props} /></div>
}

// ─── States ───────────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="list — with items">
        <Box>
          <LyricList lyrics={SEED} onEdit={noop} onShare={noop} onDelete={noop} onNew={noop} />
        </Box>
      </State>

      <State label="empty — nothing written yet">
        <Box>
          <LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} onNew={noop} />
        </Box>
      </State>

      <State label="default card">
        <Box width={320}>
          <LyricCard lyric={SEED[0]} onEdit={noop} onShare={noop} onDelete={noop} />
        </Box>
      </State>

      <State label="selected — open in editor">
        <Box width={320}>
          <LyricCard lyric={SEED[1]} onEdit={noop} onShare={noop} onDelete={noop} selected />
        </Box>
      </State>

      <State label="hover me — lift + accent spine">
        <Box width={320}>
          <LyricCard lyric={SEED[2]} onEdit={noop} onShare={noop} onDelete={noop} />
        </Box>
      </State>

      <State label="focus — title ring (Tab)">
        <Box width={320}>
          <LyricCard lyric={SEED[0]} onEdit={noop} onShare={noop} onDelete={noop} />
        </Box>
      </State>

      <State label="card ⋮ menu open">
        <Box width={320}>
          <StagedMenu lyric={SEED[0]} onEdit={noop} onShare={noop} onDelete={noop} />
        </Box>
      </State>

      <State label="no comment / empty body">
        <Box width={320}>
          <LyricCard lyric={SEED[3]} onEdit={noop} onShare={noop} onDelete={noop} />
        </Box>
      </State>

      <State label="disabled — locked / syncing">
        <Box width={320}>
          <LyricCard lyric={SEED[0]} onEdit={noop} onShare={noop} onDelete={noop} disabled />
        </Box>
      </State>

      <State label="loading — skeleton">
        <Box>
          <LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} loading />
        </Box>
      </State>

      <State label="error">
        <Box>
          <LyricList lyrics={[]} onEdit={noop} onShare={noop} onDelete={noop} error="You’re offline." />
        </Box>
      </State>

      <State label="sm size">
        <Box width={300}>
          <LyricList lyrics={SEED.slice(0, 3)} onEdit={noop} onShare={noop} onDelete={noop} onNew={noop} size="sm" />
        </Box>
      </State>
    </StatesGrid>
  )
}

// ─── Phone-frame preview ───────────────────────────────────────────────────────────

function PhonePreview() {
  return (
    <section style={{ marginTop: 'var(--space-8)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-base)',
          color: 'var(--text)',
          margin: '0 0 var(--space-4)',
        }}
      >
        On the app surface
      </h2>
      <ProductFrame
        variant="phone"
        caption="The lyric list as it reads inside the mobile Write tab"
      >
        <div style={{ padding: 'var(--space-3)', background: 'var(--bg)', minHeight: 520 }}>
          <LyricList lyrics={SEED} onEdit={noop} onShare={noop} onDelete={noop} onNew={noop} size="sm" />
        </div>
      </ProductFrame>
    </section>
  )
}

// ─── Live CRUD playground (dogfooded) ──────────────────────────────────────────────
// A working end-to-end CRUD: create / read / update / delete in local state, with
// the editor reached via the real onEdit intent. The editor itself is NOT rebuilt
// here — it's the app's Write screen, referenced via the kit's TextField +
// SongNotesEditor (rename = the title field), so this stays faithful to "open the
// editor, don't duplicate the composer."

interface Draft { id: string | null; title: string; text: string; comments: string }
const EMPTY_DRAFT: Draft = { id: null, title: '', text: '', comments: '' }

function PlaygroundDemo() {
  const [lyrics, setLyrics] = useState<LyricIdea[]>(SEED)
  const [compact, setCompact] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showEmpty, setShowEmpty] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [log, setLog] = useState('idle')

  const visible = showEmpty ? [] : lyrics
  const editing = lyrics.find(l => l.id === draft?.id) ?? null

  function openEditor(id: string) {
    const l = lyrics.find(x => x.id === id)
    if (!l) return
    setDraft({ id: l.id, title: l.title, text: l.text, comments: l.comments })
    setLog(`edit → ${id}`)
  }

  function openNew() {
    setDraft({ ...EMPTY_DRAFT })
    setLog('new draft')
  }

  function saveDraft() {
    if (!draft) return
    const title = draft.title.trim() || 'Untitled'
    if (draft.id) {
      const id = draft.id
      setLyrics(prev => prev.map(l => (l.id === id ? { ...l, title, text: draft.text, comments: draft.comments } : l)))
      setLog(`saved → ${id}`)
    } else {
      const id = `new-${lyrics.length + 1}-${title.length}`
      setLyrics(prev => [
        { id, title, text: draft.text, comments: draft.comments, createdAt: t0 + day },
        ...prev,
      ])
      setLog(`created → ${id}`)
    }
    setDraft(null)
  }

  function deleteLyric(id: string) {
    setLyrics(prev => prev.filter(l => l.id !== id))
    setLog(`deleted → ${id}`)
  }

  function shareLyric(id: string) {
    setLog(`shared → ${id}`)
  }

  function simulateReload(next: boolean) {
    setLoading(next)
    setLog(next ? 'loading…' : 'loaded')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
        <Box width={compact ? 320 : 400}>
          <LyricList
            lyrics={visible}
            loading={loading}
            selectedId={editing?.id ?? null}
            size={compact ? 'sm' : 'md'}
            onNew={openNew}
            onEdit={openEditor}
            onShare={shareLyric}
            onDelete={deleteLyric}
          />
        </Box>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          last intent: {log}
        </div>

        {/* ── Dogfooded controls (kit Toggle + Checkbox) ──────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Toggle checked={compact} onChange={setCompact} aria-label="Compact size" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Compact (sm)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={loading} onChange={simulateReload} aria-label="Simulate loading" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Loading</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Checkbox checked={showEmpty} onChange={setShowEmpty} aria-label="Show empty state" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>Force empty</span>
          </label>
        </div>
      </div>

      {/* ── The referenced editor (the app's Write screen) ────────────────── */}
      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit lyric' : 'New lyric'}
        size="md"
        actions={
          <>
            <button
              onClick={() => setDraft(null)}
              style={{
                appearance: 'none',
                border: '1px solid var(--border-strong)',
                borderRadius: 'calc(var(--radius) - 1px)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                padding: '8px var(--space-4)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveDraft}
              style={{
                appearance: 'none',
                border: '1px solid var(--accent)',
                borderRadius: 'calc(var(--radius) - 1px)',
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                padding: '8px var(--space-4)',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </>
        }
      >
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 340 }}>
            <TextField
              value={draft.title}
              onChange={v => setDraft(d => (d ? { ...d, title: v } : d))}
              label="Title"
              placeholder="Name this lyric…"
            />
            <div>
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Lyric
              </span>
              <SongNotesEditor
                value={draft.text}
                onChange={v => setDraft(d => (d ? { ...d, text: v } : d))}
                placeholder="Write the words…"
                aria-label="Lyric body"
              />
            </div>
            <TextField
              value={draft.comments}
              onChange={v => setDraft(d => (d ? { ...d, comments: v } : d))}
              label="Comment"
              placeholder="A note to yourself…"
            />
          </div>
        )}
      </Dialog>
    </Playground>
  )
}

// ─── Default export ──────────────────────────────────────────────────────────────

export default function LyricCRUDDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PhonePreview />
      <PlaygroundDemo />
    </DemoShell>
  )
}
