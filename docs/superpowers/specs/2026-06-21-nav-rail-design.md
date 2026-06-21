# NavRail — Design Spec
**Date:** 2026-06-21  
**Author:** Kit Agent (headless)  
**Branch:** kit/nav-rail

---

## 1. What it is

A slim vertical rail of icon-only buttons providing primary navigation in the Jackdaw DAW. Items are selected by the host; the rail itself is stateless (controlled component). It composes `Tooltip` for labels and includes an inline Badge for notification counts.

### Default items (for the demo)
- Write / Lyrics
- Arrangement
- Ideas (library)
- Plugins
- Versions
- Comments (may carry a badge)

### Footer item
- Settings (pinned at bottom)

---

## 2. Props / contract

```ts
export interface NavRailItem {
  id:     string
  icon:   React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label:  string
  badge?: number   // undefined = no badge; 0 = dot-only; n > 0 = number count
}

export interface NavRailProps {
  items:        NavRailItem[]
  footerItems:  NavRailItem[]
  active:       string           // id of the active item
  onSelect:     (id: string) => void
  collapsed?:   boolean          // narrow/compact visual state (hides brand mark, tighter padding)
  'aria-label'?: string          // defaults to "Primary navigation"
}
```

---

## 3. Architecture

```
<nav aria-label="Primary navigation">
  ├── .brandMark          (optional brand mark image when !collapsed)
  ├── <ul> .itemList      (primary items)
  │   └── <li> × N
  │       └── <Tooltip content={label} placement="right">
  │           └── <button .item> (aria-label, aria-current, data-active, data-disabled)
  │               ├── Icon (Phosphor, aria-hidden)
  │               └── .badge (optional, absolute)
  ├── .separator          (hairline between items and footer)
  └── <ul> .footerList    (settings + any other footer items)
      └── <li> × M
          └── <Tooltip content={label} placement="right">
              └── <button .item>
                  └── Icon (Phosphor, aria-hidden)
```

---

## 4. Visual design

### Rail container
- Width: `56px` (`md`, always fixed — icon-only rail)
- When `collapsed=true`: width `48px`, no brand mark
- Height: `100%` (fills parent column)
- Background: `var(--bg)` with a hairline right border `1px solid var(--border)`
- Subtle inset shadow on right edge: `inset -1px 0 0 0 var(--border)`

### Brand mark (top, `!collapsed`)
- `BrandMark` component, `variant="mark"`, `size=20`
- Centered, padded `var(--space-3)` top

### Item button
- `40px × 40px` (`md`)
- Background off: `var(--stage)` recessed well (same recipe as ArmButton/TransportButton)
- Background on (active): LED bloom using `--accent` (orange)
  - Accent is correct here per KIT-LEAD §6: "Generic toggles → the accent." The nav is a positional selector, not a semantic state control.
- `border-radius: var(--radius)`
- Inner shadow (off): `inset 0 2px 4px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.35), 0 0 0 1px var(--border)`
- LED bloom (on): glow with `color-mix(in srgb, var(--accent) 35%, transparent)`
- Incandescent timing: on=`--dur-led-on` (~40ms), off=`--dur-led-off` (~220ms)
- Icon color off: `var(--text-dim)`; icon color on: `var(--accent)`
- Hover: `brightness(1.08)` filter
- Active/press: translateY(1px) + deeper inset shadow
- `:focus-visible`: 2px accent-tinted outline with `outline-offset: 2px`
- Disabled: `opacity: 0.4`, `pointer-events: none`

### Badge
- Absolute positioned top-right of the button (`top: 4px; right: 4px`)
- Minimum size: `16px × 16px` circle (dot when badge=0)
- Count text: `var(--font-ui)`, `var(--text-xs)`, weight medium, color `var(--stage-text)`
- Background: `var(--led-orange)` — orange notification dot (distinct from accent icons; deliberately warm, not semantic red=arm/green=play)
- Counts ≥ 100 shown as "99+"
- `aria-label` on parent button includes count: "{label}, {n} unread"

### Separator
- `1px` horizontal line, color `var(--border)`, `margin: var(--space-2)` horizontal

---

## 5. Keyboard navigation

- `Tab` / `Shift-Tab`: natural tab order through all buttons (per browser default)
- `ArrowDown` / `ArrowUp`: cycle focus between items in the primary list; wraps
- `Enter` / `Space`: activate the focused item (native button behavior)
- Focus stays on `<nav>` level — no roving tabindex (keeps it simple; the rail has few items)

---

## 6. Accessibility

- `<nav aria-label="Primary navigation" role="navigation">` (nav already has implicit navigation role)
- Each button: `aria-label={label}` (tooltip label as accessible name)
- Active button: `aria-current="page"`
- Badge: parent button `aria-label="{label}, {n} unread"` when badge > 0; `"{label}, notification"` when badge = 0

---

## 7. States to cover in the gallery

| State | Notes |
|-------|-------|
| default | All items inactive |
| active | One item lit with LED bloom |
| hover | Item with tooltip visible (focus to trigger in demo) |
| active + badge | Active item that also carries a badge count |
| badge only | Inactive item with badge count |
| disabled item | One item grayed out |
| collapsed | `collapsed=true` narrow rail |
| focus-visible | Focus ring on item |
| loading | Rail with empty items (graceful empty state) |

---

## 8. Design decisions (headless — no human review)

1. **Active LED = `--accent`** (orange, not a semantic color). Nav selection is positional, not semantic. Per KIT-LEAD §6.
2. **Badge color = `--led-orange`**. Warm, attention-catching, distinct from semantic red/green/cyan. No separate Badge component (YAGNI — no other consumer exists).
3. **Tooltip placement = `right`**. Rail is always on the left side of the screen.
4. **`collapsed` boolean prop**. Card explicitly lists "collapsed/narrow" as a required demo state. Minimal implementation: narrower width + no brand mark.
5. **No keyboard roving-tabindex**. Rail has ≤10 items; natural tab order is fine. Arrow keys are an enhancement for power users.
6. **`group: 'Composites'`**, `order: 80`.

---

## 9. Files

```
src/components/NavRail/
├── NavRail.tsx
├── NavRail.module.css
├── NavRail.test.tsx
├── NavRail.demo.tsx
└── index.ts
```
