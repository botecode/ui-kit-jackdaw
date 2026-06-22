// src/gallery/surfaces.test.ts
import { describe, it, expect } from 'vitest'
import {
  SURFACES,
  SURFACE_TAGS,
  surfacesFor,
  filterBySurface,
  type Surface,
} from './surfaces'

describe('surfacesFor', () => {
  it('defaults unknown components to all three surfaces', () => {
    expect(surfacesFor('SomeBrandNewComponent')).toEqual(['web', 'app', 'daw'])
  })

  it('returns the explicit tag for a DAW-specific component', () => {
    expect(surfacesFor('Arrangement')).toEqual(['daw'])
    expect(surfacesFor('Mixer')).toEqual(['daw'])
    expect(surfacesFor('TransportBar')).toEqual(['daw'])
  })

  it('tags broadly-shared primitives with all three surfaces', () => {
    for (const name of ['Toggle', 'TextField', 'Checkbox', 'Badge']) {
      expect(surfacesFor(name)).toEqual(['web', 'app', 'daw'])
    }
  })

  it('tags marketing building blocks web-only', () => {
    for (const name of ['Hero', 'SiteHeader', 'PricingPlans', 'DemoPlayer']) {
      expect(surfacesFor(name)).toEqual(['web'])
    }
  })

  it('lets a component belong to more than one surface', () => {
    expect(surfacesFor('Fader')).toEqual(['app', 'daw'])
    expect(surfacesFor('PasswordEntry')).toEqual(['web', 'app'])
  })

  it('only ever returns valid surface values', () => {
    const valid = new Set<Surface>(['web', 'app', 'daw'])
    for (const tags of Object.values(SURFACE_TAGS)) {
      expect(tags.length).toBeGreaterThan(0)
      for (const t of tags) expect(valid.has(t)).toBe(true)
    }
  })
})

describe('SURFACES', () => {
  it('lists exactly web, app, daw in display order', () => {
    expect(SURFACES).toEqual(['web', 'app', 'daw'])
  })
})

describe('filterBySurface', () => {
  const items = [
    { name: 'Hero' }, // web
    { name: 'Fader' }, // app + daw
    { name: 'Toggle' }, // all
    { name: 'Mixer' }, // daw
  ]

  it('returns everything for the "all" sentinel', () => {
    expect(filterBySurface(items, 'all')).toEqual(items)
  })

  it('keeps only items on the chosen surface', () => {
    expect(filterBySurface(items, 'web').map(i => i.name)).toEqual(['Hero', 'Toggle'])
    expect(filterBySurface(items, 'daw').map(i => i.name)).toEqual(['Fader', 'Toggle', 'Mixer'])
    expect(filterBySurface(items, 'app').map(i => i.name)).toEqual(['Fader', 'Toggle'])
  })

  it('treats unknown names as all-surface (never hidden by a filter)', () => {
    const fresh = [{ name: 'JustBuilt' }]
    expect(filterBySurface(fresh, 'web')).toEqual(fresh)
    expect(filterBySurface(fresh, 'daw')).toEqual(fresh)
  })
})
