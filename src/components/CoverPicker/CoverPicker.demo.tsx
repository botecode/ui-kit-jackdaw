// src/components/CoverPicker/CoverPicker.demo.tsx
import { useEffect, useRef, useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SegmentedControl } from '../SegmentedControl'
import { Dialog } from '../Dialog'
import { CoverPicker } from './CoverPicker'
import { coverStyle, type CoverChoice, type CoverUnsplashResult } from '../../lib/covers'
import styles from './CoverPicker.demo.module.css'

export const meta: DemoMeta = {
  name: 'CoverPicker',
  group: 'Composites',
  route: '/cover-picker',
  order: 46,
}

// ── A fake, offline Unsplash search ──────────────────────────────────────────
// The kit never calls the network. The demo stands in for the host: it returns
// small SVG "photos" (data-URLs) with real attribution so the Unsplash tab is
// visibly alive in the gallery, with zero keys and zero requests.

function fakePhoto(a: string, b: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>` +
    `</linearGradient></defs><rect width='120' height='120' fill='url(%23g)'/></svg>`
  return `data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}`
}

const PHOTOS: CoverUnsplashResult[] = [
  { id: 'u1', url: fakePhoto('#e8a87c', '#e47a7a'), attribution: { authorName: 'Ansel Adams', sourceName: 'Unsplash' }, alt: 'warm ridge' },
  { id: 'u2', url: fakePhoto('#7ec8a4', '#7eb8d4'), attribution: { authorName: 'Vivian Maier', sourceName: 'Unsplash' }, alt: 'cool tide' },
  { id: 'u3', url: fakePhoto('#c4a0e4', '#7eb8d4'), attribution: { authorName: 'Saul Leiter', sourceName: 'Unsplash' }, alt: 'dusk' },
  { id: 'u4', url: fakePhoto('#e4c84a', '#e8a87c'), attribution: { authorName: 'Fan Ho', sourceName: 'Unsplash' }, alt: 'sun' },
  { id: 'u5', url: fakePhoto('#e47a7a', '#c4a0e4'), attribution: { authorName: 'Rinko Kawauchi', sourceName: 'Unsplash' }, alt: 'ember' },
  { id: 'u6', url: fakePhoto('#7eb8d4', '#7ec8a4'), attribution: { authorName: 'Wolfgang Tillmans', sourceName: 'Unsplash' }, alt: 'green sea' },
]

const searchOk = (q: string): Promise<CoverUnsplashResult[]> =>
  new Promise(res => setTimeout(() => res(q.trim() ? PHOTOS : []), 500))
const searchEmpty = (): Promise<CoverUnsplashResult[]> =>
  new Promise(res => setTimeout(() => res([]), 400))
const searchSlow = (): Promise<CoverUnsplashResult[]> => new Promise(() => {})
const searchError = (): Promise<CoverUnsplashResult[]> =>
  new Promise((_, rej) => setTimeout(() => rej(new Error('offline')), 400))

// ── Demo-only: auto-run an Unsplash search so the async panel states (loading /
//    empty / error) render AT REST in the states grid. This drives the real
//    component through its public UI — it never reaches into internal state, and it
//    stays in demo code (the component's search lifecycle is deliberately internal). ──

function AutoUnsplash({
  search,
  query = 'cover',
}: {
  search: (q: string) => Promise<CoverUnsplashResult[]>
  query?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const input = root.querySelector<HTMLInputElement>('input[type="search"]')
    if (!input) return
    // Set the controlled value the React way, then submit on the next frame so the
    // component's state has flushed before the search fires.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, query)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const id = requestAnimationFrame(() => input.closest('form')?.requestSubmit())
    return () => cancelAnimationFrame(id)
  }, [query])
  return (
    <div ref={ref}>
      <CoverPicker onPick={() => {}} size="sm" defaultTab="unsplash" onSearchUnsplash={search} />
    </div>
  )
}

// ── The cover plate that the picked choice paints (the shared render helper) ──

function CoverPlate({ cover, size = 'md' }: { cover: CoverChoice | null; size?: 'sm' | 'md' }) {
  return (
    <div
      className={styles.plate}
      data-size={size}
      data-empty={cover ? undefined : ''}
      style={coverStyle(cover)}
    >
      {!cover && <span className={styles.plateEmpty}>No cover</span>}
    </div>
  )
}

// ── Live hero: a "Change cover" flow — picker inside a Dialog, over a plate ────

function LiveHero() {
  const [open, setOpen] = useState(false)
  const [cover, setCover] = useState<CoverChoice | null>({ kind: 'gradient', value: 'linear-gradient(135deg, #e4c84a, #e47a7a)' })
  const [wireUnsplash, setWireUnsplash] = useState(true)

  const attribution = cover?.kind === 'image' ? cover.attribution : undefined

  return (
    <section className={styles.hero}>
      <div className={styles.heroPlate}>
        <CoverPlate cover={cover} />
        <div className={styles.heroMeta}>
          <button type="button" className={styles.changeBtn} onClick={() => setOpen(true)}>
            {cover ? 'Change cover' : 'Add cover'}
          </button>
          {cover && (
            <button type="button" className={styles.clearBtn} onClick={() => setCover(null)}>
              Remove
            </button>
          )}
          <p className={styles.emitted}>
            <code>
              {cover ? `${cover.kind}: ${cover.value.slice(0, 40)}${cover.value.length > 40 ? '…' : ''}` : 'nothing picked'}
            </code>
          </p>
          {attribution && <p className={styles.attrib}>Photo by {attribution.authorName} — {attribution.sourceName}</p>}
        </div>
      </div>

      <label className={styles.wireRow}>
        <Toggle checked={wireUnsplash} onChange={setWireUnsplash} aria-label="Wire Unsplash search" />
        <span>Host wires <code>onSearchUnsplash</code> (adds the tab)</span>
      </label>

      <Dialog open={open} onClose={() => setOpen(false)} title="Cover" showCloseButton>
        <CoverPicker
          value={cover}
          onPick={setCover}
          onSearchUnsplash={wireUnsplash ? searchOk : undefined}
        />
      </Dialog>
    </section>
  )
}

export default function CoverPickerDemo() {
  const [size, setSize] = useState<'sm' | 'md'>('md')
  const [disabled, setDisabled] = useState(false)
  const [tab, setTab] = useState('gallery')
  const [pgUnsplash, setPgUnsplash] = useState(true)
  const [pgCover, setPgCover] = useState<CoverChoice | null>(null)
  const noop = () => {}

  return (
    <DemoShell meta={meta}>
      <p className={styles.lead}>
        A Notion-style cover picker for a record sleeve — four sources (Gallery / Upload / Link /
        Unsplash), emitting one typed <code>CoverChoice</code>. Presentational + controlled: it holds
        no cover, the host stores what it emits. Drop it into a Dialog or Popover — the overlay is the
        host's. Verify in Compare, light + dark.
      </p>

      <LiveHero />

      <StatesGrid>
        <State label="default">
          <CoverPicker onPick={noop} size="sm" />
        </State>

        <State label="hover">
          {/* Hover a gallery tile — it lifts a keyline ring. */}
          <CoverPicker onPick={noop} size="sm" />
        </State>

        <State label="focus">
          {/* Tab into the grid — the focused tile shows the accent ring (:focus-visible). */}
          <CoverPicker onPick={noop} size="sm" />
        </State>

        <State label="active">
          {/* Press a tile — it sinks (scale 0.94). */}
          <CoverPicker onPick={noop} size="sm" />
        </State>

        <State label="disabled">
          <CoverPicker onPick={noop} size="sm" disabled />
        </State>

        <State label="selected">
          {/* value lights the matching preset — the LED bloom + check stamp. */}
          <CoverPicker onPick={noop} size="sm" value={{ kind: 'color', value: '#7ec8a4' }} />
        </State>

        <State label="error">
          {/* Unsplash search that rejects → the error note (also: an invalid Link submit). */}
          <AutoUnsplash search={searchError} />
        </State>

        <State label="empty">
          {/* Unsplash search that returns nothing → the empty note. */}
          <AutoUnsplash search={searchEmpty} />
        </State>

        <State label="loading">
          {/* Unsplash search that never resolves → skeleton grid. */}
          <AutoUnsplash search={searchSlow} />
        </State>
      </StatesGrid>

      <section className={styles.usplashStates} aria-label="Unsplash outcomes">
        <h2 className={styles.sectionH}>Unsplash — search then see each outcome</h2>
        <div className={styles.threeUp}>
          <div>
            <span className={styles.tag}>results</span>
            <CoverPicker onPick={noop} size="sm" defaultTab="unsplash" onSearchUnsplash={searchOk} />
          </div>
          <div>
            <span className={styles.tag}>empty</span>
            <CoverPicker onPick={noop} size="sm" defaultTab="unsplash" onSearchUnsplash={searchEmpty} />
          </div>
          <div>
            <span className={styles.tag}>error</span>
            <CoverPicker onPick={noop} size="sm" defaultTab="unsplash" onSearchUnsplash={searchError} />
          </div>
        </div>
      </section>

      <Playground>
        <div className={styles.pgControls}>
          <label className={styles.pgRow}>
            <span>Size</span>
            <SegmentedControl
              aria-label="Size"
              options={[{ value: 'sm', label: 'sm' }, { value: 'md', label: 'md' }]}
              value={size}
              onChange={v => setSize(v as 'sm' | 'md')}
            />
          </label>
          <label className={styles.pgRow}>
            <span>Start tab</span>
            <SegmentedControl
              aria-label="Start tab"
              options={[
                { value: 'gallery', label: 'Gallery' },
                { value: 'upload', label: 'Upload' },
                { value: 'link', label: 'Link' },
                { value: 'unsplash', label: 'Unsplash' },
              ]}
              value={tab}
              onChange={setTab}
            />
          </label>
          <label className={styles.pgRow}>
            <Toggle checked={pgUnsplash} onChange={setPgUnsplash} aria-label="Wire Unsplash" />
            <span>Wire Unsplash</span>
          </label>
          <label className={styles.pgRow}>
            <Toggle checked={disabled} onChange={setDisabled} aria-label="Disabled" />
            <span>Disabled</span>
          </label>
        </div>

        <div className={styles.pgStage}>
          <CoverPlate cover={pgCover} size={size} />
          <CoverPicker
            key={`${tab}-${pgUnsplash}`}
            size={size}
            disabled={disabled}
            defaultTab={tab as 'gallery' | 'upload' | 'link' | 'unsplash'}
            value={pgCover}
            onPick={setPgCover}
            onSearchUnsplash={pgUnsplash ? searchOk : undefined}
          />
        </div>
      </Playground>
    </DemoShell>
  )
}
