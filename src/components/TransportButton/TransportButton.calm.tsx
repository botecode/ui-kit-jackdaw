// src/components/TransportButton/TransportButton.calm.tsx
// Calm-theme variant: a soft rounded button, no recessed well, no LED bloom.
// Playing reads as a gentle accent-green fill rather than a glowing transport.
import { Play, Pause, Stop } from '@phosphor-icons/react'
import type { TransportButtonProps } from './TransportButton'
import styles from './TransportButton.calm.module.css'

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

export function TransportButtonCalm({
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
      <Icon aria-hidden size={ICON_SIZE[size]} weight={isPlaying ? 'fill' : 'regular'} />
    </button>
  )
}
