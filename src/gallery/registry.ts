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

// Auto-discovers all *.demo.tsx files under components/.
// Adding a demo file is all it takes for a component to appear in the gallery.
const modules = import.meta.glob('../components/**/*.demo.tsx', { eager: true })

export const DEMOS = Object.values(modules) as DemoModule[]

export const DEMO_MAP: Record<string, ComponentType> = Object.fromEntries(
  DEMOS.map(d => [d.meta.route, d.default])
)
