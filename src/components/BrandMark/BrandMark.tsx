// src/components/BrandMark/BrandMark.tsx
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeId } from '../../tokens/types'
import markSrc from '../../assets/brand/jackdaw-mark.png'
import wordmarkDarkSrc from '../../assets/brand/jackdaw-wordmark-dark.png'
import wordmarkLightSrc from '../../assets/brand/jackdaw-wordmark-light.png'
import styles from './BrandMark.module.css'

// Themes whose --bg is dark enough to need white-letter wordmark.
// Light themes (chroma, bubble-gum-pop, manuscript, tropicalia) use the dark-letter variant.
const DARK_THEMES = new Set<ThemeId>([
  'default', 'bowie', 'buckley', 'golden-hour', 'gil', 'pine',
  'ink', 'nocturne', 'reaper', 'songwriter', 'techno',
])

export interface BrandMarkProps {
  /** mark = icon only · wordmark = JACKDAW text only · lockup = both stacked */
  variant?: 'mark' | 'wordmark' | 'lockup'
  /** Sets font-size in px; all internal em values scale from this. Default 64. */
  size?: number
  className?: string
}

export function BrandMark({
  variant = 'mark',
  size = 64,
  className,
}: BrandMarkProps) {
  const { theme } = useTheme()
  // Dark themes need white-letter wordmark; light themes use dark-letter wordmark.
  // TODO(brand-assets): replace transparent 1×1 stubs in src/assets/brand/ with real exports from design.
  const wordmarkSrc = DARK_THEMES.has(theme) ? wordmarkLightSrc : wordmarkDarkSrc

  const showMark     = variant === 'mark'     || variant === 'lockup'
  const showWordmark = variant === 'wordmark' || variant === 'lockup'

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-variant={variant}
      style={{ fontSize: size }}
      role="img"
      aria-label="Jackdaw"
    >
      {showMark && (
        <img
          src={markSrc}
          alt=""
          className={styles.markImg}
        />
      )}
      {showWordmark && (
        <img
          src={wordmarkSrc}
          alt=""
          className={styles.wordmarkImg}
        />
      )}
    </div>
  )
}
