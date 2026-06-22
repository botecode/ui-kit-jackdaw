# Showcase — design spec (kit, web surface)

Headless build. Every taste/spec call below was settled against `KIT-LEAD.md` and recorded here
(no human in the loop). Component card: the "scroll story" — alternating media + text feature
sections down a marketing page.

## What it is

A **web surface** for the Jackdaw marketing site: a vertical sequence of feature sections, each
pairing a visual (a `ProductFrame`/image slot) with an eyebrow + heading + body + optional CTA.
Sections alternate media L/R down the page for rhythm. Generous spacing, big type. Reveal-on-scroll
(IntersectionObserver) that respects reduced-motion and degrades to fully-visible content.

This is deliberately webpage-*shaped* — but it is **not a generic SaaS landing page**. The "why this
isn't a webpage" angle (recorded in the component note):

- Media sits in **recessed wells** (`--stage` + inset shadow) — the kit's signature stage, not a flat
  card with a drop shadow.
- The eyebrow is the **mono digital readout** (`--font-mono`, tracked-out, dim) — the same readout
  voice as the meters/clock, used here as a section index.
- Headings are the **display face** (`--font-display`), body is **General Sans** (never Inter).
- The CTA is the **accent pill** with the kit's recessed/lit tactility (hover bloom, press inset),
  not a generic button.
- Reveal uses the kit's **motion discipline**: decorative, so it snaps under `prefers-reduced-motion`
  and content is present without it. No animation library — CSS transition driven by a `data-revealed`
  attribute flipped by an IntersectionObserver.

## Data shape (props = real data shapes)

```ts
interface ShowcaseCta {
  label: string
  href?: string          // → renders an <a>
  onClick?: () => void   // → renders a <button> (when no href)
}

interface ShowcaseSection {
  id: string
  title: string              // display heading (required)
  body: string               // body copy (required)
  media: React.ReactNode     // visual slot — ProductFrame/image; consumer-supplied
  eyebrow?: string           // mono label, e.g. "01 / CAPTURE"
  cta?: ShowcaseCta
  side?: 'left' | 'right'    // which side media sits; overrides auto-alternation
}

interface ShowcaseProps {
  sections: ShowcaseSection[]
  reveal?: boolean           // enable reveal-on-scroll (default true)
  size?: 'sm' | 'md'         // default 'md'
  'aria-label'?: string
}
```

- **Media is a `ReactNode` slot.** `ProductFrame` does not exist in the kit yet; KIT-LEAD §6 says
  don't build API the card didn't ask for. The card says "slot a ProductFrame/image", so the
  consumer passes whatever node it wants. The demo supplies a token-built product-frame mockup.
- **Auto-alternation:** when a section omits `side`, even index → media `left`, odd index → `right`.
  Per-section `side` overrides.
- **CTA** is a link when `href` is set, else a button (`onClick`). One stable label (not the
  relabel/aria-pressed pattern — this is navigation, not a stateful control).

## Structure / semantics

- Root: `<section>` (or `role="region"`) with the `aria-label`, `data-size`, `data-reveal`.
- Each section: an `<article>` carrying `data-side` and `data-revealed`. Two children: the media well
  and the copy column. CSS grid swaps their visual order by `data-side` (DOM order stays copy-first
  for reading order; `order`/`grid-template` handles the visual flip — but copy reading order must
  stay logical, so media is DOM-first only visually via grid placement).
- Heading is an `<h2>`; eyebrow is a sibling above it. `aria-labelledby` links the article to its h2.

## Reveal-on-scroll

- Each section owns a ref + IntersectionObserver. Initial `data-revealed`:
  - `reveal === false`, OR `IntersectionObserver` undefined (jsdom/no-JS), OR
    `prefers-reduced-motion: reduce` → **start revealed = true** (content visible immediately).
  - otherwise → start `false`, observe, flip to `true` on first intersection, then unobserve.
- CSS: `data-revealed="false"` → `opacity: 0; translateY(…)`; `true` → settled. Transition on the
  decorative `--dur-slow` ease-out (zeroed under reduced-motion globally). Content is never
  display:none — only opacity/transform — so it is selectable/readable and accessible regardless.

## States (gallery)

default · revealed · CTA hover · CTA focus · no-eyebrow · no-CTA · forced side · sm size · empty
(no sections → renders nothing meaningful, no crash). Verify in light (Chroma/default) + dark
(nocturne/ink) + a third.

## Responsive

- Desktop: two-column grid, generous gap, big type.
- Mobile (`max-width` breakpoint): single column, **media stacks above copy** regardless of `side`.

## Tests (fireEvent, not userEvent)

- renders a section per item; renders title/body/eyebrow.
- omits eyebrow / CTA when absent.
- `data-side` alternation + per-section override.
- CTA: href → anchor with href; onClick → button fires onClick.
- empty sections array → no crash, no articles.
- without IntersectionObserver (jsdom) → sections are revealed (visible).
- `aria-labelledby` wires each article to its heading; root carries aria-label.
- `data-size` default md / sm.

## Done

Crafted in every theme, tactile CTA, accessible (anchor/button semantics, focus ring, labelled
regions), typed, all states in gallery, `tsc` + `vitest` + lint green.
