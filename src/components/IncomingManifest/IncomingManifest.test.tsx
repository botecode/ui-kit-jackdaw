// src/components/IncomingManifest/IncomingManifest.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IncomingManifest } from './IncomingManifest'
import type { IncomingManifestData } from './IncomingManifest'

const DATA: IncomingManifestData = {
  trackName:       'Lead Vocal',
  clipCount:       8,
  durationSeconds: 183,
  songName:        'Summer Drift',
}

describe('IncomingManifest — what', () => {
  it('renders the track name', () => {
    render(<IncomingManifest manifest={DATA} />)
    expect(screen.getByText('Lead Vocal')).toBeInTheDocument()
  })

  it('renders the clip count (pluralized)', () => {
    render(<IncomingManifest manifest={DATA} />)
    expect(screen.getByText('8 clips')).toBeInTheDocument()
  })

  it('renders a singular clip label for one clip', () => {
    render(<IncomingManifest manifest={{ ...DATA, clipCount: 1 }} />)
    expect(screen.getByText('1 clip')).toBeInTheDocument()
  })

  it('renders the duration as mm:ss', () => {
    render(<IncomingManifest manifest={DATA} />)
    expect(screen.getByText('3:03')).toBeInTheDocument()
  })

  it('zero-pads the duration seconds', () => {
    render(<IncomingManifest manifest={{ ...DATA, durationSeconds: 125 }} />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })
})

describe('IncomingManifest — where', () => {
  it('renders the target song name', () => {
    render(<IncomingManifest manifest={DATA} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('does NOT show a missing-song treatment when the song is present', () => {
    const { container } = render(<IncomingManifest manifest={DATA} />)
    expect(container.querySelector('[data-needs-import]')).toBeNull()
    expect(screen.queryByText(/not in this project/i)).not.toBeInTheDocument()
  })
})

describe('IncomingManifest — missing song (needsImport)', () => {
  const MISSING: IncomingManifestData = { ...DATA, needsImport: true }

  it('exposes data-needs-import on the where row', () => {
    const { container } = render(<IncomingManifest manifest={MISSING} />)
    expect(container.querySelector('[data-needs-import]')).toBeInTheDocument()
  })

  it('shows a calm "not in this project" hint', () => {
    render(<IncomingManifest manifest={MISSING} />)
    expect(screen.getByText(/not in this project/i)).toBeInTheDocument()
  })

  it('still names the target song', () => {
    render(<IncomingManifest manifest={MISSING} />)
    expect(screen.getByText('Summer Drift')).toBeInTheDocument()
  })

  it('does NOT use an alert role (this is calm, not an error)', () => {
    render(<IncomingManifest manifest={MISSING} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('IncomingManifest — size', () => {
  it('exposes data-size=sm', () => {
    const { container } = render(<IncomingManifest manifest={DATA} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('defaults to md', () => {
    const { container } = render(<IncomingManifest manifest={DATA} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })
})
