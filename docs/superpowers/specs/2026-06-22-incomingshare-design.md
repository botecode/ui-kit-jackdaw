# IncomingShare — design spec

> Headless build. Every taste/spec call below was resolved against `KIT-LEAD.md`
> (the Boutique Design Lead) and the most Chroma-consistent option taken; the
> reasoning is recorded inline so it never has to be asked again.

## What it is

The **receiver side** of a share, reached by opening the **Nioh deeplink**
(`jackdaw://share/<code>`) on a phone or in the desktop app. Someone — on another
phone, or in their Jackdaw desktop — has bundled a few **voice ideas + lyrics**
and sent them over. IncomingShare is the surface where the receiver sees *who*
wants to share, *what's coming*, and *where from*, then makes an explicit choice:
**Accept** (start the transfer → `TransferProgress`) or **Decline** (dismiss,
nothing saved).

It **never auto-writes** — acceptance is always an explicit press. This mirrors
the existing `Share`/`IncomingManifest` "deliberate apply" stance but for the
phone-companion content types (ideas + lyrics) rather than immutable Takes.

This is the **app surface** (`surface: ['app']`) and is **Compose-mappable**:
a Column = header + a Column of item rows + a two-button action row.

## Contract (typed against the share-manifest shape)

The card says: *"Type against the same share-manifest shape as MobileShareSheet."*
MobileShareSheet isn't built yet, so **IncomingShare defines the canonical
share-manifest shape** here and exports it; a future MobileShareSheet (the sender
sheet) imports the same types. The shape is heterogeneous — voice ideas carry a
duration, lyrics don't — so one `ShareItem` union covers both, keyed by `kind`.
The voice-idea fields line up with `VoiceIdea` (`title`, `durationSec`) and the
lyric fields with `LyricIdea` (`title`/`name`), so the sheet builds a manifest
straight from those library shapes.

```ts
export type ShareItemKind = 'voice-idea' | 'lyric'

export interface ShareItem {
  id: string
  kind: ShareItemKind
  name: string
  /** Voice ideas carry a clip length (seconds). Omitted for lyrics. */
  durationSec?: number
  /** Transfer size in bytes — both kinds. */
  sizeBytes: number
}

export type ShareOrigin = 'phone' | 'daw'

export interface ShareManifest {
  /** Who is sharing — drives the "<Name> wants to share with you" header. */
  senderName: string
  /** Where it's coming from — another phone, or their Jackdaw desktop. */
  origin: ShareOrigin
  items: ShareItem[]
}

export type IncomingShareStatus =
  | 'preview'    // default — manifest + Accept / Decline
  | 'accepting'  // Accept pressed — transfer starting (→ TransferProgress)
  | 'declined'   // dismissed, nothing saved (calm terminal)
  | 'expired'    // the deeplink expired (clear error message)
  | 'invalid'    // the deeplink is malformed / unknown (clear error message)

export interface IncomingShareProps {
  /** The incoming bundle. Optional: expired/invalid links may have no manifest. */
  manifest?: ShareManifest
  status?: IncomingShareStatus        // default 'preview'
  size?: 'sm' | 'md'                  // default 'md'
  onAccept: () => void                // start the transfer (→ TransferProgress)
  onDecline: () => void               // dismiss, nothing saved
  /** Dismiss a terminal state (declined/expired/invalid). Defaults to onDecline. */
  onDismiss?: () => void
}
```

**Callbacks are the real intents:** `onAccept` = begin transfer, `onDecline` =
drop it. No `onItemClick`/per-item API — the receiver accepts or declines the
*bundle*, not individual items (YAGNI; note it in the PR if per-item ever lands).

## Anatomy & states

```
┌─────────────────────────────────────┐
│  [origin glyph]  Maya wants to       │   header — title + origin row
│                  share with you      │
│  ◌ from their phone                  │
│                                      │
│  3 voice ideas · 1 lyric             │   manifest summary (computed, pluralized)
│  ┌─ recessed stage well ──────────┐  │
│  │ ◍ Hook idea         0:42 · 220K │  │   item rows: glyph · name · mono meta
│  │ ◍ Verse melody      1:18 · 410K │  │
│  │ ◍ Bridge hum        0:31 · 160K │  │
│  │ ✎ Chorus draft           3 KB   │  │   lyric: no duration, size only
│  └─────────────────────────────────┘  │
│                                      │
│     [ Accept ]   [ Decline ]         │   primary green LED · quiet ghost
└─────────────────────────────────────┘
```

