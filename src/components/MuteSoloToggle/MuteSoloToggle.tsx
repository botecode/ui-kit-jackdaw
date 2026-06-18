export function isSilencedBySolo(
  muted: boolean,
  soloed: boolean,
  anySoloActive: boolean | undefined,
): boolean {
  return !!anySoloActive && !soloed && !muted
}
