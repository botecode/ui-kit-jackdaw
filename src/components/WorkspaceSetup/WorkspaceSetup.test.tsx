// src/components/WorkspaceSetup/WorkspaceSetup.test.tsx
import { readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  WorkspaceSetup,
  OTHER_TYPE,
  DEFAULT_WORKSPACE_TYPES,
  resolveWorkspaceType,
  canSubmitSetup,
} from './WorkspaceSetup'
import type { WorkspaceSetupValue } from './WorkspaceSetup'

const CSS = readFileSync('src/components/WorkspaceSetup/WorkspaceSetup.module.css', 'utf8')

function makeValue(over: Partial<WorkspaceSetupValue> = {}): WorkspaceSetupValue {
  return { userName: '', workspaceName: '', type: 'solo', customType: '', ...over }
}

function setup(over: Partial<React.ComponentProps<typeof WorkspaceSetup>> = {}) {
  const props = {
    open: true,
    mode: 'first-run' as const,
    value: makeValue(),
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    ...over,
  }
  const utils = render(<WorkspaceSetup {...props} />)
  return { ...utils, props }
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

// ── Pure helpers ────────────────────────────────────────────────────────────────

describe('WorkspaceSetup — pure helpers', () => {
  it('resolveWorkspaceType returns the preset id for preset types', () => {
    expect(resolveWorkspaceType(makeValue({ type: 'band' }))).toBe('band')
  })

  it('resolveWorkspaceType returns the trimmed custom text for OTHER_TYPE', () => {
    expect(resolveWorkspaceType(makeValue({ type: OTHER_TYPE, customType: '  Choir ' }))).toBe('Choir')
  })

  it('resolveWorkspaceType is empty when OTHER_TYPE has no custom text', () => {
    expect(resolveWorkspaceType(makeValue({ type: OTHER_TYPE, customType: '   ' }))).toBe('')
  })

  it('canSubmitSetup(first-run) needs userName, workspaceName, and a resolved type', () => {
    expect(canSubmitSetup(makeValue({ workspaceName: 'Debut' }), 'first-run')).toBe(false) // no user
    expect(canSubmitSetup(makeValue({ userName: 'Fe', workspaceName: 'Debut' }), 'first-run')).toBe(true)
  })

  it('canSubmitSetup(new) ignores userName', () => {
    expect(canSubmitSetup(makeValue({ workspaceName: 'Debut' }), 'new')).toBe(true)
  })

  it('canSubmitSetup is false when OTHER_TYPE has no custom text', () => {
    const v = makeValue({ userName: 'Fe', workspaceName: 'Debut', type: OTHER_TYPE, customType: '' })
    expect(canSubmitSetup(v, 'first-run')).toBe(false)
  })

  it('exposes three default quick-picks', () => {
    expect(DEFAULT_WORKSPACE_TYPES.map(t => t.id)).toEqual(['solo', 'band', 'duo'])
  })
})

// ── Rendering / modes ───────────────────────────────────────────────────────────

describe('WorkspaceSetup — modes', () => {
  it('renders nothing when open=false', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders a modal dialog labelled for the mode', () => {
    setup({ mode: 'first-run' })
    expect(screen.getByRole('dialog', { name: 'Welcome to Jackdaw' })).toBeInTheDocument()
  })

  it('first-run shows the name field', () => {
    setup({ mode: 'first-run' })
    expect(screen.getByRole('textbox', { name: 'Your name' })).toBeInTheDocument()
  })

  it('new mode hides the name field but keeps the workspace name', () => {
    setup({ mode: 'new', value: makeValue({ workspaceName: 'B-sides' }) })
    expect(screen.queryByRole('textbox', { name: 'Your name' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Workspace name' })).toBeInTheDocument()
  })

  it('renders the type chooser as a radiogroup with the presets + Other', () => {
    setup()
    const group = screen.getByRole('radiogroup', { name: 'Workspace type' })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Solo' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Band' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Duo' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Other' })).toBeInTheDocument()
  })

  it('honours a custom `types` list (still appends Other)', () => {
    setup({ types: [{ id: 'choir', label: 'Choir' }] })
    expect(screen.getByRole('radio', { name: 'Choir' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Other' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Solo' })).not.toBeInTheDocument()
  })
})

// ── Change plumbing ─────────────────────────────────────────────────────────────