The **five real states** and how the 9 required gallery labels map to them:

| Real state | What renders | Gallery labels covering it |
|---|---|---|
| `preview` | header + manifest + Accept/Decline | default, hover, focus, active |
| `accepting` | manifest dimmed, actions disabled, "Starting transfer…" status | disabled, loading |
| `declined` | calm terminal: "Declined — nothing was saved." + Dismiss | selected |
| `expired` | error message + Dismiss, no manifest | error |
| `invalid` | error message + Dismiss, no manifest | empty |

(`hover`/`focus`/`active` are exercised on the real Accept button in their cells —
the established gallery pattern.)

## Look & motion (Chroma)

- **Recessed-off / LED-lit-on, tokens only.** The manifest preview sits in a
  recessed `--stage` well (same surface as `IncomingManifest`, so the share flow
  reads as one instrument face). Each item is a raised row with a bespoke audio
  glyph; meta is mono (`--font-mono`) like a readout.
- **Accept = green LED** (`--led-green`), the kit's go/accept signal (matches
  `Share`'s `applyBtn` — green = play/rolling/accept, never red). **Decline =
  quiet recessed ghost** (`--text-muted` → `--text` on hover) so the destructive-
  but-calm choice never shouts. This is the one semantic-color call: accept is a
  "go", so green, not the accent.
- **Origin glyph** is hardware, not emoji: phone → `DeviceMobile`, daw →
  `SlidersHorizontal`, one Phosphor weight via `IconContext`. Item glyphs:
  voice-idea → `Waveform`, lyric → `NotePencil`.
- **Expired/invalid is a calm dark readout, not a red web error card** — message
  in `--text-muted` on the surface with a single amber attention dot, `role="alert"`
  for the screen reader. Declined is calmer still (`role="status"`).
- **Motion:** CSS state transitions only (120–200ms); the accepting status dot
  pulses via the shared LED timing; decorative motion snaps under
  `prefers-reduced-motion`.

## Accessibility

- Surface is a `role="dialog"` with `aria-labelledby` on the header title — it's a
  focused decision the deeplink lands you on. (jsdom can't reproduce the WKWebView
  focus gotcha; return-focus is the parent's concern since the parent mounts it.)
- **Accept/Decline are action buttons → relabel pattern, no `aria-pressed`**
  (KIT-LEAD §5: one ARIA model; actions relabel, toggles press).
- `accepting` announces "Starting transfer…" via `role="status" aria-live`.
- `expired`/`invalid` messages use `role="alert"`; `declined` uses `role="status"`.
- `:focus-visible` only; `sm`/`md` sizes; `data-*` attributes carry all state.

## Why this isn't a webpage

A website's "someone shared files with you" screen is a flat list of grey rows, a
blue **Accept** button, and a toast. IncomingShare is the instrument instead: the
incoming bundle sits in a **recessed tape-well** like a tray of physical reels,
each idea a raised chip with a hand-drawn audio glyph and a mono readout; **Accept
lights a green LED** (go) while **Decline stays a quiet recessed ghost**; an
expired link is a **calm dark readout with one amber dot**, never a red error
banner; and *where it's from* reads through a **hardware device glyph**, not an
emoji. Every surface, depth, and color is a token, so the same screen re-skins
through every theme — verified in Compare, light **and** dark.

## Files

`src/components/IncomingShare/` — `IncomingShare.tsx`, `IncomingShare.module.css`,
`IncomingShare.test.tsx` (fireEvent: accept, decline, dismiss; summary
pluralization; expired/invalid messages; size; ARIA model), `IncomingShare.demo.tsx`
(9 states, phone-frame preview via `ProductFrame variant="phone"`, dogfooded
playground from kit `SegmentedControl`/`Toggle`/`Checkbox`), `index.ts`.
Auto-registers via `import.meta.glob`; tag `IncomingShare: ['app']` in
`src/gallery/surfaces.ts`. Demo meta: group `Composites`, route `/incoming-share`,
order `54` (next to Share 50 / ShareLink 52 / IncomingManifest 53).
