# VoiceIdeaCRUD — spec

The Nest recordings experience. A list of voice ideas, each a tactile row with a
play/pause LED, name, duration, share, and a ⋮ menu (rename / delete / share). A
filter bar (All / Ideas / Masters) sits above; an empty state below when nothing
matches.

## Contract (typed against the real data shape)

```ts
type VoiceIdeaKind = 'idea' | 'master'

interface VoiceIdea {
  id: string
  title: string
  durationSec: number
  audioUri: string     // app-owned; the kit never plays it, only carries it
  synced: boolean       // mirrored to the cloud / phone
  kind: VoiceIdeaKind
}

type VoiceIdeaFilter = 'all' | 'idea' | 'master'
```

Callbacks are the real intents:
- `onPlay(id)` / `onPause(id)` — transport. The app owns audio; the list is
  **controlled** via `playingId` so play state survives re-render and only one row
  rolls at a time.
- `onRename(id, title)` — commit a new title.
- `onDelete(id)` — commit a delete (fired after confirm).
- `onShare(id)` — share intent (fired from the share icon AND the ⋮ menu).

## Decisions (made headless against KIT-LEAD.md)

1. **"compose MobileSegmented"** — there is no `MobileSegmented` in the kit. The
   kit's segmented control is `SegmentedControl` (radiogroup, roving tabindex). I
   compose that for the All / Ideas / Masters filter. Most Chroma-consistent: reuse
   the existing primitive, don't invent a near-duplicate (YAGNI / no premature
   abstraction, KIT-LEAD §5).
2. **kind = `'idea' | 'master'`** — chosen to map 1:1 onto the All / Ideas / Masters
   filter the card specifies.
3. **Rename = inline** (the row's title becomes a recessed input in place), not a
   sheet. The card allows "inline or sheet"; inline is the more tactile, lower-
   chrome choice and keeps the row the single home for its own edit. Enter commits,
   Escape cancels, blur commits.
4. **Delete = confirm** via the shared `Dialog` with a `danger` confirm action
   (destructive intent must be deliberate).
5. **⋮ menu = shared `ContextMenu`** anchored at the button's rect (point anchor,
   `getBoundingClientRect`), portaled to the themed mount. Items: Rename, Share,
   Delete (danger). Esc/outside-click/Tab close; focus returns to the ⋮ button.
6. **Play/pause ARIA = relabel** (no `aria-pressed`): label flips "Play {title}" ↔
   "Pause {title}". One ARIA model per control (KIT-LEAD §5).
7. **Playing lights green** — semantic LED green = play/rolling (KIT-LEAD §6).
8. **synced** renders as a quiet "synced" cloud glyph (dim, token-colored); it's
   data display, not a new prop. **master** rows carry a small "Master" tag so the
   filtered list still reads when showing All.
9. **Compose-mappable**: a `Column` of `VoiceIdeaRow`s + a menu sheet — maps to the
   app's mobile Compose surface (the card's note).

## States in the gallery

list (All/Ideas/Masters each) · playing row (green) · row ⋮ open · inline rename ·
delete-confirm · empty (no ideas) · empty (filter has no matches) · phone-frame
preview (ProductFrame variant="phone"). Verified light + dark. `fireEvent` tests:
play→pause, menu open, rename commit, delete-confirm, filter, share.

## Why this isn't a webpage

A web list is flat rows with a hover background and a kebab that drops a white
card. This is the kit's hardware idiom: each row is a recessed well separated by a
hairline; the play control sits dark-recessed and **blooms green** on
incandescent timing when it rolls (fast attack / slow decay); the duration is the
mono digital readout; the menu lands on the dark `--stage` with on-stage text.
Tokens only — it reskins through every theme.
