import { readFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TextField } from './TextField'

// Vitest stubs CSS (css:false), so we read the authored stylesheet directly to
// assert the tone recipes (the dark --stage well vs the light paper face).
const FIELD_CSS = readFileSync('src/components/TextField/TextField.module.css', 'utf8')

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('TextField rendering', () => {
  it('renders an <input> element', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(getByRole('textbox')).toBeInTheDocument()
  })

  it('type defaults to "text"', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(getByRole('textbox')).toHaveAttribute('type', 'text')
  })

  it('type="search" applied', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" type="search" />,
    )
    expect(container.querySelector('input')).toHaveAttribute('type', 'search')
  })

  it('type="password" applied', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" type="password" />,
    )
    expect(container.querySelector('input')).toHaveAttribute('type', 'password')
  })

  it('value prop sets input value', () => {
    const { getByRole } = render(
      <TextField value="hello" onChange={vi.fn()} aria-label="test" />,
    )
    expect(getByRole('textbox')).toHaveValue('hello')
  })

  it('placeholder renders', () => {
    const { getByPlaceholderText } = render(
      <TextField value="" onChange={vi.fn()} placeholder="Search…" aria-label="test" />,
    )
    expect(getByPlaceholderText('Search…')).toBeInTheDocument()
  })

  it('aria-label applied to input when no label prop', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="Track name" />,
    )
    expect(getByRole('textbox', { name: 'Track name' })).toBeInTheDocument()
  })

  it('renders <label> element and associates it with input via htmlFor', () => {
    const { getByRole, getByText } = render(
      <TextField value="" onChange={vi.fn()} label="Track name" />,
    )
    expect(getByText('Track name').tagName).toBe('LABEL')
    expect(getByRole('textbox', { name: 'Track name' })).toBeInTheDocument()
  })

  it('aria-label NOT on input when label prop provided', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} label="Track name" aria-label="override" />,
    )
    expect(getByRole('textbox').getAttribute('aria-label')).toBeNull()
  })

  it('data-size="md" by default', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size="sm" when size="sm"', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" size="sm" />,
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('data-error present when error is truthy string', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" error="Required" />,
    )
    expect(container.firstChild).toHaveAttribute('data-error')
  })

  it('data-error present when error is boolean true', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" error={true} />,
    )
    expect(container.firstChild).toHaveAttribute('data-error')
  })

  it('data-error absent when no error', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(container.firstChild).not.toHaveAttribute('data-error')
  })

  it('aria-invalid set when error truthy', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" error="oops" />,
    )
    expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('aria-invalid absent when no error', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(getByRole('textbox')).not.toHaveAttribute('aria-invalid')
  })

  it('error string renders in a role="alert" element', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" error="Required field" />,
    )
    expect(getByRole('alert')).toHaveTextContent('Required field')
  })

  it('no alert element when error is boolean true (no message to show)', () => {
    const { queryByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" error={true} />,
    )
    expect(queryByRole('alert')).toBeNull()
  })

  it('data-disabled on root when disabled', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" disabled />,
    )
    expect(container.firstChild).toHaveAttribute('data-disabled')
  })

  it('input disabled attribute set when disabled', () => {
    const { getByRole } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" disabled />,
    )
    expect(getByRole('textbox')).toBeDisabled()
  })

  it('leading slot renders', () => {
    const { getByTestId } = render(
      <TextField
        value=""
        onChange={vi.fn()}
        aria-label="test"
        leading={<span data-testid="lead">icon</span>}
      />,
    )
    expect(getByTestId('lead')).toBeInTheDocument()
  })

  it('trailing slot renders', () => {
    const { getByTestId } = render(
      <TextField
        value=""
        onChange={vi.fn()}
        aria-label="test"
        trailing={<span data-testid="trail">icon</span>}
      />,
    )
    expect(getByTestId('trail')).toBeInTheDocument()
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('TextField interaction', () => {
  it('onChange fires with new value string on input event', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <TextField value="" onChange={onChange} aria-label="test" />,
    )
    fireEvent.change(getByRole('textbox'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('hello', expect.any(Object))
  })
})

// ─── Tone (the recessed dark well vs the calm paper face) ─────────────────────

describe('TextField tone', () => {
  it('defaults to the stage tone (the recessed hardware well)', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" />,
    )
    expect(container.querySelector('[data-tone="stage"]')).toBeInTheDocument()
  })

  it('exposes data-tone="surface" for the calm paper face', () => {
    const { container } = render(
      <TextField value="" onChange={vi.fn()} aria-label="test" tone="surface" />,
    )
    expect(container.querySelector('[data-tone="surface"]')).toBeInTheDocument()
  })

  it('paints the default field on the dark --stage well (Studio vocabulary)', () => {
    expect(FIELD_CSS).toMatch(/\.field\s*{[^}]*background:\s*var\(--stage\)/)
  })

  it('paints the surface tone on a light paper token, never the --stage well', () => {
    const surfaceRule = FIELD_CSS.match(/\[data-tone="surface"\]\s+\.field\s*{[^}]*}/)?.[0] ?? ''
    expect(surfaceRule).toMatch(/background:\s*var\(--surface/)
    expect(surfaceRule).not.toMatch(/var\(--stage\b/)
  })
})
