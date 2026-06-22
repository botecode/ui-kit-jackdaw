// src/components/PairQRCode/PairQRCode.tsx
import { useMemo } from 'react'
import { encode } from 'uqr'
import styles from './PairQRCode.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PairStatus = 'waiting' | 'connected' | 'cancelled'

export interface PairQRCodeProps {
  /** The Nioh pairing payload encoded into the QR, e.g. `nioh://pair/7-tuna-zebra-piano`. */
  code: string
  /** THIS device's name — the one being scanned ("Fernando's MacBook"). */
  deviceName: string
  /** Controlled pairing lifecycle. Default `waiting`. */
  status?: PairStatus
  /** The device that connected — shown on the success seal. */
  peerName?: string
  size?: 'sm' | 'md'
  /** Fired when the user presses Cancel (host tears down the session). */
  onCancel?: () => void
}

// ── QR ────────────────────────────────────────────────────────────────────────
// Bespoke, token-coloured QR (the ShareLink precedent): encode with uqr and paint
// the modules as a single SVG path so the colours come from CSS variables (NOT
// uqr's renderSVG, which hardcodes black/white). Dark `--stage` modules on a light
// `--stage-text` "paper" chip → scans dark-on-light while still theming, because
// stage / stage-text are the one stable dark-well / light-on-stage pair in every
// theme. The matrix is a generated bitmap → Compose-mappable, not a web-only render.

function QrCode({ value }: { value: string }) {
  const { n, d } = useMemo(() => {
    const qr = encode(value, { ecc: 'M', border: 2 })
    let path = ''
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.data[y][x]) path += `M${x} ${y}h1v1h-1z`
      }
    }
    return { n: qr.size, d: path }
  }, [value])

  return (
    <svg
      className={styles.qr}
      viewBox={`0 0 ${n} ${n}`}
      role="img"
      aria-label="Pairing QR code"
      shapeRendering="crispEdges"
    >
      <path className={styles.qrModules} d={d} data-testid="pairqrcode-qr-path" />
    </svg>
  )
}

// Custom success seal — the recessed-off → LED-lit-on signature applied to a
// connection: a green check medallion that blooms when the link is up. Inline SVG
// (a bespoke glyph), not a Phosphor icon, so it carries the LED treatment.
function SuccessSeal() {
  return (
    <div className={styles.seal} data-testid="pairqrcode-seal">
      <svg className={styles.sealGlyph} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 12.5l4.2 4.3L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// "Show this to connect" — the device being scanned during a Nioh pairing
// handshake. A large token-coloured QR is seated in a recessed readout frame (the
// hero), this device's name below, a calm "Waiting for the other device…"
// indicator + Cancel. On connect, the frame transitions to a green LED success
// seal; on cancel it falls dark.
//
// Why this isn't a webpage: a web pairing page drops a flat black-on-white QR onto
// a card and swaps to a green "Success!" banner. This is the kit's hardware idiom
// instead — the QR is a tactile paper chip embedded in a recessed `--stage` well,
// the well lights with incandescent timing while it listens for a peer, and the
// connection *lights up* as an LED seal (recessed-off → lit-on) rather than routing
// to a success screen. Status is announced once via role=status, not dot-spammed.

export function PairQRCode({
  code,
  deviceName,
  status = 'waiting',
  peerName,
  size = 'md',
  onCancel,
}: PairQRCodeProps) {
  const statusText =
    status === 'connected'
      ? peerName
        ? `Connected to ${peerName}`
        : 'Connected'
      : status === 'cancelled'
        ? 'Pairing cancelled'
        : 'Waiting for the other device…'

  return (
    <div className={styles.root} data-size={size} data-status={status} data-testid="pairqrcode-root">
      <p className={styles.kicker}>Show this to connect</p>

      {/* The hero: recessed frame holding the QR paper chip, or the success seal. */}
      <div className={styles.frame} data-status={status}>
        <div className={styles.chip}>
          {status === 'connected' ? <SuccessSeal /> : <QrCode value={code} />}
        </div>
      </div>

      <div className={styles.device}>
        <span className={styles.deviceCaption}>This device</span>
        <span className={styles.deviceName}>{deviceName}</span>
      </div>

      <p
        className={styles.status}
        data-status={status}
        role="status"
        aria-live="polite"
        data-testid="pairqrcode-status"
      >
        <span className={styles.dot} data-status={status} aria-hidden="true" />
        {statusText}
      </p>

      {status === 'waiting' && (
        <button type="button" className={styles.cancel} onClick={onCancel} aria-label="Cancel pairing">
          Cancel
        </button>
      )}
    </div>
  )
}
