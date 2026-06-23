// src/theme/themeComponents.tsx
//
// ── Aware themes ──────────────────────────────────────────────────────────────
// A theme used to be *only* a bag of colour tokens (see tokens/themes/*). An
// "aware theme" can additionally ship its OWN implementations of DAW components,
// so the look of a control is no longer just a reskin of one shared component —
// each theme can hand-build the instrument it wants.
//
// The contract here is deliberately narrow: only DAW primitives/composites are
// themeable (we do NOT vary the web/mobile marketing components per theme). A
// theme declares overrides in `theme/themeRegistry.tsx`; the public component is
// a thin resolver that asks `useThemeComponent` for the active theme's variant
// and falls back to the shared base implementation when none is registered.
//
// Runtime note: this module imports ONLY types from component files (so the
// resolver components can import the hook back without a runtime cycle). The
// actual variant implementations are wired up in `themeRegistry.tsx`.
import { createContext, useContext } from 'react'
import type { ComponentType } from 'react'

import type { ArmButtonProps } from '../components/ArmButton/ArmButton'
import type { MuteSoloToggleProps } from '../components/MuteSoloToggle/MuteSoloToggle'
import type { FaderProps } from '../components/Fader/Fader'
import type { MeterProps } from '../components/Meter/Meter'
import type { TrackHeaderProps } from '../components/TrackHeader/TrackHeader'

/**
 * The set of DAW components a theme is allowed to override, keyed by the public
 * component name. Add a key here (and a resolver in the component file) to make
 * another control theme-aware.
 */
export interface ThemeComponentOverrides {
  ArmButton?:      ComponentType<ArmButtonProps>
  MuteSoloToggle?: ComponentType<MuteSoloToggleProps>
  Fader?:          ComponentType<FaderProps>
  Meter?:          ComponentType<MeterProps>
  TrackHeader?:    ComponentType<TrackHeaderProps>
}

/** Active theme's component overrides. Empty = every control uses its base. */
export const ThemeComponentsContext = createContext<ThemeComponentOverrides>({})

/**
 * Resolve the implementation to render for a themeable component: the active
 * theme's variant if it registered one, otherwise the shared `base`.
 *
 *   export function ArmButton(props: ArmButtonProps) {
 *     const Impl = useThemeComponent('ArmButton', ArmButtonBase)
 *     return <Impl {...props} />
 *   }
 */
export function useThemeComponent<K extends keyof ThemeComponentOverrides>(
  key: K,
  base: NonNullable<ThemeComponentOverrides[K]>,
): NonNullable<ThemeComponentOverrides[K]> {
  const overrides = useContext(ThemeComponentsContext)
  return (overrides[key] ?? base) as NonNullable<ThemeComponentOverrides[K]>
}
