// src/components/Keyboard/Keyboard.test.tsx
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { Keyboard } from './Keyboard'
import { VEL_MIN, VEL_MAX, DEFAULT_VELOCITY } from './keyboardMath'

afterEach(cleanup)

// Give a key element a measurable rect so velocity-from-Y is exercised.
function stubRect(el: HTMLElement, top = 0, height = 100) {
  el.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0, top, right: 34, bottom: top + height, width: 34, height,
    x: 0, y: top, toJSON: () => {},
  } as DOMRect)
}

// A one-octave keyboard C4..C5 keeps the note math easy to assert.
const RANGE = { startNote: 60, endNote: 72 }

describe('Keyboard rendering', () => {
  it('renders the keybed', () => {
    const { getByTestId } = render(<Keyboard {...RANGE} />)
    expect(getByTestId('keyboard')).toBeInTheDocument()
  })

  it('renders 13 keys for a C4..C5 octave (8 white + 5 black)', () => {
    const { getAllByRole } = render(<Keyboard {...RANGE} />)
    expect(getAllByRole('button')).toHaveLength(13)
  })

  it('normalizes a black-key range outward to white keys', () => {
    // C#4 (61) .. A#4 (70) → C4 (60) .. B4 (71)
    const { getByRole } = render(<Keyboard startNote={61} endNote={70} />)
    expect(getByRole('button', { name: 'C4' })).toBeInTheDocument()
    expect(getByRole('button', { name: 'B4' })).toBeInTheDocument()
  })

  it('defaults to size md and honors sm', () => {
    const { getByTestId, rerender } = render(<Keyboard {...RANGE} />)
    expect(getByTestId('keyboard').closest('[data-size]')).toHaveAttribute('data-size', 'md')
    rerender(<Keyboard {...RANGE} size="sm" />)
    expect(getByTestId('keyboard').closest('[data-size]')).toHaveAttribute('data-size', 'sm')
  })

  it('labels white keys with their note name (visible + aria)', () => {
    const { getByRole } = render(<Keyboard {...RANGE} />)
    expect(getByRole('button', { name: 'C4' })).toHaveTextContent('C4')
  })
})

describe('Keyboard pointer input', () => {
  it('fires onNoteOn with a velocity from strike Y, then onNoteOff', () => {
    const onNoteOn = vi.fn()
    const onNoteOff = vi.fn()
    const { getByRole } = render(
      <Keyboard {...RANGE} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />,
    )
    const c4 = getByRole('button', { name: 'C4' })
    stubRect(c4, 0, 100)

    fireEvent.pointerDown(c4, { button: 0, clientY: 100 }) // bottom = loud
    expect(onNoteOn).toHaveBeenCalledWith(60, VEL_MAX)

    fireEvent.pointerUp(getByTestIdBed(c4))
    expect(onNoteOff).toHaveBeenCalledWith(60)
  })

  it('a strike near the top of the key is soft', () => {
    const onNoteOn = vi.fn()
    const { getByRole } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    const c4 = getByRole('button', { name: 'C4' })
    stubRect(c4, 0, 100)
    fireEvent.pointerDown(c4, { button: 0, clientY: 0 }) // top = soft
    expect(onNoteOn).toHaveBeenCalledWith(60, VEL_MIN)
  })

  it('falls back to default velocity when the key has no measurable rect', () => {
    const onNoteOn = vi.fn()
    const { getByRole } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    fireEvent.pointerDown(getByRole('button', { name: 'C4' }), { button: 0, clientY: 5 })
    expect(onNoteOn).toHaveBeenCalledWith(60, DEFAULT_VELOCITY)
  })

  it('ignores non-primary buttons', () => {
    const onNoteOn = vi.fn()
    const { getByRole } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    fireEvent.pointerDown(getByRole('button', { name: 'C4' }), { button: 2, clientY: 5 })
    expect(onNoteOn).not.toHaveBeenCalled()
  })

  it('does not double-fire onNoteOn while a key is already held', () => {
    const onNoteOn = vi.fn()
    const { getByRole } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    const c4 = getByRole('button', { name: 'C4' })
    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    expect(onNoteOn).toHaveBeenCalledTimes(1)
  })

  it('glissando: sliding to another key releases the old and presses the new', () => {
    const onNoteOn = vi.fn()
    const onNoteOff = vi.fn()
    const { getByRole } = render(
      <Keyboard {...RANGE} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />,
    )
    const c4 = getByRole('button', { name: 'C4' })
    const d4 = getByRole('button', { name: 'D4' })
    stubRect(d4, 0, 100)

    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    onNoteOn.mockClear()

    // elementFromPoint drives which key the drag is over (jsdom has no impl).
    const prev = document.elementFromPoint
    document.elementFromPoint = vi.fn().mockReturnValue(d4) as typeof document.elementFromPoint
    fireEvent.pointerMove(getByTestIdBed(c4), { clientX: 40, clientY: 50 })
    document.elementFromPoint = prev

    expect(onNoteOff).toHaveBeenCalledWith(60)  // C4 released
    expect(onNoteOn).toHaveBeenCalledWith(62, 86) // D4 pressed (mid strike → 86 vel)
  })
})

