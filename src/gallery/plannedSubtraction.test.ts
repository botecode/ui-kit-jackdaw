// src/gallery/plannedSubtraction.test.ts
import { describe, it, expect } from 'vitest'
import { PLANNED, subtractBuilt } from './planned'

type Named = { name: string }

describe('subtractBuilt', () => {
  it('returns all items when builtNames is empty', () => {
    const items: Named[] = [{ name: 'Badge' }, { name: 'TrackLane' }]
    expect(subtractBuilt(items, new Set())).toEqual(items)
  })

  it('removes items whose name is in builtNames', () => {
    const items: Named[] = [{ name: 'Badge' }, { name: 'Toggle' }, { name: 'TrackLane' }]
    expect(subtractBuilt(items, new Set(['Toggle']))).toEqual([{ name: 'Badge' }, { name: 'TrackLane' }])
  })

  it('returns empty array when all items are built', () => {
    const items: Named[] = [{ name: 'Badge' }]
    expect(subtractBuilt(items, new Set(['Badge']))).toEqual([])
  })

  it('leaves genuinely-unbuilt entries intact', () => {
    // Badge and TrackLane have no demo file — they must survive the subtraction
    const knownBuilt = new Set(['MuteSoloToggle', 'TransportBar', 'TimelineRuler', 'Dialog', 'Tooltip', 'Toggle', 'FolderTrackHeader', 'FocusedTrackDetailPanel'])
    const result = subtractBuilt(PLANNED, knownBuilt)
    expect(result.some(p => p.name === 'Badge')).toBe(true)
    expect(result.some(p => p.name === 'TrackLane')).toBe(true)
  })

  it('removes known-built components from PLANNED', () => {
    const knownBuilt = new Set(['MuteSoloToggle', 'TransportBar', 'TimelineRuler', 'Dialog', 'Tooltip', 'Toggle', 'FolderTrackHeader', 'FocusedTrackDetailPanel'])
    const result = subtractBuilt(PLANNED, knownBuilt)
    for (const name of knownBuilt) {
      expect(result.some(p => p.name === name)).toBe(false)
    }
  })
})
