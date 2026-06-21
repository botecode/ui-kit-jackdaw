// src/components/Toast/Toast.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from './Toast'

// ── Test fixtures ─────────────────────────────────────────────────────────────

function PushButtons() {
  const { push, dismiss } = useToast()
  return (
    <>
      <button onClick={() => push({ variant: 'info',    message: 'Info toast',    duration: 0 })}>Push Info</button>
      <button onClick={() => push({ variant: 'success', message: 'Success toast', duration: 0 })}>Push Success</button>
      <button onClick={() => push({ variant: 'error',   message: 'Error toast',   duration: 0 })}>Push Error</button>
      <button onClick={() => push({
        variant: 'info',
        message: 'Action toast',
        duration: 0,
        action: { label: 'Undo', onClick: vi.fn() },
      })}>Push With Action</button>
      <button onClick={() => {
        const id = push({ variant: 'info', message: 'Timed', duration: 0 })
        // expose id via data attribute for assertion
        document.body.setAttribute('data-last-id', id)
      }}>Push Capture Id</button>
      <button onClick={() => {
        const id = document.body.getAttribute('data-last-id') ?? ''
        dismiss(id)
      }}>Dismiss Last</button>
    </>
  )
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <PushButtons />
    </ToastProvider>,
  )
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('ToastProvider', () => {
  it('renders children', () => {
    renderWithProvider()
    expect(screen.getByText('Push Info')).toBeInTheDocument()
  })

  it('push adds an info toast with role="status"', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Info toast')
  })

  it('push adds a success toast with role="status"', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Success'))
    expect(screen.getByRole('status')).toHaveTextContent('Success toast')
  })

  it('push adds an error toast with role="alert"', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Error'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Error toast')
  })

  it('push returns a string id', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Capture Id'))
    const id = document.body.getAttribute('data-last-id')
    expect(typeof id).toBe('string')
    expect(id).toMatch(/^toast-\d+$/)
  })

  it('data-variant attribute matches the variant', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Error'))
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'error')
  })

  it('renders multiple toasts when pushed', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    fireEvent.click(screen.getByText('Push Success'))
    expect(screen.getAllByRole('status')).toHaveLength(2)
  })

  it('renders action button when action is provided', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push With Action'))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('always renders a dismiss button', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('message text is rendered', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    expect(screen.getByText('Info toast')).toBeInTheDocument()
  })
})

// ── Dismiss (reduced motion — immediate removal) ───────────────────────────────

describe('dismiss (reduced motion)', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('close button removes the toast immediately under reduced motion', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('dismiss(id) removes the toast immediately under reduced motion', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Capture Id'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Dismiss Last'))
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── Dismiss (animated path — sets data-leaving, then removes after timer) ────

describe('dismiss (animated)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('sets data-leaving on the toast before removing it', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    const toast = screen.getByRole('status')

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    // Still in DOM with data-leaving
    expect(toast).toBeInTheDocument()
    expect(toast).toHaveAttribute('data-leaving')
  })

  it('removes toast from DOM after LEAVE_DURATION', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info'))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── Action ────────────────────────────────────────────────────────────────────

describe('action button', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('calls action.onClick when action button is clicked', () => {
    const onAction = vi.fn()
    function PushWithSpy() {
      const { push } = useToast()
      return (
        <button onClick={() => push({ variant: 'info', message: 'Test', duration: 0, action: { label: 'Undo', onClick: onAction } })}>
          Push
        </button>
      )
    }
    render(<ToastProvider><PushWithSpy /></ToastProvider>)
    fireEvent.click(screen.getByText('Push'))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('dismisses the toast when action button is clicked', () => {
    const onAction = vi.fn()
    function PushWithSpy() {
      const { push } = useToast()
      return (
        <button onClick={() => push({ variant: 'info', message: 'Test', duration: 0, action: { label: 'Undo', onClick: onAction } })}>
          Push
        </button>
      )
    }
    render(<ToastProvider><PushWithSpy /></ToastProvider>)
    fireEvent.click(screen.getByText('Push'))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── Auto-dismiss ──────────────────────────────────────────────────────────────

describe('auto-dismiss', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    vi.useFakeTimers()
    window.matchMedia = (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    window.matchMedia = originalMatchMedia
  })

  it('duration=0 keeps toast in DOM after default duration', () => {
    renderWithProvider()
    fireEvent.click(screen.getByText('Push Info')) // duration: 0 (persistent)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('toast auto-dismisses after its duration', () => {
    function PushTimed() {
      const { push } = useToast()
      return <button onClick={() => push({ variant: 'info', message: 'Timed', duration: 100 })}>Push Timed</button>
    }
    render(<ToastProvider><PushTimed /></ToastProvider>)
    fireEvent.click(screen.getByText('Push Timed'))
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(100) }) // timer fires → dismiss called
    act(() => { vi.advanceTimersByTime(200) }) // LEAVE_DURATION elapses
    expect(screen.queryByRole('status')).toBeNull()
  })
})

// ── useToast outside provider ─────────────────────────────────────────────────

describe('useToast', () => {
  it('throws when used outside ToastProvider', () => {
    function Bad() {
      useToast()
      return null
    }
    // Suppress the error boundary noise in output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bad />)).toThrow('useToast must be used inside <ToastProvider>')
    spy.mockRestore()
  })
})
