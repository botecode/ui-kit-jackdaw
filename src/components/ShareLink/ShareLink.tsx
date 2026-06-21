// src/components/ShareLink/ShareLink.tsx
import { useMemo, useRef, useState } from 'react'
import { Copy, Check } from '@phosphor-icons/react'
import { encode } from 'uqr'
import styles from './ShareLink.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShareLinkProps {
  /** The full deep link, e.g. `jackdaw://share/7-tuna-zebra-piano`. */
  link: string
  /** LED bloom on the well while the link is live (peer connecting / transferring). */
  active?: boolean
  size?: 'sm' | 'md'
  /** Show the scannable QR of the link. Default true. */
  showQR?: boolean
  /** Fired when the user copies the link (the real intent — clipboard is best-effort). */
  onCopy?: (link: string) => void
}

// ── QR ────────────────────────────────────────────────────────────────────────
// Bespoke, token-coloured QR. We encode with uqr and render the modules as a
// single SVG path so the colours come from CSS variables (NOT uqr's renderSVG,
// which hardcodes black/white). Dark modules on a light "paper" chip → scans
// dark-on-light while still theming, because --stage / --stage-text are the one
// stable dark-well / light-on-stage pair in every theme.

function QrCode({ value, size }: { value: string; size: number }) {
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
    <div className={styles.qrChip} style={{ '--_qr-size': `${size}px` } as React.CSSProperties}>
      <svg
        className={styles.qr}
        viewBox={`0 0 ${n} ${n}`}
        role="img"
        aria-label="QR code for the share link"
        shapeRendering="crispEdges"
      >
        <path className={styles.qrModules} d={d} />
      </svg>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// A hero readout of the share deep link: large mono in a recessed well that
// lights with an accent LED bloom when live, an inline copy button, and a QR of
// the same link. Extends the Share code readout (link + QR, not a bare code).

export function ShareLink({ link, active, size = 'md', showQR = true, onCopy }: ShareLinkProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCopy() {
    navigator.clipboard?.writeText(link).catch(() => {})
    onCopy?.(link)
    setCopied(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  const qrSize = size === 'sm' ? 104 : 132

  return (
    <div className={styles.root} data-size={size}>
      <div className={styles.well} data-active={active || undefined} aria-label="Share link">
        <span className={styles.linkText}>{link}</span>
        <button
          type="button"
          className={styles.copyBtn}
          onClick={handleCopy}
          aria-label={copied ? 'Link copied' : 'Copy share link'}
        >
          {copied
            ? <Check size={16} weight="bold" aria-hidden="true" />
            : <Copy size={16} weight="regular" aria-hidden="true" />}
        </button>
      </div>

      {showQR && (
        <div className={styles.qrRow}>
          <QrCode value={link} size={qrSize} />
          <span className={styles.qrHint}>Scan to open in Jackdaw</span>
        </div>
      )}

      {copied && (
        <span role="status" aria-live="polite" className={styles.copiedToast}>
          Copied!
        </span>
      )}
    </div>
  )
}
