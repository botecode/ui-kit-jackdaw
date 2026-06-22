// src/gallery/surfaceCoverage.test.ts
//
// Guards the intent of the task: every component in the gallery is explicitly
// tagged with a surface. New, untagged components still work (they default to
// all three) — this test just makes sure the central map keeps pace, so a
// reviewer sees a deliberate surface call for each component rather than a
// silent default.
import { describe, it, expect } from 'vitest'
import { DEMOS } from './registry'
import { PLANNED } from './planned'
import { SURFACE_TAGS } from './surfaces'

describe('surface coverage', () => {
  it('explicitly tags every built component', () => {
    const untagged = DEMOS.map(d => d.meta.name).filter(name => !(name in SURFACE_TAGS))
    expect(untagged).toEqual([])
  })

  it('explicitly tags every planned component', () => {
    const untagged = PLANNED.map(p => p.name).filter(name => !(name in SURFACE_TAGS))
    expect(untagged).toEqual([])
  })
})