describe('Keyboard lit state', () => {
  it('host activeNotes light keys via aria-pressed', () => {
    const { getByRole } = render(
      <Keyboard {...RANGE} activeNotes={new Set([64])} />,
    )
    expect(getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'true')
    expect(getByRole('button', { name: 'C4' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('accepts activeNotes as an array', () => {
    const { getByRole } = render(<Keyboard {...RANGE} activeNotes={[67]} />)
    expect(getByRole('button', { name: 'G4' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a locally-pressed key reads as pressed', () => {
    const { getByRole } = render(<Keyboard {...RANGE} />)
    const c4 = getByRole('button', { name: 'C4' })
    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    expect(c4).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Keyboard disabled', () => {
  it('marks keys disabled and emits nothing', () => {
    const onNoteOn = vi.fn()
    const { getByRole, getByTestId } = render(
      <Keyboard {...RANGE} disabled onNoteOn={onNoteOn} />,
    )
    const c4 = getByRole('button', { name: 'C4' })
    expect(c4).toBeDisabled()
    expect(getByTestId('keyboard').closest('[data-disabled]')).toBeInTheDocument()
    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    expect(onNoteOn).not.toHaveBeenCalled()
  })
})

describe('Keyboard physical keyboard', () => {
  it('Enter on the focused key plays note-on then note-off on key-up', () => {
    const onNoteOn = vi.fn()
    const onNoteOff = vi.fn()
    const { getByTestId } = render(
      <Keyboard {...RANGE} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />,
    )
    const bed = getByTestId('keyboard')
    fireEvent.keyDown(bed, { key: 'Enter' })
    expect(onNoteOn).toHaveBeenCalledWith(60, DEFAULT_VELOCITY) // C4 = first key, focusIndex 0
    fireEvent.keyUp(bed, { key: 'Enter' })
    expect(onNoteOff).toHaveBeenCalledWith(60)
  })

  it('Space plays the focused key', () => {
    const onNoteOn = vi.fn()
    const { getByTestId } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    fireEvent.keyDown(getByTestId('keyboard'), { key: ' ' })
    expect(onNoteOn).toHaveBeenCalledWith(60, DEFAULT_VELOCITY)
  })

  it('roving focus: ArrowRight moves the tabbable key', () => {
    const { getByRole, getByTestId } = render(<Keyboard {...RANGE} />)
    expect(getByRole('button', { name: 'C4' })).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(getByTestId('keyboard'), { key: 'ArrowRight' })
    // Next chromatic key is C#4.
    expect(getByRole('button', { name: 'C#4' })).toHaveAttribute('tabindex', '0')
    expect(getByRole('button', { name: 'C4' })).toHaveAttribute('tabindex', '-1')
  })

  it('End jumps focus to the last key', () => {
    const { getByRole, getByTestId } = render(<Keyboard {...RANGE} />)
    fireEvent.keyDown(getByTestId('keyboard'), { key: 'End' })
    expect(getByRole('button', { name: 'C5' })).toHaveAttribute('tabindex', '0')
  })
})

describe('Keyboard QWERTY (opt-in)', () => {
  it('does nothing for letter keys when computerKeyboard is off', () => {
    const onNoteOn = vi.fn()
    const { getByTestId } = render(<Keyboard {...RANGE} onNoteOn={onNoteOn} />)
    fireEvent.keyDown(getByTestId('keyboard'), { key: 'a' })
    expect(onNoteOn).not.toHaveBeenCalled()
  })

  it('plays the base C for "a" when computerKeyboard is on', () => {
    const onNoteOn = vi.fn()
    const onNoteOff = vi.fn()
    const { getByTestId } = render(
      <Keyboard {...RANGE} computerKeyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />,
    )
    const bed = getByTestId('keyboard')
    fireEvent.keyDown(bed, { key: 'a' })
    expect(onNoteOn).toHaveBeenCalledWith(60, DEFAULT_VELOCITY) // base C = C4
    fireEvent.keyUp(bed, { key: 'a' })
    expect(onNoteOff).toHaveBeenCalledWith(60)
  })

  it('x shifts the typing octave up', () => {
    const onNoteOn = vi.fn()
    const { getByTestId } = render(
      <Keyboard startNote={48} endNote={84} computerKeyboard onNoteOn={onNoteOn} />,
    )
    const bed = getByTestId('keyboard')
    fireEvent.keyDown(bed, { key: 'x' }) // octave up
    fireEvent.keyDown(bed, { key: 'a' }) // base C is C3(48) → +12 = C4(60)
    expect(onNoteOn).toHaveBeenCalledWith(60, DEFAULT_VELOCITY)
  })
})

describe('Keyboard stuck-note guards', () => {
  it('releases held notes when focus leaves the keybed', () => {
    const onNoteOff = vi.fn()
    const { getByRole, getByTestId } = render(
      <Keyboard {...RANGE} onNoteOff={onNoteOff} />,
    )
    fireEvent.pointerDown(getByRole('button', { name: 'C4' }), { button: 0, clientY: 5 })
    // Blur with relatedTarget outside the keybed.
    fireEvent.blur(getByTestId('keyboard'), { relatedTarget: document.body })
    expect(onNoteOff).toHaveBeenCalledWith(60)
  })

  it('keeps a held note when roving between keys (relatedTarget inside)', () => {
    const onNoteOff = vi.fn()
    const { getByRole, getByTestId } = render(
      <Keyboard {...RANGE} onNoteOff={onNoteOff} />,
    )
    const c4 = getByRole('button', { name: 'C4' })
    const cs4 = getByRole('button', { name: 'C#4' })
    fireEvent.pointerDown(c4, { button: 0, clientY: 5 })
    fireEvent.blur(getByTestId('keyboard'), { relatedTarget: cs4 })
    expect(onNoteOff).not.toHaveBeenCalled()
  })

  it('releases held notes on unmount', () => {
    const onNoteOff = vi.fn()
    const { getByRole, unmount } = render(
      <Keyboard {...RANGE} onNoteOff={onNoteOff} />,
    )
    fireEvent.pointerDown(getByRole('button', { name: 'C4' }), { button: 0, clientY: 5 })
    unmount()
    expect(onNoteOff).toHaveBeenCalledWith(60)
  })
})

// The keybed (which owns the pointer/keyboard handlers) is the button's parent.
function getByTestIdBed(keyEl: HTMLElement): HTMLElement {
  return keyEl.closest('[data-testid="keyboard"]') as HTMLElement
}
