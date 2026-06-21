// src/components/ShareLink/ShareLink.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareLink } from './ShareLink'
import type { ShareLinkProps } from './ShareLink'

const LINK = 'jackdaw://share/7-tuna-zebra-piano'

const BASE: ShareLinkProps = {
  link: LINK,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ShareLink — readout', () => {
  it('renders the link text', () => {
    render(<ShareLink {...BASE} />)
    expect(screen.getByText(LINK)).toBeInTheDocument()
  })

  it('renders a copy button', () => {
    render(<ShareLink {...BASE} />)
    expect(screen.getByRole('button', { name: /copy.*link/i })).toBeInTheDocument()
  })

  it('clicking copy flips the button into a copied state', () => {
    render(<ShareLink {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /copy.*link/i }))
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument()
  })

  it('clicking copy calls onCopy with the link', () => {
    const onCopy = vi.fn()
    render(<ShareLink {...BASE} onCopy={onCopy} />)
    fireEvent.click(screen.getByRole('button', { name: /copy.*link/i }))
    expect(onCopy).toHaveBeenCalledWith(LINK)
  })
})

describe('ShareLink — QR', () => {
  it('renders a QR image by default', () => {
    render(<ShareLink {...BASE} />)
    expect(screen.getByRole('img', { name: /qr/i })).toBeInTheDocument()
  })

  it('hides the QR when showQR=false', () => {
    render(<ShareLink {...BASE} showQR={false} />)
    expect(screen.queryByRole('img', { name: /qr/i })).not.toBeInTheDocument()
  })

  it('the QR encodes the same link (non-empty path)', () => {
    const { container } = render(<ShareLink {...BASE} />)
    const path = container.querySelector('svg path')
    expect(path).toBeTruthy()
    expect((path as SVGPathElement).getAttribute('d')?.length ?? 0).toBeGreaterThan(0)
  })
})

describe('ShareLink — active LED state', () => {
  it('is not active by default', () => {
    const { container } = render(<ShareLink {...BASE} />)
    expect(container.querySelector('[data-active]')).toBeNull()
  })

  it('exposes data-active on the well when active', () => {
    const { container } = render(<ShareLink {...BASE} active />)
    expect(container.querySelector('[data-active]')).toBeInTheDocument()
  })
})

describe('ShareLink — size', () => {
  it('exposes data-size=sm', () => {
    const { container } = render(<ShareLink {...BASE} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })

  it('defaults to md', () => {
    const { container } = render(<ShareLink {...BASE} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })
})
