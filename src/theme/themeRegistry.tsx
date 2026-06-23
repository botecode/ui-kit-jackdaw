// src/theme/themeRegistry.tsx
//
// The per-theme component map for "aware themes". A theme listed here ships its
// own implementations of DAW components; the public components resolve against
// this map via `useThemeComponent` (themeComponents.tsx). Themes NOT listed here
// (Chroma, Manuscript, …) simply use the shared base implementations and remain
// pure colour-token reskins.
//
// Only DAW primitives/composites are themeable — web/mobile marketing components
// are never varied per theme.
import type { ThemeId } from '../tokens/types'
import type { ThemeComponentOverrides } from './themeComponents'

import { ArmButtonCalm } from '../components/ArmButton/ArmButton.calm'
import { MuteSoloToggleCalm } from '../components/MuteSoloToggle/MuteSoloToggle.calm'
import { FaderCalm } from '../components/Fader/Fader.calm'
import { MeterCalm } from '../components/Meter/Meter.calm'
import { TrackHeaderCalm } from '../components/TrackHeader/TrackHeader.calm'

export const THEME_COMPONENTS: Partial<Record<ThemeId, ThemeComponentOverrides>> = {
  calm: {
    ArmButton:      ArmButtonCalm,
    MuteSoloToggle: MuteSoloToggleCalm,
    Fader:          FaderCalm,
    Meter:          MeterCalm,
    TrackHeader:    TrackHeaderCalm,
  },
}
