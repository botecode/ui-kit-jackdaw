export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// value↔position mapping + default formatter. toPosition/toValue receive the
// component's min/max so linearScale can use them; dbScale ignores them (uses
// its own baked-in parameters).
export interface FaderScale {
  toPosition(value: number, min: number, max: number): number  // → 0..1
  toValue(position: number, min: number, max: number): number
  defaultFormat(value: number): string
}

export function linearScale(): FaderScale {
  return {
    toPosition(value, min, max) {
      if (max === min) return 0
      return (value - min) / (max - min)
    },
    toValue(position, min, max) {
      return min + position * (max - min)
    },
    defaultFormat(value) {
      return value.toFixed(2)
    },
  }
}

// Classic fader law: piecewise linear in dB. Range [dbMin, 0] maps to
// position [0, unityAt]; range [0, dbMax] maps to [unityAt, 1].
// Ignores the component's min/max args — uses its own baked parameters.
export function dbScale({
  min: dbMin = -60,
  max: dbMax = 6,
  unityAt = 0.75,
}: { min?: number; max?: number; unityAt?: number } = {}): FaderScale {
  return {
    toPosition(value) {
      if (value <= dbMin) return 0
      if (value >= dbMax) return 1
      if (value <= 0) {
        return ((value - dbMin) / (0 - dbMin)) * unityAt
      }
      return unityAt + (value / dbMax) * (1 - unityAt)
    },
    toValue(position) {
      const p = clamp(position, 0, 1)
      if (p <= 0) return dbMin
      if (p >= 1) return dbMax
      if (p <= unityAt) {
        return dbMin + (p / unityAt) * (0 - dbMin)
      }
      return ((p - unityAt) / (1 - unityAt)) * dbMax
    },
    defaultFormat(value) {
      if (value <= dbMin) return '-∞ dB'
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(1)} dB`
    },
  }
}

export function quantizeValue(
  value: number,
  step: number | undefined,
  min: number,
  max: number,
): number {
  if (step === undefined || step <= 0) return value
  const snapped = Math.round((value - min) / step + 1e-10) * step + min
  return clamp(snapped, min, max)
}