describe('WorkspaceSetup — onChange', () => {
  it('emits the whole value with the edited userName', () => {
    const { props } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Fernando' } })
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ userName: 'Fernando' }))
  })

  it('emits the edited workspaceName', () => {
    const { props } = setup()
    fireEvent.change(screen.getByRole('textbox', { name: 'Workspace name' }), { target: { value: 'Debut' } })
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ workspaceName: 'Debut' }))
  })

  it('emits the new type when a segment is chosen', () => {
    const { props } = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Band' }))
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'band' }))
  })

  it('emits OTHER_TYPE when Other is chosen', () => {
    const { props } = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Other' }))
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ type: OTHER_TYPE }))
  })
})

// ── Custom type field ───────────────────────────────────────────────────────────

describe('WorkspaceSetup — custom type', () => {
  it('is hidden until Other is the selected type', () => {
    setup({ value: makeValue({ type: 'solo' }) })
    expect(screen.queryByRole('textbox', { name: 'Custom workspace type' })).not.toBeInTheDocument()
  })

  it('is shown when type === OTHER_TYPE', () => {
    setup({ value: makeValue({ type: OTHER_TYPE }) })
    expect(screen.getByRole('textbox', { name: 'Custom workspace type' })).toBeInTheDocument()
  })

  it('emits the customType as the user types it', () => {
    const { props } = setup({ value: makeValue({ type: OTHER_TYPE }) })
    fireEvent.change(screen.getByRole('textbox', { name: 'Custom workspace type' }), { target: { value: 'Choir' } })
    expect(props.onChange).toHaveBeenCalledWith(expect.objectContaining({ customType: 'Choir' }))
  })
})

// ── Submit gating ───────────────────────────────────────────────────────────────

describe('WorkspaceSetup — submit', () => {
  it('disables the CTA until the required fields are filled', () => {
    setup({ value: makeValue({ userName: '', workspaceName: '' }) })
    expect(screen.getByRole('button', { name: 'Get started' })).toBeDisabled()
  })

  it('enables the CTA once first-run requirements are met', () => {
    setup({ value: makeValue({ userName: 'Fe', workspaceName: 'Debut', type: 'solo' }) })
    expect(screen.getByRole('button', { name: 'Get started' })).toBeEnabled()
  })

  it('fires onSubmit with the value when the CTA is clicked', () => {
    const value = makeValue({ userName: 'Fe', workspaceName: 'Debut', type: 'band' })
    const { props } = setup({ value })
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
    expect(props.onSubmit).toHaveBeenCalledWith(value)
  })

  it('submits on Enter inside a field (native form submit)', () => {
    const value = makeValue({ userName: 'Fe', workspaceName: 'Debut', type: 'solo' })
    const { props } = setup({ value })
    const dialog = screen.getByRole('dialog')
    // Submitting the form directly is the native Enter path.
    fireEvent.submit(dialog.querySelector('form')!)
    expect(props.onSubmit).toHaveBeenCalledWith(value)
  })

  it('does not submit when requirements are unmet', () => {
    const { props } = setup({ value: makeValue({ userName: '', workspaceName: '' }) })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('new mode labels the CTA "Create workspace" and shows Cancel', () => {
    setup({ mode: 'new', value: makeValue({ workspaceName: 'B-sides' }) })
    expect(screen.getByRole('button', { name: 'Create workspace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('first-run shows no Cancel (non-dismissible setup)', () => {
    setup({ mode: 'first-run' })
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('fires onClose when Cancel is clicked in new mode', () => {
    const { props } = setup({ mode: 'new', value: makeValue({ workspaceName: 'B' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})

// ── Error banner ────────────────────────────────────────────────────────────────

describe('WorkspaceSetup — error', () => {
  it('renders a host error as an alert', () => {
    setup({ error: 'A workspace named “Debut” already exists.' })
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i)
  })

  it('renders no alert when there is no error', () => {
    setup()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ── Themeability guarantees (authored CSS) ──────────────────────────────────────

describe('WorkspaceSetup — tokens only', () => {
  it('lights the primary CTA with the accent (KIT-LEAD §6)', () => {
    expect(CSS).toMatch(/\.btnPrimary\s*{[^}]*background:\s*var\(--accent\)/)
  })

  it('hardcodes no hex colours (tokens only)', () => {
    const hexes = CSS.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    expect(hexes).toEqual([])
  })
})
