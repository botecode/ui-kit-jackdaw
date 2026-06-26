import { describe, it, expect } from 'vitest'
import * as kit from '../../index'
import {
  FxPicker as FxPickerRoot,
  type FxPickerProps,
  type PluginInfo,
  type PluginKind,
  type FxFilter,
  type FxSource,
} from '../../index'
import { FxPicker as FxPickerDirect } from './FxPicker'

// Export-surface guard: the DAW consumes the kit via `@jackdaw/kit` (the package
// root, src/index.ts). If the barrel forgets FxPicker, `import { FxPicker } from
// '@jackdaw/kit'` fails at the call site — this test catches that regression and
// pins the public type names that the migrate-fxpicker-to-kit card depends on.

describe('FxPicker — package-root export surface', () => {
  it('exposes the FxPicker component from the package root', () => {
    expect(kit.FxPicker).toBeDefined()
    expect(FxPickerRoot).toBe(FxPickerDirect)
  })

  it('exposes the public prop + data types from the package root', () => {
    // Type-only: compiled by `tsc --noEmit`. A missing or renamed export here is
    // a build break, not a runtime one — referencing each name is the assertion.
    const plugin: PluginInfo = {
      id: 'p1',
      name: 'Pro-Q 3',
      company: 'FabFilter',
      kind: 'fx' satisfies PluginKind,
      category: 'EQ',
      format: 'VST3',
      favorite: false,
      available: true,
    }
    const filter: FxFilter = 'all'
    const source: FxSource = 'favorite'
    const props: FxPickerProps = {
      plugins: [plugin],
      onAdd: () => {},
      onToggleFavorite: () => {},
      onRescan: () => {},
    }
    expect(props.plugins[0].name).toBe('Pro-Q 3')
    expect(filter).toBe('all')
    expect(source).toBe('favorite')
  })
})
