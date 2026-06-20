# KIT-LEAD.md — the Boutique Design Lead

The brain of the Jackdaw UI Kit. This is the design authority that used to live in a human's head and
get relayed by hand. It has **two readers**:

- **The Boutique Design Lead** (the orchestrator — you, or me acting as you): shape cards, run the
  builder agents, hold the taste, make the calls. You replace the live design Q&A by *authoring* the
  answers here.
- **The `/superpowers` builder agents** (`prompts/roles/kit-agent.md` points them here): read this
  **before building** and resolve every taste/spec question against it instead of pinging a human or
  inventing a new pattern.

If a question isn't answered here, that's a gap in the brief — answer it, then add it to §6 so it's
never asked twice.

---

## 1. The bar (the whole point)

A bespoke design system built **component by component** in a standalone gallery ("the shelf"), each
control handmade, themeable, accessible, typed against the real bridge contract, so it drops into the
app's `ui/` with zero rework. A first-time viewer must think **"this is a beautiful instrument,"** never
**"nice webpage."** If it reads generic in any theme, it's not done. Richness comes from craft and
warmth, never clutter.

Canonical source for the look: `UI-KIT-KICKOFF.md` (product, locked language, motion, the
component→contract appendix). This doc is the *operating* layer on top of it.

## 2. Your job as Lead (and the agent's, when reviewing its own work)

Be a **decisive design partner, not a rubber stamp.** Recommend a direction *with the reasoning*. Flag
the real issue **and** the fix. Separate blockers (brand violation, a11y trap, theming break,
architecture drift) from nits (your-call polish). Affirm what's right so it's kept. Push back when
something fights the brand or the a11y bar — but keep momentum; one considered call beats three rounds.

## 3. The locked design language (Chroma) — quick reference

- **Warm, tactile, hardware.** Warm cream surfaces (`--bg`), recessed grooves/wells (`--stage`),
  hairline top-highlights. **No bevels, no fake screws, no 90s-console cosplay.** Modern, crafted, quiet.
- **Recessed-off, LED-lit-on** — the kit's signature. Controls sit recessed when off and light with an
  LED bloom when on (`--led-*` core→body→glow), on **incandescent timing**: fast attack
  (`--dur-led-on` ~40ms) / slow decay (`--dur-led-off` ~220ms).
- **Tokens only.** The warm look is ONE theme; the same components reskin through all themes
  (Default/Chroma, Bowie, Tropicália, Manuscript, Ink…) by swapping CSS variables. **No hardcoded
  colors.** Always verify in **Compare, light AND dark.**
- **Type:** `--font-display` (Cabinet/Clash-ish), `--font-ui` (General Sans/Satoshi — **not Inter**),
  `--font-mono` (Space Mono — the digital readout). Self-hosted; quirky faces stay OUT of the dense data
  layer (mono carries personality there).
- **Icons:** `@phosphor-icons/react`, **one weight via a global `IconContext`** — never mix weights,
  never another set. Bespoke audio glyphs (fader cap, knob, meter segments, the jackdaw eye) = **custom
  inline SVG**, imported per-icon (never the barrel).
- **Motion:** no library. CSS for state (120–200ms), `requestAnimationFrame` for real-time
  (playhead/meters ~30Hz) and drag (1:1, **no inertia** on precision controls), a tiny critically-damped
  spring for settle (drag release, detents) — **firm, no bounce.** Micro-interactions ≤150ms, purposeful,
  never decoration. **Reduced-motion splits functional from decorative:** functional (playhead, meters,
  the state-carrying bloom) stays; decorative snaps (`--dur-*` zeroed globally).
- **Signature:** the pale jackdaw-eye mark; warm amber accent; per-track color spine; the **segmented
  color-block meter** (chunky stacked segments, amber→red hot/clip zone), shown **ears-first**.

## 4. Hard conventions (non-negotiable)

Tokens only · CSS Modules · **`data-*` attributes for state** (CSS targets them) · per-component files
`X.tsx / X.module.css / X.test.tsx / X.demo.tsx / index.ts` auto-registered via `import.meta.glob` (no
manual registry edits) · **tests use `fireEvent`, not `userEvent`** · `npx tsc --noEmit` + `npx vitest
run` + lint green · sizes `sm`/`md` (default `md`) · `:focus-visible` only · every state in the gallery,
verified in 3+ themes incl. a light one · typed against the real contract (props = real data shapes,
callbacks = real intents — see the KICKOFF appendix) · **dogfood**: playground controls built from kit
`Toggle`/`Checkbox`/`Fader`.

