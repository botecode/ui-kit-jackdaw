// src/components/TransportButton/TransportButton.tsx
import { Play, Pause, Stop } from '@phosphor-icons/react'
import { useThemeComponent } from '../../theme/themeComponents'
import styles from './TransportButton.module.css'

export interface TransportButtonProps {
  variant: 'play' | 'stop' | 'pause'
  /** Controls icon swap and green LED bloom. Only meaningful for variant="play". */
  playing?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md'
  disabled?: boolean
  'aria-label'?: string
}

const ICON_SIZE: Record<'sm' | 'md', number> = { sm: 16, md: 20 }

const DEFAULT_LABELS: Record<string, string> = {
  'play-false': 'Play',
  'play-true':  'Pause',
  'stop':       'Stop',
  'pause':      'Pause',
}

function resolveIcon(variant: TransportButtonProps['variant'], playing: boolean) {
  if (variant === 'play') return playing ? Pause : Play
  if (variant === 'stop') return Stop
  return Pause
}

function TransportButtonBase({
  variant,
  playing = false,
  onClick,
  size = 'md',
  disabled,
  'aria-label': ariaLabel,
}: TransportButtonProps) {
  const labelKey = variant === 'play' ? `play-${playing}` : variant
  const label = ariaLabel ?? DEFAULT_LABELS[labelKey]
  const Icon = resolveIcon(variant, playing)
  const isPlaying = variant === 'play' && playing

  return (
    <button
      type="button"
      className={styles.root}
      data-variant={variant}
      data-size={size}
      data-playing={isPlaying || undefined}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden size={ICON_SIZE[size]} />
    </button>
  )
}

// Theme-aware resolver: the active theme's variant, or the base.
export function TransportButton(props: TransportButtonProps) {
  const Impl = useThemeComponent('TransportButton', TransportButtonBase)
  return <Impl {...props} />
}
