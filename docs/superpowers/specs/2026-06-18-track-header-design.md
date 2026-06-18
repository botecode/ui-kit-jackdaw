# TrackHeader Design Spec

**Date:** 2026-06-18
**Status:** Approved

## Goal

Assemble the existing kit primitives into one coherent recessed channel strip — the track's control surface. This is the first composite component: it proves the primitives sit together as a hardware channel and surfaces any sizing/spacing/token gaps between them.

## Scope

- `TrackHeader` composite component with `variant="track"` (default) and `variant="folder"`
- Writer and Producer density modes
- Responsive narrow→wide via CSS container queries
- `@phosphor-icons/react` added as a dependency for track-type glyphs
- No new primitives — compose only what exists

---

## Section 1 — Files

```
src/components/TrackHeader/
  TrackHeader.tsx          ← component + 3 local sub-components (TopBar, ControlStrip, FolderControlStrip)
  TrackHeader.module.css   ← all styles + container queries
  TrackHeader.test.tsx
  TrackHeader.demo.tsx
  index.ts
```

`package.json` adds `@phosphor-icons/react`.

---

## Section 2 — Props

### Track data object

```ts
export interface Track {
  id:           string
  name:         string
  color:        string          // CSS color value — consumer picks from --track-color-N tokens
  type:         'audio' | 'midi' | 'instrument'
  armed:        boolean
  muted:        boolean
  soloed:       boolean
  volumeDb:     number          // dBFS, typically -60..6
  pan:          number          // -1..1
  inputId:      string | null
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}
```

### Component props

(`FxPlugin` imported from `src/components/FxChip`, `InputSelectOption` from `src/components/InputSelect`)

```ts
export interface TrackHeaderProps {
  track:           Track
  onRename:        (name: string) => void
  onArm:           () => void
  onMute:          () => void
  onSolo:          () => void
  onVolume:        (db: number) => void
  onPan:           (pan: number) => void
  onSelectInput:   (id: string) => void
  onToggleChain:   (next: boolean) => void
  onTogglePlugin:  (id: string, next: boolean) => void
  onReorder:       (from: number, to: number) => void
  onRemovePlugin:  (id: string) => void
  onAddPlugin:     () => void
  onSelect:        () => void
  onToggleFolder?: () => void   // folder variant only
  folderOpen?:     boolean      // folder variant only
  mode?:           'writer' | 'producer'   // default 'writer'
  variant?:        'track' | 'folder'      // default 'track'
  meterLevel?:     number                  // mono dBFS
  meterLevelL?:    number                  // stereo L dBFS
  meterLevelR?:    number                  // stereo R dBFS
  inputOptions:    InputSelectOption[]
  anySoloActive?:  boolean
  disabled?:       boolean
}
```

---

## Section 3 — DOM Structure and Zone Decomposition

```
<div role="group" aria-label={track.name}
     class="root"
     data-variant="track|folder"
     data-mode="writer|producer"
     data-state="normal|armed|muted|soloed|selected"
     data-armed data-muted data-soloed data-selected
     style="--track-color: {track.color}">
  <div class="keyline" aria-hidden />
  <TopBar ... />
  {variant === 'track' ? <ControlStrip ... /> : <FolderControlStrip ... />}
</div>
```

The root has `container-type: inline-size` for CSS container queries. `--track-color` is the inline custom property that all sub-elements reference for the color accent.

### TopBar (both variants)

```
[ glyph ] [ name (editable) ......... ] [ arm | disclosure ] [ InputSelect chip ] [ FxChip ]
```

- **Glyph**: Phosphor icon, 14px, `aria-hidden="true"`
  - `'audio'` → `<Waveform />`
  - `'midi'` → `<Piano />`
  - `'instrument'` → `<MusicNotes />`
  - `'folder'` variant → `<FolderSimple />` (no type glyph for folder)
- **Name**: `<span tabIndex={0}>` normally; swaps to `<input>` on double-click or Enter/Space
- **Arm/Disclosure**:
  - `variant="track"`: `<ArmButton armed={track.armed} onToggle={onArm} size="sm" />`
  - `variant="folder"`: `<button aria-label="..." aria-expanded={folderOpen}><CaretRight /></button>` (icon rotates 90° when open via CSS `data-open` attribute)
- **Corner chips**: `<InputSelect variant="chip" />` + `<FxChip />`

### ControlStrip (variant="track")

```
[ MuteSoloToggle ] [ Fader (vertical, dB) ] [ PanKnob ] [ Meter ]
```

- `<MuteSoloToggle muted soloed orientation="stacked" size="sm" />`
- `<Fader orientation="vertical" scale={dbScale()} min={-60} max={6} value={track.volumeDb} />`
- `<PanKnob pan={track.pan} color={track.color} />`
- `<Meter value={meterLevel} valueL={meterLevelL} valueR={meterLevelR} peakHold clipLatch ballistics />`

### FolderControlStrip (variant="folder")

```
[ MuteSoloToggle ] [ Fader (group, dB) ]
```

No arm, no input, no pan, no meter, no type glyph. The folder is a submix bus.

---

## Section 4 — Writer vs Producer Mode

Mode affects only `TopBar`:

| Condition | InputSelect variant |
|---|---|
| `mode="writer"` (default) | Always `variant="chip"` |
| `mode="producer"` + `track.inputId === null` | `variant="field"` ("pick an input" affordance) |
| `mode="producer"` + `track.inputId` set | `variant="chip"` |

