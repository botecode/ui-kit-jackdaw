// src/components/CoverPicker/index.ts
export { CoverPicker, isValidImageLink } from './CoverPicker'
export type { CoverPickerProps, CoverTabId } from './CoverPicker'
export {
  DEFAULT_COLOR_PRESETS,
  DEFAULT_GRADIENT_PRESETS,
  DEFAULT_TEXTURE_PRESETS,
} from './presets'
export type { CoverPreset } from './presets'
// Re-export the shared cover contract so consumers pull it from one place.
export type {
  CoverChoice,
  CoverAttribution,
  CoverUnsplashResult,
} from '../../lib/covers'
export { coverStyle } from '../../lib/covers'
