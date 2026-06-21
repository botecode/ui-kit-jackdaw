# Tabs — Design Spec

**Date:** 2026-06-21  
**Status:** Implemented & Committed  
**Branch:** kit/tabs  
**Component:** `src/components/Tabs/`

---

## What it is

A controlled horizontal tab bar + panel primitive for the Jackdaw UI Kit. A row of `role="tab"` buttons above a single `role="tabpanel"`, with a sliding ink-bar active indicator that carries the accent color. Generic and reusable — distinct from the Preferences nav (which is a vertical sidebar nav, not a tab pattern).

## Props contract

```ts
interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode   // optional Phosphor icon node
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  active: string           // controlled — caller owns active state
  onChange: (id: string) => void
  children?: React.ReactNode   // panel content slot
  size?: 'sm' | 'md'     // default 'md'
}
```

No uncontrolled mode — Jackdaw is a DAW with persistent state; always controlled.

## Accessibility model

WAI-ARIA Tabs pattern with **automatic activation** (arrow keys change both focus and active panel simultaneously):

- `role="tablist"` on the container div; `onKeyDown` here (not on individual buttons)
- `role="tab"` on each button; `aria-selected`, `aria-controls→panelId`, `aria-disabled`
- `role="tabpanel"` on the panel div; `aria-labelledby→activeTabId`; `tabIndex={0}` (panel is focusable)
- **Roving tabindex:** active tab = `tabIndex=0`; all others = `tabIndex=-1`
- **Keyboard:** ArrowRight / ArrowLeft (wrap-around), Home (first), End (last) — all skip disabled tabs
- `:focus-visible` only (never `:focus`)
- Disabled tabs use `aria-disabled` (NOT the HTML `disabled` attribute) so they remain in the DOM

## Active indicator

A 2px accent underline that slides between tabs:

- Absolutely positioned inside the tablist (`bottom: 0`)
- Position + width set via CSS custom properties (`--_ind-left`, `--_ind-width`) computed in `useLayoutEffect` from `el.offsetLeft` / `el.offsetWidth`
- `useLayoutEffect` (not `useEffect`) prevents paint flash on first render
- CSS `transition: left/width var(--dur-base)` — `--dur-base` is zeroed globally under `prefers-reduced-motion`, so the slide **snaps** (decorative motion as spec requires)
- LED glow: `box-shadow: 0 0 6px 2px color-mix(in srgb, var(--accent) 45%, transparent)` — warm bloom using the accent, consistent with Chroma's recessed-off/LED-lit-on language
- Active tab text uses `var(--text)` (full contrast), not `var(--accent)` — the indicator bar already carries the color signal; using accent on both would be too loud

## Overflow handling

When tabs exceed the container width: `overflow-x: auto` on a wrapper div with `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`. The tablist itself is `min-width: max-content` so tabs never wrap. The ink bar stays inside the scroll container so it scrolls with the tabs.

## Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `md` (default) | 36px | `var(--space-2) var(--space-3)` | `var(--text-sm)` |
| `sm` | 28px | `var(--space-1) var(--space-2)` | `var(--text-xs)` |

## State CSS

State via `data-*` attributes on the element (no class juggling):

- `data-size="md|sm"` on `.root` — parent selector cascade for tab sizing
- `[data-active]` on active tab — triggers `color: var(--text)` + fast `--dur-led-on` transition
- `[data-disabled]` on disabled tabs — `opacity: 0.35`, `pointer-events: none`, `cursor: default`

## Token mapping

| Token | Usage |
|-------|-------|
| `--bg` | Not used directly (inherited from page) |
| `--text` | Active tab label + panel |
| `--text-muted` | Inactive tab labels |
| `--accent` | Indicator bar fill + LED glow |
| `--border` | Bottom border of the tablist |
| `--font-ui` | Tab labels (General Sans / Satoshi) |
| `--dur-base` | Indicator slide transition; decorative → zeroed under reduced-motion |
| `--dur-led-on` | Fast attack on activation (40ms) |
| `--ease-out` | All transitions |

## Gallery demo states

All states in `Tabs.demo.tsx` (auto-registered via `import.meta.glob`):

1. **2 tabs** — minimal case
2. **4 tabs** — default with content panel
3. **With icons** — Phosphor icons at 14px (md), 12px (sm)
4. **Disabled tab** — middle tab disabled; arrows skip it
5. **Size sm** — full sm example with icons
6. **Overflow scroll** — 7 tabs in 280px container; horizontal scroll, hidden scrollbar
7. **Playground** — live Toggle controls for icons/disabled, native `<select>` for size (consistent with Toggle.demo pattern)

## Design decisions + rationale

**Automatic vs. manual activation:** Chose automatic (arrow moves focus + active simultaneously). Rationale: Jackdaw tabs are cheap panel swaps with no async work; the simpler model matches WAI-ARIA recommendations for this case.

**Text color on active tab:** `var(--text)`, not `var(--accent)`. The ink bar carries the accent; putting accent on both text and bar would be redundant and too loud for the Chroma aesthetic.

**No `aria-pressed` on tabs:** Tabs use `aria-selected` per the ARIA pattern, not `aria-pressed`. Per the kit ARIA model: toggles use `aria-pressed`, action-or-selection widgets use the domain-appropriate attribute (`aria-selected` here).

**`disabled` vs `aria-disabled`:** Used `aria-disabled` on the tab button (not the HTML `disabled` attribute). This keeps the tab in the tab order lookup for the keyboard handler, avoids browser quirks with focus, and is the ARIA recommendation for tabs.

**No separate panel per tab:** One `role="tabpanel"` element whose `aria-labelledby` switches to the active tab. Children are caller-managed (controlled pattern). This is simpler than rendering N hidden panels and matches how Jackdaw would use the component (swap content above, not hide/show N divs).

**`tabIndex={0}` on panel:** Required by WAI-ARIA Tabs so keyboard users can reach the panel content via Tab key.