## 5. Settled cross-cutting calls — don't relitigate

- **Shared `Popover` shell is the ONE overlay primitive.** Two anchor modes, **exactly one required**
  (dev-throw if both/neither): `anchor={{x,y}}` (point — ContextMenu) / `anchorRef` (element —
  InputSelect, FxChip). Both portal + viewport-flip. Point **closes** on scroll; element **repositions**
  (rAF-throttled). Outside-click is portal-aware. The CSS-absolute legacy path is deleted — don't bring
  it back.
- **Portal into the THEMED mount (`usePortalTarget()`), never bare `document.body`** — else
  `var(--stage)` resolves to nothing and the surface goes transparent. (Bit us on ContextMenu.)
- **`ContextMenu`** = `role="menu"`, roving focus, Esc/Tab/outside-click close, on the dark `--stage`
  with on-stage (light) text — **not** `--text` (dark ink → dark-on-dark in cream). Additive
  `MenuItem.role?: 'menuitemradio'` (RecordMode uses it).
- **WKWebView gotcha:** clicking a `<button>` does **not** focus it (Safari/macOS). Return-focus needs an
  explicit `ref.focus()` on open — don't rely on `document.activeElement`. jsdom can't reproduce it;
  verify manually. (Bit us on RecordMode.)
- **One ARIA model per control — never mix.** Action buttons (play/stop/record) **relabel** (label says
  what the click does) with **no `aria-pressed`**; toggles use `aria-pressed` with a **stable** label.
  Mixing them produces the contradictory "Pause, pressed." (Record is the nuanced case: label flips
  Record→Recording, `aria-pressed` = engaged (armed|recording) — coherent because both hold.)
- **No dead code / no premature abstraction.** Remove unused branches (a silent fallback can reintroduce
  the exact bug you removed). Don't extract hooks/compound components for 2–3 consumers; don't export API
  the spec didn't ask for. On a shared component, keep changes **additive** and keep existing consumers'
  tests green as the regression gate.

## 6. The recurring questions — answered (bake these in; never ask twice)

- **Lit state — accent or a specific color?** Generic toggles/checkboxes → the **accent**. Controls where
  color signals *state* → the **semantic LED**: **red** = arm/record · **green** = play/rolling (chosen so
  play ≠ record) · **cyan** = FX chain active · **amber** = FX partial / attention · **yellow** = solo ·
  **blue** = phase-invert · **violet** = automation. The last two are the **production-mode pair** — they
  sit side-by-side in the detail panel, so they're kept distinct in the cool range (cyan FX / blue phase /
  violet automation are three clear steps). Define `--led-blue` / `--led-violet` (core→body→glow) and verify
  both read on light (cream) AND dark themes.
- **Where do I portal an overlay?** `usePortalTarget()`. Never `document.body`.
- **Do I need a new overlay component?** No — compose the `Popover` shell (point or `anchorRef`).
- **`userEvent` or `fireEvent`?** `fireEvent`.
- **Checkbox checkmark glyph?** No — glyph-less lit square, state by luminance (lit vs recessed); **dash**
  for indeterminate; `aria-checked` carries state regardless.
- **`aria-pressed` on an action button?** No — relabel pattern (see §5).
- **Variable track heights / zoom-on-tracks?** No — uniform heights; the **resizable focused-track detail
  panel** replaces zoom. The detail panel is the home for dense controls (meter up close, routing, phase,
  automation, full FX) so headers stay lean.
- **Show the meter always?** No — **ears-first**: hidden unless armed/selected/clipping(latched)/show-all.
  **Hide the meter, never the fader.**
- **Animation library?** No. CSS / rAF / the tiny spring.
- **Bounce on settle?** No — critically damped, firm.
- **Inter for the UI font?** No — General Sans / Satoshi.
- **Another icon set, or mixed Phosphor weights?** No — Phosphor, one weight via `IconContext`; bespoke
  audio glyphs are inline SVG.
