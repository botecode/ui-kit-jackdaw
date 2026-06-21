// src/components/Shortcuts/Shortcuts.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Shortcuts } from './Shortcuts'
import type { ShortcutAction } from './Shortcuts'

const ACTIONS: ShortcutAction[] = [
  { id: 'play',  name: 'Play',  category: 'Transport', bindings: ['Space'] },
  { id: 'stop',  name: 'Stop',  category: 'Transport', bindings: ['Escape'] },
  { id: 'cut',   name: 'Cut',   category: 'Clip',      bindings: ['⌘X', 'Ctrl+X'] },
  { id: 'copy',  name: 'Copy',  category: 'Clip',      bindings: ['⌘C', 'Ctrl+C'] },
  { id: 'undo',  name: 'Undo',  category: 'Edit',      bindings: [] },
]

const onRebind      = vi.fn()
const onCreateMacro = vi.fn()

const BASE = { actions: ACTIONS, onRebind, onCreateMacro }

beforeEach(() => vi.clearAllMocks())

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('Shortcuts — rendering', () => {
  it('renders all action names', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.getByText('Cut')).toBeInTheDocument()
    expect(screen.getByText('Undo')).toBeInTheDocument()
  })

  it('renders existing bindings as kbd elements', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('⌘C')).toBeInTheDocument()
  })

  it('shows — for actions with no bindings', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders a Rebind button for each action', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getAllByText('Rebind')).toHaveLength(ACTIONS.length)
  })

  it('renders the builder panel header', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByText('Custom action')).toBeInTheDocument()
  })

  it('renders the macro name input', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByPlaceholderText('Untitled macro…')).toBeInTheDocument()
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

describe('Shortcuts — search', () => {
  it('filters by action name', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'play' } })
    expect(screen.getByText('Play')).toBeInTheDocument()
    expect(screen.queryByText('Cut')).not.toBeInTheDocument()
  })

  it('filters by category', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'clip' } })
    expect(screen.getByText('Cut')).toBeInTheDocument()
    expect(screen.queryByText('Play')).not.toBeInTheDocument()
  })

  it('shows empty state when nothing matches', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'xyzzy' } })
    expect(screen.getByText(/No shortcuts match/)).toBeInTheDocument()
  })

  it('restores full list after clearing search', () => {
    render(<Shortcuts {...BASE} />)
    const input = screen.getByPlaceholderText('Search…')
    fireEvent.change(input, { target: { value: 'play' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByText('Cut')).toBeInTheDocument()
  })
})

// ── Rebind ────────────────────────────────────────────────────────────────────

describe('Shortcuts — rebind flow', () => {
  it('shows Cancel + Press a key hint when Rebind is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Press a key…')).toBeInTheDocument()
  })

  it('calls onRebind with action id and formatted keystroke (meta)', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByLabelText('Rebind Play'))
    fireEvent.keyDown(window, { key: 'P', metaKey: true })
    expect(onRebind).toHaveBeenCalledWith('play', '⌘P')
  })

  it('formats Ctrl modifier correctly', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByLabelText('Rebind Play'))
    fireEvent.keyDown(window, { key: 'P', ctrlKey: true })
    expect(onRebind).toHaveBeenCalledWith('play', 'Ctrl+P')
  })

  it('cancels capture on Escape without calling onRebind', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Press a key…')).not.toBeInTheDocument()
    expect(onRebind).not.toHaveBeenCalled()
  })

  it('cancels capture when Cancel button is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Press a key…')).not.toBeInTheDocument()
    expect(onRebind).not.toHaveBeenCalled()
  })

  it('exits capture after a successful key press', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getAllByText('Rebind')[0]!)
    fireEvent.keyDown(window, { key: 'P', metaKey: true })
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })
})

// ── Macro builder ─────────────────────────────────────────────────────────────

describe('Shortcuts — macro builder', () => {
  it('save button is disabled with empty form', () => {
    render(<Shortcuts {...BASE} />)
    expect(screen.getByLabelText('Save custom action')).toBeDisabled()
  })

  it('adds a step when Add step is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('+ Add step'))
    expect(screen.getByLabelText('Step 1 action')).toBeInTheDocument()
  })

  it('removes a step when its remove button is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByLabelText('Remove step 1'))
    expect(screen.queryByLabelText('Step 1 action')).not.toBeInTheDocument()
  })

  it('enters key-capture mode when Assign key is clicked', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('Assign key…'))
    expect(screen.getAllByText('Press a key…').length).toBeGreaterThan(0)
  })

  it('captures a macro key and displays it as a kbd badge', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    expect(screen.getByText('Ctrl+M')).toBeInTheDocument()
  })

  it('calls onCreateMacro with name, steps, key when form is complete', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'My Macro' } })
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    fireEvent.click(screen.getByLabelText('Save custom action'))
    expect(onCreateMacro).toHaveBeenCalledWith(
      'My Macro',
      expect.arrayContaining([expect.objectContaining({ actionId: 'play' })]),
      'Ctrl+M',
    )
  })

  it('resets the builder after successful save', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'My Macro' } })
    fireEvent.click(screen.getByText('+ Add step'))
    fireEvent.click(screen.getByText('Assign key…'))
    fireEvent.keyDown(window, { key: 'M', ctrlKey: true })
    fireEvent.click(screen.getByLabelText('Save custom action'))
    expect(screen.getByPlaceholderText('Untitled macro…')).toHaveValue('')
    expect(screen.queryByLabelText('Step 1 action')).not.toBeInTheDocument()
  })

  it('does not call onCreateMacro when form is incomplete', () => {
    render(<Shortcuts {...BASE} />)
    fireEvent.change(screen.getByPlaceholderText('Untitled macro…'), { target: { value: 'Half Done' } })
    const saveBtn = screen.getByLabelText('Save custom action')
    expect(saveBtn).toBeDisabled()
    fireEvent.click(saveBtn)
    expect(onCreateMacro).not.toHaveBeenCalled()
  })
})
