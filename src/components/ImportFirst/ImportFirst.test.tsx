// src/components/ImportFirst/ImportFirst.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportFirst } from './ImportFirst'
import type { ImportFirstProps } from './ImportFirst'

const BASE: ImportFirstProps = {
  songName: 'Summer Drift',
  onImport: vi.fn(),
  onCancel: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ImportFirst — copy', () => {
  it('names the missing song', () => {
    render(<ImportFirst {...BASE} />)
    expect(screen.getByText(/you don't have summer drift/i)).toBeInTheDocument()
  })

  it('uses the default item label "this take"', () => {
    render(<ImportFirst {...BASE} />)
    expect(screen.getByText(/add this take/i)).toBeInTheDocument()
  })

  it('uses a custom item label when provided', () => {
    render(<ImportFirst {...BASE} itemLabel="this vocal" />)
    expect(screen.getByText(/add this vocal/i)).toBeInTheDocument()
  })

  it('is calm — does not use an alert role', () => {
    render(<ImportFirst {...BASE} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ImportFirst — actions', () => {
  it('renders an Import button', () => {
    render(<ImportFirst {...BASE} />)
    expect(screen.getByRole('button', { name: /^import/i })).toBeInTheDocument()
  })

  it('clicking Import calls onImport', () => {
    const onImport = vi.fn()
    render(<ImportFirst {...BASE} onImport={onImport} />)
    fireEvent.click(screen.getByRole('button', { name: /^import/i }))
    expect(onImport).toHaveBeenCalledTimes(1)
  })

  it('renders a Cancel button', () => {
    render(<ImportFirst {...BASE} />)
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('clicking Cancel calls onCancel', () => {
    const onCancel = vi.fn()
    render(<ImportFirst {...BASE} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('ImportFirst — busy (importing)', () => {
  it('shows an importing label while busy', () => {
    render(<ImportFirst {...BASE} busy />)
    expect(screen.getByText(/importing/i)).toBeInTheDocument()
  })

  it('disables the Import button while busy', () => {
    render(<ImportFirst {...BASE} busy />)
    expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled()
  })

  it('does not call onImport when busy', () => {
    const onImport = vi.fn()
    render(<ImportFirst {...BASE} onImport={onImport} busy />)
    fireEvent.click(screen.getByRole('button', { name: /importing/i }))
    expect(onImport).not.toHaveBeenCalled()
  })
})