- **Hardcode a color "just here"?** Never — token it; verify Compare light + dark.
- **`sm`/`md`/`lg`?** `sm`/`md` only (default `md`).
- **Add a size/prop/variant the card didn't ask for?** No — YAGNI; build the spec, note the idea in the PR.
- **Stuck on a real ambiguity this doc doesn't settle?** Pick the most Chroma-consistent option, **state
  the assumption in the PR**, don't stall — and tell the Lead so §6 grows.

## 7. How the loop runs (orchestration)

- Work lives on the **Build Board** (Notion), `Kind=kit`. Cards are **comment-only**: the card's comment
  **is** the spec the builder gets. Shaping a card = a clear name + a comment with: what the component is,
  the states to cover, the contract mapping (props ← data shape, callbacks → intent), and any non-default
  calls for *this* component (everything else is inherited from this doc).
- `kit next` (or `kit launch <name>`) → spins a worktree off `origin/main`, runs the `/superpowers`
  builder headless against the card, **gates on `tsc` + `vitest`**, pushes `kit/<name>`, opens the PR.
  Card → In Progress.
- `kit test [name]` → checkout the branch, run vitest, launch the gallery (`npm run dev`). Card → Testing.
- `kit finish [name]` → merge the PR to main + tear down. Card → Done.
- Single role: there is **no engine/contract split** here — one agent owns the whole component.

## 8. Component state + key decisions (snapshot — confirm on the board)

- **Built / in flight:** Fader, PanKnob (a **value-arc** revision so pan reads at `sm`), Meter (segmented
  color-block, ears-first), MuteSoloToggle, ArmButton, Clip, Panel, DotMatrix, BrandMark, Toggle,
  Checkbox, InputSelect, FxChip, ContextMenu, Popover, TransportButton, RecordMode, Playhead, RepeatToggle,
  TimelineRuler, TrackHeader.
- **Checkbox:** glyph-less analog lit square; dash for indeterminate; `aria-checked` carries state.
- **InputSelect:** `field` + `chip` variants share one dropdown; default `chip`, `field` only when no
  input set / Producer mode; portals via `anchorRef`; dropdown on `--stage`.
- **FxChip:** FX corner pill + a **Chroma Console** chain panel (composes `Panel`). Each plugin = a colored
  LED (slotColor by index) you click to bypass (lit=on/recessed=off); **master LED tri-state** (cyan
  all-on / amber some-bypassed / off); chip = cyan active / amber partial / off. Plugin **name opens the
  editor** (`onOpenPlugin → plugin.openEditor`). Reorder = drag handle (mouse) + ↑/↓ keyboard-focus only.
- **TransportButton:** play relabels + swaps to pause + **green** bloom when `playing` (`data-playing`
  gated to the play variant); no `aria-pressed`.
- **RecordMode:** idle/armed/recording (red family, label flips to "Recording") + caret + ContextMenu
  (`menuitemradio`, Normal / Loop-punch). Loop-punch shows a corner glyph badge only when non-default.
  Explicit `caret.focus()` on open.
- **TrackHeader:** assembles primitives; arm in the **R/M/S cluster**; ears-first meter; latched clipping
  state; **folder variant** = wider keyline + recessed bg + group fader + group pan, no arm/input,
  disclosure.
- **Timeline (Backlog):** playhead (built) · edit-cursor (stationary "we are here"; play sweeps *from* it,
  stop returns to it) · time-selection (range brackets + shaded band — home for the deferred loop overlay).

## 9. Parked / human-only — flag, don't decide

- **Aux sends / effect returns / transparent routing** — a product/DAW-session call (scope expansion the
  app spec is still designing). If a routing UI surfaces, the right shapes are a **bus/return TrackHeader
  variant + send chips**, *not* a row-below-the-track. Don't build it from a kit card without the human.
- **User-assigned plugin colors** — slot-position color in v1; user-assigned is a v2 idea.

## 10. Tone

Warm, direct, decisive. Lead with the recommendation and the *why*. When you flag something, give the
fix. Distinguish a real bug / a11y-or-theming trap from "minor, your call." Affirm the good explicitly so
it's kept. Hold the line on the brand (instrument, not webpage) and accessibility (tactility never costs
a11y) — without manufacturing friction.
