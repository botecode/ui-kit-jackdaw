// src/components/Meter/Meter.calm.tsx
// Calm-theme variant of Meter. Where the base meter is a stack of LED color-block
// segments in a black well, Calm is a single soft ink wash that rises with level
// — sage in the safe zone, warming to a dusty amber/terracotta near the top. No
// segments, no glow. The height transition gives a gentle, ballistic-ish settle.
import { useMemo } from 'react'
import { dbScale, clamp } from '../Fader/faderScales'
import type { MeterProps } from './Meter'
import styles from './Meter.calm.module.css'

interface CalmChannelProps {
  value: number
  min: number
  max: number
  orientation: 'vertical' | 'horizontal'
  ariaLabel: string
}

function CalmChannel({ value, min, max, orientation, ariaLabel }: CalmChannelProps) {
  const scale = useMemo(() => dbScale({ min, max }), [min, max])
  const pos = clamp(scale.toPosition(value, min, max), 0, 1)
  const readout = scale.defaultFormat(value)

  return (
    <div
      className={styles.channel}
      data-orientation={orientation}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={readout}
      aria-label={ariaLabel}
    >
      <div className={styles.well} data-testid="meter-well">
        <div className={styles.fill} style={{ '--pos': pos } as React.CSSProperties} />
      </div>
    </div>
  )
}

export function MeterCalm({
  value,
  valueL,
  valueR,
  min = -60,
  max = 6,
  orientation = 'vertical',
  size = 'md',
  'aria-label': ariaLabel = 'Meter',
}: MeterProps) {
  const isStereo = valueL !== undefined && valueR !== undefined

  return (
    <div
      className={styles.root}
      data-orientation={orientation}
      data-size={size}
      data-stereo={isStereo || undefined}
    >
      {isStereo ? (
        <>
          <CalmChannel value={valueL} min={min} max={max} orientation={orientation} ariaLabel={`${ariaLabel} L`} />
          <CalmChannel value={valueR} min={min} max={max} orientation={orientation} ariaLabel={`${ariaLabel} R`} />
        </>
      ) : (
        <CalmChannel value={value ?? min} min={min} max={max} orientation={orientation} ariaLabel={ariaLabel} />
      )}
    </div>
  )
}
