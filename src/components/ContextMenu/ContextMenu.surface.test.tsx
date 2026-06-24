import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContextMenu } from './ContextMenu'
import type { MenuEntry } from './ContextMenu'
import paper from '../../theme/paperOverlay.module.css'

const ITEMS: MenuEntry[] = [
  { id: 'a', label: 'Normal', role: 'menuitemradio', checked: true, onSelect: () => {} },
  { id: 'b', label: 'Loop / punch', role: 'menuitemradio', checked: false, onSelect: () => {} },
]

describe('ContextMenu surface', () => {
  it('defaults to the stage surface (no paper remap)', () => {
    render(<ContextMenu items={ITEMS} open x={0} y={0} onClose={() => {}} />)
    expect(screen.getByRole('menu').className).not.toContain(paper.paper)
  })

  it('applies the paper remap when surface="paper"', () => {
    render(<ContextMenu items={ITEMS} open x={0} y={0} surface="paper" onClose={() => {}} />)
    expect(screen.getByRole('menu').className).toContain(paper.paper)
  })
})
