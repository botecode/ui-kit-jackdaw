import { describe, it, expect } from 'vitest'
import * as kit from '../index'
import {
  WorkspaceCard as WorkspaceCardRoot,
  CollectionView as CollectionViewRoot,
  FlyHighButton as FlyHighButtonRoot,
  type WorkspaceCardProps,
  type WorkspaceKind,
  type CollectionViewProps,
  type CollectionTrack,
  type FlyHighButtonProps,
} from '../index'
import { WorkspaceCard as WorkspaceCardDirect } from './WorkspaceCard'
import { CollectionView as CollectionViewDirect } from './CollectionView'
import { FlyHighButton as FlyHighButtonDirect } from './FlyHighButton'

// Export-surface guard: the DAW consumes the kit via `@jackdaw/kit` (the package
// root, src/index.ts). The Home page composes WorkspaceCard + CollectionView +
// FlyHighButton — if the barrel forgets any of them, `import { WorkspaceCard }
// from '@jackdaw/kit'` fails at the call site. This test catches that regression
// and pins the public type names home-library depends on. (Mirrors the
// FxPicker.exports.test.tsx guard.)

describe('Home kit — package-root export surface', () => {
  it('exposes the Home components from the package root', () => {
    expect(kit.WorkspaceCard).toBeDefined()
    expect(kit.CollectionView).toBeDefined()
    expect(kit.FlyHighButton).toBeDefined()
    // The barrel re-export must be the same component, not a shadow.
    expect(WorkspaceCardRoot).toBe(WorkspaceCardDirect)
    expect(CollectionViewRoot).toBe(CollectionViewDirect)
    expect(FlyHighButtonRoot).toBe(FlyHighButtonDirect)
  })

  it('exposes the public prop + data types from the package root', () => {
    // Type-only: compiled by `tsc --noEmit`. A missing or renamed export here is
    // a build break, not a runtime one — referencing each name is the assertion.
    const kind: WorkspaceKind = 'collection'
    const cardProps: WorkspaceCardProps = {
      kind,
      title: 'Night Drive',
      count: 6,
      onOpen: () => {},
    }

    const track: CollectionTrack = {
      id: 't1',
      title: 'Opener',
      durationSeconds: 184,
    }
    const collectionProps: CollectionViewProps = {
      title: 'Night Drive',
      notes: '',
      onNotesChange: () => {},
      tracks: [track],
      onReorder: () => {},
      onPlayTrack: () => {},
      onOpenSong: () => {},
    }

    const flyProps: FlyHighButtonProps = {
      onStart: () => {},
    }

    expect(cardProps.kind).toBe('collection')
    expect(collectionProps.tracks[0].title).toBe('Opener')
    expect(flyProps.onStart).toBeTypeOf('function')
  })
})
