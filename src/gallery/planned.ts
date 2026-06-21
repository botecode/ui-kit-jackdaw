// src/gallery/planned.ts
import type { DemoMeta } from './registry'

// Items planned but not yet built. Do NOT prune by hand — subtractBuilt() drops any
// name that appears in the registry, so this list stays accurate automatically.
export const PLANNED: Array<Pick<DemoMeta, 'name' | 'group' | 'route'>> = [
  { name: 'MuteSoloToggle',           group: 'Primitives',  route: '/mute-solo' },
  { name: 'TransportBar',             group: 'Primitives',  route: '/transport' },
  { name: 'TimelineRuler',            group: 'Primitives',  route: '/timeline-ruler' },
  { name: 'Dialog',                   group: 'Primitives',  route: '/dialog' },
  { name: 'Tooltip',                  group: 'Primitives',  route: '/tooltip' },
  { name: 'Toggle',                   group: 'Primitives',  route: '/toggle' },
  { name: 'Badge',                    group: 'Primitives',  route: '/badge' },
  { name: 'FolderTrackHeader',        group: 'Composites',  route: '/folder-track-header' },
  { name: 'TrackLane',                group: 'Composites',  route: '/track-lane' },
  { name: 'FocusedTrackDetailPanel',  group: 'Composites',  route: '/focus-panel' },
  { name: 'ThemeSwitcher',            group: 'Composites',  route: '/theme-switcher' },
  { name: 'ProjectPicker',            group: 'Composites',  route: '/project-picker' },
]

/** Returns planned items whose names are NOT in `builtNames`. Pure — no imports from registry. */
export function subtractBuilt<T extends { name: string }>(
  planned: T[],
  builtNames: ReadonlySet<string>,
): T[] {
  return planned.filter(p => !builtNames.has(p.name))
}
