// src/gallery/planned.ts
import type { DemoMeta } from './registry'

// Items planned but not yet built. Rendered as dimmed non-links in the sidebar.
// Remove an item here when its .demo.tsx file lands — it will auto-appear via glob.
export const PLANNED: Array<Pick<DemoMeta, 'name' | 'group' | 'route'>> = [
  { name: 'MuteSoloToggle',           group: 'Primitives',  route: '/mute-solo' },
  { name: 'TransportBar',             group: 'Primitives',  route: '/transport' },
  { name: 'TimelineRuler',            group: 'Primitives',  route: '/timeline-ruler' },
  { name: 'ContextMenu',              group: 'Primitives',  route: '/context-menu' },
  { name: 'Dialog',                   group: 'Primitives',  route: '/dialog' },
  { name: 'Tooltip',                  group: 'Primitives',  route: '/tooltip' },
  { name: 'Toggle',                   group: 'Primitives',  route: '/toggle' },
  { name: 'Badge',                    group: 'Primitives',  route: '/badge' },
  { name: 'TrackHeader',              group: 'Composites',  route: '/track-header' },
  { name: 'FolderTrackHeader',        group: 'Composites',  route: '/folder-track-header' },
  { name: 'TrackLane',                group: 'Composites',  route: '/track-lane' },
  { name: 'FocusedTrackDetailPanel',  group: 'Composites',  route: '/focus-panel' },
  { name: 'ThemeSwitcher',            group: 'Composites',  route: '/theme-switcher' },
  { name: 'ProjectPicker',            group: 'Composites',  route: '/project-picker' },
]
