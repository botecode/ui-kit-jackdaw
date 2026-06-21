// src/gallery/gallerySearch.test.ts
import { describe, it, expect } from 'vitest'
import { filterByName } from './gallerySearch'

type Named = { name: string }

const items: Named[] = [
  { name: 'Fader' },
  { name: 'PanKnob' },
  { name: 'ArmButton' },
  { name: 'Toggle' },
  { name: 'FocusedTrackDetailPanel' },
]

describe('filterByName', () => {
  it('returns all items when query is empty', () => {
    expect(filterByName(items, '')).toEqual(items)
  })

  it('filters case-insensitively', () => {
    expect(filterByName(items, 'fader')).toEqual([{ name: 'Fader' }])
    expect(filterByName(items, 'FADER')).toEqual([{ name: 'Fader' }])
  })

  it('matches substrings', () => {
    const result = filterByName(items, 'pank')
    expect(result).toEqual([{ name: 'PanKnob' }])
  })

  it('matches across multiple items', () => {
    const result = filterByName(items, 'o')
    // Toggle, PanKnob, FocusedTrackDetailPanel all contain 'o'
    expect(result.map(i => i.name)).toContain('Toggle')
    expect(result.map(i => i.name)).toContain('PanKnob')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterByName(items, 'zzz')).toEqual([])
  })

  it('handles whitespace-only query as empty', () => {
    expect(filterByName(items, '   ')).toEqual(items)
  })
})
