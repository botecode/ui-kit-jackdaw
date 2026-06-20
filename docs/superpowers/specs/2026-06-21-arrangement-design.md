# Arrangement — Design Spec
_2026-06-21 · headless build; decisions made against KIT-LEAD.md_

---

## What it is

A **kit composite** — the main timeline screen. A two-column layout:

- **Left:** fixed-width column of `TrackHeader`s, vertically synced to the lane scroll.
- **Right:** horizontally + vertically scrollable timeline pane containing:
  - `TimelineRuler` (sticky at top — horizontal scroll with content, vertical-stick to viewport top)
  - Vertical stack of `TrackLane`s (one per track, uniform height, no variable-height, no zoom-on-tracks)
  - Shared overlays rendered **once** at this level: full-height `Playhead`, `EditCursor`, `TimeSelection` — all locked to the same `secondsToX` mapping

Everything shares one horizontal time→x mapping (`secondsToX` / `xToSeconds` derived from `bpm + pxPerBeat`, memoized with `useCallback`).

---

## Layout

```
.root  (flex-row; height: 100%; overflow: hidden)
│
├── .headersColumn  (width: headerWidth; flex-shrink: 0; border-right)
│     ├── .rulerSpacer  (height: rulerHeight; border-bottom)  ← aligns with ruler
│     └── .headersScroll  (overflow-y: scroll; scrollbar hidden; JS-synced)
│           └── .headerRow × N  (height: trackHeight each)
│                 └── TrackHeader
│
└── .timelineArea  (flex: 1; overflow: hidden)
      ├── .scrollBox  (overflow: auto; flex: 1)  ← main scroll (both axes)
      │     └── .scrollContent  (position: relative; width: totalWidth; min-height: 100%)
      │           ├── .stickyRuler  (position: sticky; top: 0; z-index: 10; height: rulerHeight)
      │           │     └── TimelineRuler
      │           └── .lanesRegion  (position: relative)
      │                 ├── TrackLane × N
      │                 └── .overlayLayer  (position: absolute; inset: 0; pointer-events: none; z-index: 20)
      │                       ├── Playhead
      │                       ├── EditCursor
      │                       └── TimeSelection
      └── .detailSlot  (optional; border-top; flex-shrink: 0)
            └── detailPanel prop (ReactNode)
```

**Scroll sync:** `onScroll` on `.scrollBox` → `headersScroll.scrollTop = scrollBox.scrollTop`. Headers use `overflow-y: scroll; scrollbar-width: none` (hidden scrollbar) so JS can set `scrollTop`.

---

## Props

```ts
// Per-track shape (header info + clips)
interface ArrangementTrack {
  id: string; name: string; color: string
  type: 'audio' | 'midi' | 'instrument'
  armed: boolean; muted: boolean; soloed: boolean
  volumeDb: number; pan: number; inputId: string | null
  plugins: FxPlugin[]; chainEnabled: boolean
  clips: ClipInfo[]
  meterLevel?: number; meterLevelL?: number; meterLevelR?: number
  clipping?: boolean
}

interface ArrangementProps {
  tracks: ArrangementTrack[]
  // Shared time mapping
  bpm: number; numerator: number; denominator: number
  pxPerBeat: number; division: Division; durationSeconds: number
  // Playhead
  playheadSeconds: number
  getPlayheadSeconds: () => number   // called in rAF loop during play
  playing?: boolean; recording?: boolean
  // Edit cursor
  cursorSeconds: number
  // Time selection
  selection: SelectionRange | null
  // Focus
  focusedTrackId?: string | null
  // Display config
  inputOptions: InputSelectOption[]
  anySoloActive?: boolean; showAllMeters?: boolean
  disabled?: boolean; trackHeight?: number; headerWidth?: number
  detailPanel?: ReactNode
  // Callbacks — typed against real bridge intents
  onSelectTrack: (id: string) => void
  onSeek: (seconds: number) => void
  onSelectRange: (range: SelectionRange) => void
  onClearSelection: () => void
  onRenameTrack: (id: string, name: string) => void
  onArmTrack: (id: string) => void; onMuteTrack: (id: string) => void; onSoloTrack: (id: string) => void
  onVolumeTrack: (id: string, db: number) => void; onPanTrack: (id: string, pan: number) => void
  onSelectInput: (id: string, inputId: string) => void
  onToggleChain: (id: string, next: boolean) => void
  onTogglePlugin: (id: string, pluginId: string, next: boolean) => void
  onReorderPlugin: (id: string, from: number, to: number) => void
  onRemovePlugin: (id: string, pluginId: string) => void
  onAddPlugin: (id: string) => void; onOpenPlugin: (id: string, pluginId: string) => void
  onToggleFolder?: (id: string) => void
  onClipMove?: (trackId: string, intent: ClipMoveIntent) => void
  onClipTrimStart?: (trackId: string, intent: ClipTrimIntent) => void
  onClipTrimEnd?: (trackId: string, intent: ClipTrimIntent) => void
  onClipDelete?: (trackId: string, clipId: string) => void
}
```

---

## Interaction model

- **Select track:** Click TrackHeader (`onSelect` → `onSelectTrack(id)`) OR click empty lane space (fires `onSelectTrack(id)` + `onSeek(snappedSeconds)`).
- `focusedTrackId` controls `selected: true` on both `TrackHeader.track.selected` and `TrackLane.selected` → focused styling (left accent keyline + faint tint).
- **No variable track heights** — uniform `trackHeight` (default 88px). Same value for header rows and track lanes.
- **Empty state:** Full two-column chrome renders, empty message in `.lanesRegion` where tracks would be.

---

## Defaults

| prop | default |
|---|---|
| `trackHeight` | 88 |
| `headerWidth` | 200 |
| Ruler height | 32px (CSS token `--ruler-height`) |

---

## States for gallery

1. **Empty** — no tracks, empty message in lanes area
2. **Few tracks (3)** — default view, default theme
3. **Many tracks (8)** — vertical scroll visible
4. **Focused track** — one track selected, focused styling on header + lane
5. **Playing** — playhead sweeping (simulated in demo via rAF)
6. **With time selection** — selection band + brackets visible
7. **Compare** — light + dark verified across ≥3 themes

---

## Key design decisions (headless)

- **secondsToX is NOT a prop** — derived inside Arrangement from `bpm + pxPerBeat` via `useCallback`. All children share this single memoized function. The Playhead and TimeSelection receive it as a prop; TrackLane receives `pxPerBeat + bpm` directly (its existing API).
- **Overlay z-index:** overlayLayer at z-index: 20 within lanesRegion; Playhead already sets z-index: 50 on itself (relative to its stacking context).
- **EditCursor pointer-events:** `pointer-events: auto` on its handle wrap inside the `pointer-events: none` overlay layer.
- **TimeSelection root left-origin:** TimeSelection root fills the overlayLayer (`position: absolute; inset: 0`). Its `getBoundingClientRect().left` = lanesRegion left = timeline x=0 origin. secondsToX(0) = 0. ✓
- **Reduced-motion:** Playhead rAF loop is functional (stays). CSS decorative transitions (`--dur-base`) snap via global prefers-reduced-motion rule.
- **No FocusedTrackDetailPanel** — spec says "compose or leave a clean slot." Slot = `detailPanel?: ReactNode` rendered in `.detailSlot` below the scroll area.
- **TrackHeader `selected` field** — computed from `focusedTrackId === track.id`; not in `ArrangementTrack` (derived, not data).