---

## Section 5 — Container Queries

Three breakpoints on the root (`container-type: inline-size`):

| Width | Name | Changes |
|---|---|---|
| `< 160px` | narrow | TopBar: hide InputSelect chip (FxChip stays); ControlStrip: meter `size="sm"`, pan readout hidden |
| `160px – 239px` | mid | Full TopBar; fader `size="sm"`, pan visible |
| `≥ 240px` | wide | Full layout; fader `size="md"`, meter `size="md"` |

The same query ranges apply to both `ControlStrip` and `FolderControlStrip`.

---

## Section 6 — States

Data attributes on the root drive all visual state — no extra JS state needed beyond what the track prop already contains.

| State | Root attribute | Visual treatment |
|---|---|---|
| `selected` | `data-selected` | Keyline brightens to full `var(--track-color)`; frame gets a subtle `var(--accent)` inset shadow |
| `armed` | `data-armed` | `ArmButton` lit; header background gets a faint red wash via `color-mix(in srgb, var(--led-red) 8%, var(--strip-bg))` |
| `muted` | `data-muted` | MuteSoloToggle M lit; ControlStrip dims to 70% opacity |
| `soloed` | `data-soloed` | MuteSoloToggle S lit; faint `var(--led-yellow)` glow on keyline |
| `disabled` | `disabled` on each child control | root: `opacity: 0.4; pointer-events: none` |

States compose: `armed + selected` shows both the red wash and the brightened keyline.

---

## Section 7 — Name Editing

`TopBar` holds a local `editing: boolean` state.

1. **Display**: `<span tabIndex={0} onDoubleClick={startEdit} onKeyDown={e => enter/space → startEdit}>` showing `track.name`
2. **Edit**: `<input aria-label="Track name" defaultValue={track.name} autoFocus />` replaces the span; text is auto-selected
3. **Commit**: `onBlur` or `Enter` → `onRename(value.trim() || track.name)` → exit edit mode. Empty string falls back to original name (no empty commit).
4. **Cancel**: `Escape` → restore original, do NOT call `onRename`, focus returns to span

---

## Section 8 — Accessibility

- Root: `role="group"` + `aria-label={track.name}` — updates live when name changes
- Each primitive keeps its own ARIA from its implementation; `TrackHeader` adds nothing on top
- Name `<input>`: `aria-label="Track name"`
- Disclosure button: `aria-label="Collapse {track.name}"` / `"Expand {track.name}"`, `aria-expanded={folderOpen}`
- Track-type glyph: `aria-hidden="true"` (decorative)

**Tab order (track variant):** name span → arm → mute → solo → fader → pan → input chip → FX chip

**Tab order (folder variant):** name span → disclosure → mute → solo → fader → FX chip

---

## Section 9 — Testing

18 tests in `TrackHeader.test.tsx`:

| # | Test |
|---|---|
| 1 | Renders `variant="track"`: name + glyph + ArmButton + M/S + chips visible |
| 2 | Renders `variant="folder"`: disclosure button visible, no ArmButton, no Meter |
| 3 | `data-selected` present when `track.selected=true` |
| 4 | `data-armed` present when `track.armed=true` |
| 5 | `data-muted` present when `track.muted=true` |
| 6 | `data-soloed` present when `track.soloed=true` |
| 7 | Name double-click → `<input>` appears with current name selected |
| 8 | Name edit → Enter → `onRename` called with trimmed value |
| 9 | Name edit → Escape → `onRename` NOT called, span restored |
| 10 | Empty name on Enter → `onRename` called with original name |
| 11 | `onArm` called on ArmButton click |
| 12 | `onMute` / `onSolo` called on M/S buttons |
| 13 | `onSelect` called when clicking the root div (control clicks bubble up and also trigger it) |
| 14 | `onToggleFolder` called on disclosure click |
| 15 | Producer mode + no input → InputSelect `variant="field"` |
| 16 | Producer mode + input set → InputSelect `variant="chip"` |
| 17 | Writer mode → InputSelect always `variant="chip"` |
| 18 | `role="group"` + `aria-label` equals track name; updates after rename |

---

## Section 10 — Demo

### States grid — fixed column of 8 headers

1. Normal track (audio, unselected)
2. Armed track (MIDI, armed)
3. Muted + soloed pair (instrument)
4. Selected track
5. Folder track, open
6. Folder track, closed
7. Writer vs Producer side-by-side (same track data, no input set)
8. Narrow (140px container) vs Wide (280px container) side-by-side

### Playground — full interactive header

Controls (Toggle / Fader / InputSelect):
- Toggle: armed / muted / soloed / selected / mode (writer↔producer) / variant (track↔folder) / folderOpen / anySoloActive
- InputSelect: track name (text field), track color (--track-color-1…6), track type (audio/midi/instrument)
- Fader: volumeDb, pan, meterLevel (drives the Meter in real time — dogfood)
- Add / remove plugins

---

## Done =

`TrackHeader` assembles existing primitives into one recessed channel: editable name + type glyph + arm + mute/solo + fader (dB) + pan + meter + corner input chip + corner FX chip; writer/producer density modes; folder variant; armed/muted/soloed/selected states read consistently across the strip; responsive narrow→wide via container queries; full keyboard + group labeling; reskins across themes. `typecheck` / `lint` / `test` green.
