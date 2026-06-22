# PairQRCode — design spec (2026-06-22)

App-surface pairing hero. **"Show this to connect"** — this is the device *being scanned* during a Nioh
pairing handshake. A large, token-coloured QR (encoding the pairing payload) is seated in a recessed
readout frame (the hero); this device's name sits below; a calm "Waiting for the other device…"
indicator + a Cancel button complete the card. When the peer connects, the hero transitions to a green
success seal. Follows app-kit-foundation.

## The bar
A first-time viewer holds a pairing handset, not a webpage. The QR is not a flat black-on-white box
dropped onto a page — it is a tactile paper chip embedded in a recessed `--stage` well, the well lights
with incandescent timing while listening, and the success transition is an LED seal, not a green toast.
Reads gorgeous in every theme on tokens alone.

## Anatomy
- **QR readout frame (the hero)** — a recessed `--stage` well with inset shadow + hairline top-highlight,
  holding a light "paper" chip. The QR modules are painted as a single SVG path in `--stage` (dark) on
  the `--stage-text` paper, so it scans dark-on-light yet re-skins with the theme (the one stable
  dark/light pair). Encoded with `uqr` (`ecc:'M'`, quiet-zone border) — **not** `uqr`'s `renderSVG`,
  which hardcodes black/white. While waiting, the frame carries an accent LED bloom (live / listening);
  on connect it goes green; on cancel it falls dark (recessed, slow decay).
- **Device name** — this device's name below the frame, in `--font-ui`, with a small "This device"
  caption so the user knows which end they're holding.
- **Status row** — a breathing LED dot + status word:
  - `waiting` → accent dot, **"Waiting for the other device…"** (dot breathes; reduced-motion → static lit).
  - `connected` → the frame is replaced by a green check seal; row reads **"Connected"** (+ `to {peerName}`).
  - `cancelled` → amber dot, **"Pairing cancelled"** (frame dim).
- **Cancel** — a recessed action button (`aria-label="Cancel pairing"`), shown only while `waiting`
  (terminal states have nothing to cancel).

## QR + success craft
- One `<svg>` per QR, modules as a single `<path d>` (`shapeRendering="crispEdges"`), `role="img"`
  `aria-label="Pairing QR code"` — the payload is never read aloud to AT.
- **Success seal** replaces the QR chip on `connected`: a large green check medallion (custom inline SVG)
  with an `--led-green` bloom on incandescent timing — the same recessed-off → LED-lit-on signature the
  whole kit speaks, so connection *lights up* rather than swapping to a web success page.
- The frame's bloom is a single `box-shadow` transition keyed off `data-status`, fast attack
  (`--dur-led-on`) / slow decay (`--dur-led-off`).

## Contract (props = data, callbacks = intents)
```ts
type PairStatus = 'waiting' | 'connected' | 'cancelled'
interface PairQRCodeProps {
  code: string             // the Nioh pairing payload encoded into the QR (e.g. nioh://pair/7-tuna-zebra)
  deviceName: string       // THIS device's name — the one being scanned ("Fernando's MacBook")
  status?: PairStatus      // controlled lifecycle; default 'waiting'
  peerName?: string        // the device that connected — shown on the success seal
  size?: 'sm' | 'md'
  onCancel?: () => void    // user pressed Cancel (the real intent — host tears down the session)
}
```
**Controlled, view + intent emitter.** The host store owns the pairing lifecycle (discovery → handshake →
connected, exactly like the real Nioh flow), so it drops into the app with zero rework. The component
owns no socket and no timers — the demo's host drives `status` to show the waiting → connected transition.

## States (all in the gallery)
waiting/showing (default — QR live, accent bloom, Cancel), connected (green seal + peerName), cancelled
(dim frame, amber), focus (Cancel ring), sm size. Plus a live **phone-frame** preview
(`ProductFrame variant="phone"`) wired to a host that flips waiting → connected. Verified light + dark.

The 9 generic state labels map here as: default=waiting · selected=connected · error/disabled=cancelled ·
focus=Cancel ring · empty/loading=n/a (a controlled lifecycle card has no empty/loading of its own —
"waiting" *is* the loading-equivalent, already covered). Recorded so a reviewer sees a deliberate call.

## Decisions (Chroma-consistent, recorded per headless brief)
- **Waiting bloom = accent, success = `--led-green`, cancel = dim + `--led-amber` dot.** Green is the
  semantic "connected/go" (matches ShareLink's green success); accent is the generic "live" bloom on the
  well (matches ShareLink's `active`); amber = attention/terminal-stop. All via tokens, verified light + dark.
- **QR colouring reuses the ShareLink precedent** (dark `--stage` modules on `--stage-text` paper) — the
  one stable scan-safe + themeable pair. Compose-mappable: the modules come from `uqr`'s bit matrix, a
  generated bitmap/vector, not a web-only DOM render.
- **`connected` swaps the QR for a seal rather than dimming it** — a pairing UI must not keep showing a
  now-stale scannable code after the link is up; the seal is the unambiguous "you're connected" affordance.
- **Cancel hidden in terminal states, no retry/Done callbacks** — YAGNI; the card asks for Cancel only.
  Re-showing is a host concern (set `status` back to `waiting`), demonstrated in the playground.
- **One ARIA model:** Cancel is a plain action button (relabel pattern, no `aria-pressed`). The status
  line is `role="status"` `aria-live="polite"` so the waiting → connected/cancelled transition is
  announced once, without dot-spam.
- **Reduced motion:** the breathing dot snaps to a static lit dot; the frame/seal bloom (state-carrying,
  functional) stays. No animation library — CSS only.
