// src/gallery/registry.ts
import type { ComponentType } from 'react'
import { surfacesFor, type Surface } from './surfaces'

export interface DemoMeta {
  name: string
  group: 'Foundations' | 'Primitives' | 'Composites'
  route: string
  order: number
  // The surface(s) a component is used on (web / app / daw). Optional in a
  // demo's own `meta` — the registry fills it from the central tag map
  // (`surfacesFor`) so every entry in DEMOS carries a resolved surface list.
  surface?: Surface[]
}

interface DemoModule {
  meta: DemoMeta
  default: ComponentType
}

/** A registered demo whose `surface` has been resolved (never undefined). */
export interface ResolvedDemoModule extends DemoModule {
  meta: DemoMeta & { surface: Surface[] }
}

const VALID_GROUPS = new Set(['Foundations', 'Primitives', 'Composites'])

// Auto-discovers all *.demo.tsx files under components/.
// Adding a demo file is all it takes for a component to appear in the gallery.
const modules = import.meta.glob('../components/**/*.demo.tsx', { eager: true })

const validDemos: DemoModule[] = (Object.values(modules) as Partial<DemoModule>[]).filter((m): m is DemoModule =>
  typeof m.meta?.name === 'string' &&
  typeof m.meta?.route === 'string' &&
  typeof m.meta?.order === 'number' &&
  VALID_GROUPS.has(m.meta?.group as string) &&
  typeof m.default === 'function'
)

// Resolve each demo's surface(s): a demo may set `meta.surface` explicitly,
// otherwise we fall back to the central tag map (default = all three surfaces).
export const DEMOS: ResolvedDemoModule[] = validDemos.map(m => ({
  ...m,
  meta: { ...m.meta, surface: m.meta.surface ?? surfacesFor(m.meta.name) },
}))

export const DEMO_MAP: Record<string, ComponentType> = Object.fromEntries(
  DEMOS.map(d => [d.meta.route, d.default])
)
