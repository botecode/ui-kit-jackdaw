// src/index.ts — @jackdaw/kit library entry (the design system, for the DAW to consume).
//
// Usage in the DAW:
//   import '@jackdaw/kit/styles.css'                 // tokens + fonts + component styles
//   import { ThemeProvider, TransportBar } from '@jackdaw/kit'
//   <ThemeProvider theme="chroma"> … </ThemeProvider>
//
// This file is generated/curated; keep the component list alphabetical.

import './tokens/reset.css'
import './tokens/global.css'

// ── Theme system (wrap the app in ThemeProvider so tokens + portals resolve) ──
export {
  ThemeProvider,
  ThemeRoot,
  ThemeContext,
  useTheme,
  usePortalTarget,
} from './theme/ThemeProvider'
export { THEMES } from './tokens/themes'
export { chromaTheme } from './tokens/themes/chroma'
export type { ThemeId, ThemeMeta, ThemeTokens } from './tokens/types'

// ── Components ──
export * from './components/AnnotationEditor'
export * from './components/AnnotationLane'
export * from './components/AppShell'
export * from './components/ArmButton'
export * from './components/Arrangement'
export * from './components/AutomationButton'
export * from './components/AutomationLane'
export * from './components/Avatar'
export * from './components/Badge'
export * from './components/BrandMark'
export * from './components/ChannelStrip'
export * from './components/Checkbox'
export * from './components/Clip'
export * from './components/Clock'
export * from './components/ColorSwatch'
export * from './components/CommentsPanel'
export * from './components/ContextMenu'
export * from './components/Dialog'
export * from './components/DotMatrix'
export * from './components/EditCursor'
export * from './components/ExportDialog'
export * from './components/Fader'
export * from './components/FocusedTrackDetailPanel'
export * from './components/FolderTrackHeader'
export * from './components/FxChip'
export * from './components/IdeasLibrary'
export * from './components/InputLabels'
export * from './components/InputSelect'
export * from './components/Kbd'
export * from './components/LookAndFeelPanel'
export * from './components/Meter'
export * from './components/Mixer'
export * from './components/MuteSoloToggle'
export * from './components/NavRail'
export * from './components/NumberField'
export * from './components/OnboardingStep'
export * from './components/PanKnob'
export * from './components/Panel'
export * from './components/PhaseInvert'
export * from './components/PianoRoll'
export * from './components/Playhead'
export * from './components/Popover'
export * from './components/Preferences'
export * from './components/Progress'
export * from './components/ProjectPicker'
export * from './components/RecordMode'
export * from './components/RepeatToggle'
export * from './components/ReturnTrackHeader'
export * from './components/ScrollArea'
export * from './components/SegmentedControl'
export * from './components/SendChip'
export * from './components/Share'
export * from './components/Shortcuts'
export * from './components/SongNotesEditor'
export * from './components/SplashScreen'
export * from './components/SupportFlow'
export * from './components/Tabs'
export * from './components/TextField'
export * from './components/ThemeSwitcher'
export * from './components/TimeSelection'
export * from './components/TimelineGrid'
export * from './components/TimelineRuler'
export * from './components/Toast'
export * from './components/Toggle'
export * from './components/Tooltip'
export * from './components/TrackHeader'
export * from './components/TrackLane'
export * from './components/TransportBar'
export * from './components/TransportButton'
export * from './components/Versions'

// Shared annotation domain types are exported by BOTH AnnotationEditor and AnnotationLane;
// re-export explicitly to disambiguate the wildcard exports above (resolves TS2308).
export type { AnnotationType, AudioRef } from './components/AnnotationEditor'
