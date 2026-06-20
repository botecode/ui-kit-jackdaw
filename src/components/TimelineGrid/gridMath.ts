export type Division = '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/8T' | '1/16T'

/**
 * Pixel width of one subdivision step.
 *
 * Whole-note width = denominator × pxPerBeat.
 * Regular note 1/X = whole / X.
 * Triplet 1/XT = (2/3) × regular 1/X = whole / (X × 1.5).
 * Bar (1/1) = numerator × pxPerBeat (not "whole note" — bar width in the ruler's sense).
 */
export function divisionToPx(
  division: Division,
  pxPerBeat: number,
  numerator: number,
  denominator: number,
): number {
  if (pxPerBeat <= 0) return 1
  const wholeNotePx = denominator * pxPerBeat
  switch (division) {
    case '1/1':   return numerator * pxPerBeat
    case '1/2':   return wholeNotePx / 2
    case '1/4':   return wholeNotePx / 4
    case '1/8':   return wholeNotePx / 8
    case '1/16':  return wholeNotePx / 16
    case '1/8T':  return wholeNotePx / 12   // (2/3) × eighth
    case '1/16T': return wholeNotePx / 24   // (2/3) × sixteenth
  }
}

/**
 * Snap an x pixel position to the nearest division boundary.
 * Mirrors snapXToGrid in rulerMath but accepts an arbitrary step.
 */
export function snapXToDivision(x: number, divisionPx: number): number {
  if (divisionPx <= 0) return x
  return Math.round(x / divisionPx) * divisionPx
}
