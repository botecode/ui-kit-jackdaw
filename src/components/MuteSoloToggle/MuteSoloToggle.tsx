// src/components/MuteSoloToggle/MuteSoloToggle.tsx
import { useThemeComponent } from '../../theme/themeComponents'
import styles from './MuteSoloToggle.module.css'

// ─── Pure utility ───────────────────────────────────────────────────────────

export function isSilencedBySolo(
  muted: boolean,
  soloed: boolean,
  anySoloActive: boolean | undefined,
): boolean {
  return !!anySoloActive && !soloed && !muted
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface MuteSoloToggleProps {
  muted: boolean
  soloed: boolean
  onToggleMute: (e: React.MouseEvent<HTMLButtonElement>) => void
  onToggleSolo: (e: React.MouseEvent<HTMLButtonElement>) => void
  anySoloActive?: boolean
  size?: 'sm' | 'md'
  orientation?: 'stacked' | 'inline'
  disabled?: boolean
  muteLabel?: string
  soloLabel?: string
}

// ─── Component ──────────────────────────────────────────────────────────────

function MuteSoloToggleBase({
  muted,
  soloed,
  onToggleMute,
  onToggleSolo,
  anySoloActive,
  size = 'md',
  orientation = 'stacked',
  disabled = false,
  muteLabel = 'Mute',
  soloLabel = 'Solo',
}: MuteSoloToggleProps) {
  const silenced = isSilencedBySolo(muted, soloed, anySoloActive)

  return (
    <div
      className={`${styles.root}${disabled ? ` ${styles.disabled}` : ''}`}
      data-orientation={orientation}
      data-size={size}
    >
      <button
        className={styles.chip}
        data-variant="mute"
        data-active={muted || undefined}
        data-silenced={silenced || undefined}
        aria-pressed={muted}
        aria-label={silenced ? `${muteLabel} (silenced by solo)` : muteLabel}
        title={silenced ? 'Silenced by solo' : undefined}
        onClick={onToggleMute}
        disabled={disabled}
      >
        <span aria-hidden="true">M</span>
      </button>
      <button
        className={styles.chip}
        data-variant="solo"
        data-active={soloed || undefined}
        aria-pressed={soloed}
        aria-label={soloLabel}
        onClick={onToggleSolo}
        disabled={disabled}
      >
        <span aria-hidden="true">S</span>
      </button>
    </div>
  )
}

// Theme-aware resolver: the active theme's variant, or the base.
export function MuteSoloToggle(props: MuteSoloToggleProps) {
  const Impl = useThemeComponent('MuteSoloToggle', MuteSoloToggleBase)
  return <Impl {...props} />
}
