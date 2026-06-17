// src/gallery/registry.ts
import type { ComponentType } from 'react'

export interface DemoMeta {
  name: string
  group: 'Foundations' | 'Primitives' | 'Composites'
  route: string
  order: number
}

interface DemoModule {
  meta: DemoMeta
  default: ComponentType
}

const VALID_GROUPS = new Set(['Foundations', 'Primitives', 'Composites'])

// Auto-discovers all *.demo.tsx files under components/.
// Adding a demo file is all it takes for a component to appear in the gallery.
const modules = import.meta.glob('../components/**/*.demo.tsx', { eager: true })

export const DEMOS: DemoModule[] = (Object.values(modules) as Partial<DemoModule>[]).filter((m): m is DemoModule =>
  typeof m.meta?.name === 'string' &&
  typeof m.meta?.route === 'string' &&
  typeof m.meta?.order === 'number' &&
  VALID_GROUPS.has(m.meta?.group as string) &&
  typeof m.default === 'function'
)

export const DEMO_MAP: Record<string, ComponentType> = Object.fromEntries(
  DEMOS.map(d => [d.meta.route, d.default])
)
