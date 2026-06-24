# IdeasLibrary — multi-clip ideas (group card)

Date: 2026-06-24
Status: approved (headless — decisions self-resolved against KIT-LEAD.md)

## Goal

Today an `Idea` is single-clip: one `onPlay(id)` and one `onDragToProject(id)`. Add a **multi-clip
idea** — an idea that holds an ordered list of clips, rendered as a **group card**: a "Play all"
control plus a row of per-clip chips, each chip with its own play button and its own drag grip, e.g.
`[▶ Play all] [clip 1 ▶][clip 2 ▶][clip 3 ▶]`.

Additive and back-compatible: an idea **without** clips renders exactly as today.

## Model

```ts
export interface IdeaClip {
  id: string
  name: string
  peaks?: number[]      // normalised [0,1] waveform preview
  durationSec?: number
}

interface Idea {
  // … existing fields …
  clips?: IdeaClip[]    // present + non-empty ⇒ group card; absent/empty ⇒ single-clip (today)
}
```

**Decision — empty array falls back to single-clip.** `clips: []` renders the normal single-clip card,
not an empty group. A group with no clips is meaningless; this avoids a dead "Play all + no chips"
shell. Group-ness = `(idea.clips?.length ?? 0) > 0`.

## Props (additive, optional)

- keep `onPlay(id)` = **play all** (group) / play (single-clip)
- keep `onDragToProject(id)` = drag the **whole idea**
- add `onPlayClip?(ideaId, clipId)` — play one clip
- add `onDragClipToProject?(ideaId, clipId)` — drag one clip

**Decision — the two new callbacks are optional.** Single-clip-only consumers (incl. every existing
test/demo) need zero rework; the group card only appears when an idea carries clips, at which point a
multi-clip consumer wires them. The kit only *fires* callbacks — sequential-vs-layered playback and
timeline placement are the consumer's call (per the card). Missing handlers no-op safely (`?.()`).

## Rendering — the group card

Column layout reusing the existing `.card` shell visuals (warm `--surface`, hairline border, green
bloom when rolling):

```
┌───────────────────────────────────────────────┐
│ ⋮  Name              120 BPM  F major  [▶ Play all]  🗑 │   ← header
│    Night Shift / Synth Bus   ·  synth pad                │
│ ┌─ recessed clip well (--stage) ───────────────────────┐ │
│ │ ┌─chip─┐ ┌─chip─┐ ┌─chip─┐                            │ │
│ │ │~wave~│ │~wave~│ │~wave~│   (overflow-x scroll row)  │ │
│ │ │⋮ nm ▶│ │⋮ nm ▶│ │⋮ nm ▶│                            │ │
│ │ └──────┘ └──────┘ └──────┘                            │ │
│ └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

- **Header** = whole-idea drag handle (`DotsSixVertical`, drags the whole idea) · meta (name, bpm/scale
  badges, source, label chips — same recipe as the single-clip card) · **Play all** pill (Play icon +
  label) · delete button.
- **Clip well** = recessed `--stage` trough (inset shadow — the kit's signature groove) holding a
  horizontal `overflow-x:auto` row of clip chips. Reads like a little clip rack.
- **Clip chip** (tile, ~120px) = mini `Clip` waveform on top; bottom row = per-clip drag grip
  (`DotsSixVertical`) · clip name · per-clip Play/Stop button.

### Playing model

One playing selection across the whole library: `playing: { ideaId; clipId: string | null } | null`.

- **Play all** → `{ ideaId, clipId: null }`, fires `onPlay(ideaId)`; the **whole card** blooms green.
- **Clip play** → `{ ideaId, clipId }`, fires `onPlayClip(ideaId, clipId)`; **that chip** blooms green
  (card border stays neutral — play-all means "group rolling", a single clip means "just this chip").
- Starting any play stops the previous (preserves the existing "only one plays at a time" behaviour).

Dragging mirrors the same `{ ideaId, clipId|null }` shape for the dimmed-while-dragging visual.

### Filters

Group ideas are `kind: 'clip'` (default). Filters (bpm / labels / scale) and search operate on the
idea's **group-level** metadata — exactly as `filterIdeas` already does (it reads `idea.bpm`,
`idea.labels`, `idea.scale`, `idea.source`, `idea.name`). **Decision:** search stays group-level (does
not descend into clip names) — the card explicitly scopes filtering to group metadata; descending would
be scope creep (YAGNI).

## ARIA (one model per control — relabel for actions)

- Play all: `Play all clips in {name}` ⇄ `Stop all clips in {name}` (relabel, no `aria-pressed`).
- Clip play: `Play {clip.name}` ⇄ `Stop {clip.name}` (relabel).
- Clip grip: `role="button"`, `Drag {clip.name} to project`, Enter/Space keyboard fallback (same
  pattern as the existing whole-idea handle).
- Whole-idea handle: `Drag {name} to project` (unchanged).

## Motion / tokens

No new primitives. Green LED bloom (`--led-green`) reuses the card's existing `data-playing` recipe
(fast attack / slow decay). Tokens only — no hardcoded colors. Verify Compare light + dark.

## Test plan (TDD, `fireEvent`)

Group card: renders group meta; "Play all" present + labelled; click Play all → `onPlay(ideaId)`;
relabels to Stop all; one chip per clip; clip play labelled `Play {clip}`; click → `onPlayClip(idea,
clip)`; relabels to Stop; clip grip dragStart → `onDragClipToProject(idea, clip)`; whole-idea handle
dragStart → `onDragToProject(idea)`; group is filtered by group bpm/scale/label; only-one-plays across
group/clip; delete fires `onDelete(idea)`. Back-compat: `clips: []` renders single-clip (no "Play
all"); existing suite stays green.

## Deliverables

Component + module.css + test + demo updated; `IdeaClip` exported from `index.ts`; gallery gains a
sample multi-clip idea (visible at `#/ideas-library`); `dist/` rebuilt via `build:lib`. Gate: `tsc
--noEmit` + `vitest run` green.
