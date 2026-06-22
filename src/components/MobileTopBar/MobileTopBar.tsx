// src/components/MobileTopBar/MobileTopBar.tsx
import type { ReactNode } from 'react'
import { QrCode } from '@phosphor-icons/react'
import styles from './MobileTopBar.module.css'

// ── Contract ──────────────────────────────────────────────────────────────────
// The Jackdaw mobile app's custom top bar. App surface (not the marketing site,
// not a control), built from the same Chroma tokens so the handset app feels like
// the same milled object as the desktop instrument. Compose-mappable: a Row with a
// centered Text title and a trailing icon button — a hand-built TopAppBar.
//
// Why this isn't a webpage (or a Material default): an Android top bar is a flat
// tinted strip carrying a Roboto title and an elevation drop-shadow, with controls
// that ripple-flash on tap. This one is milled from the cream block instead — a warm
// surface closed by a single hairline bottom keyline and a 1px top-highlight (a panel
// edge catching light, NOT a float shadow). The wordmark is set in the display face
// with its ".nest" tail dimmed like an engraved domain. The QR/sync action is a
// recessed well that presses 1px like a physical key on tap — no ripple, no float,
// no Roboto. A three-track grid (1fr · auto · 1fr) keeps the wordmark optically
// centred no matter what sits in the optional left slot.

export interface MobileTopBarProps {
  /** Centered wordmark. The substring from the first "." is dimmed like a TLD tail. */
  brand?: string
  /**
   * Optional left slot — e.g. a back button or menu. Reserves a balanced track even
   * when empty so the wordmark stays centred.
   */
  left?: ReactNode
  /** Sync intent — fired when the QR/sync action is tapped (opens device sync). */
  onSync?: () => void
  /** Accessible label for the QR/sync action. */
  syncLabel?: string
  size?: 'sm' | 'md'
  className?: string
}

// Split the wordmark at its first dot so "Jackdaw.nest" reads "Jackdaw" + dimmed
// ".nest". No dot → the whole string is the head and the tail is empty.
function splitBrand(brand: string): [head: string, tail: string] {
  const dot = brand.indexOf('.')
  if (dot < 0) return [brand, '']
  return [brand.slice(0, dot), brand.slice(dot)]
}

export function MobileTopBar({
  brand = 'Jackdaw.nest',
  left,
  onSync,
  syncLabel = 'Sync devices',
  size = 'md',
  className,
}: MobileTopBarProps) {
  const [head, tail] = splitBrand(brand)

  return (
    <header
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
    >
      {/* Left track — optional slot, reserved even when empty to keep center true. */}
      <div className={styles.left}>{left}</div>

      {/* Center track — the wordmark, always optically centred by the 1fr·auto·1fr grid. */}
      <div className={styles.brand}>
        <span className={styles.brandHead}>{head}</span>
        {tail && <span className={styles.brandTail}>{tail}</span>}
      </div>

      {/* Right track — the QR/sync action. Momentary action button (relabel pattern,
          no aria-pressed): the label always says what the tap does. */}
      <div className={styles.right}>
        <button
          type="button"
          className={styles.sync}
          aria-label={syncLabel}
          onClick={() => onSync?.()}
        >
          <QrCode weight="regular" size={size === 'sm' ? 18 : 20} />
        </button>
      </div>
    </header>
  )
}
