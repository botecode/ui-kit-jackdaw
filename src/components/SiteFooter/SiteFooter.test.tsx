// src/components/SiteFooter/SiteFooter.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SiteFooter } from './SiteFooter'
import type { SiteFooterProps, SiteFooterColumn, SiteSocialLink } from './SiteFooter'

const COLUMNS: SiteFooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    heading: 'Legal',
    links: [{ label: 'Privacy', href: '/privacy' }],
  },
]

const SOCIAL: SiteSocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/jackdaw', icon: 'github' },
  { label: 'YouTube', href: 'https://youtube.com/@jackdaw', icon: 'youtube' },
]

const BASE: SiteFooterProps = {
  columns: COLUMNS,
  social: SOCIAL,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SiteFooter — structure', () => {
  it('renders a contentinfo landmark', () => {
    render(<SiteFooter {...BASE} />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the brand wordmark linking home', () => {
    render(<SiteFooter {...BASE} brand="Jackdaw" brandHref="/" />)
    const brand = screen.getByRole('link', { name: /jackdaw.*home/i })
    expect(brand).toHaveAttribute('href', '/')
  })

  it('renders the tagline when provided', () => {
    render(<SiteFooter {...BASE} tagline="Make the record in your head." />)
    expect(screen.getByText('Make the record in your head.')).toBeInTheDocument()
  })

  it('renders each column as a labeled nav landmark with its links', () => {
    render(<SiteFooter {...BASE} />)
    for (const col of COLUMNS) {
      const nav = screen.getByRole('navigation', { name: col.heading })
      for (const link of col.links) {
        expect(within(nav).getByRole('link', { name: link.label })).toHaveAttribute('href', link.href)
      }
    }
  })

  it('falls back to default columns when none are supplied', () => {
    render(<SiteFooter social={SOCIAL} />)
    expect(screen.getByRole('navigation', { name: /product/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /company/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /legal/i })).toBeInTheDocument()
  })

  it('renders a copyright line, defaulting to the current year and brand', () => {
    render(<SiteFooter {...BASE} brand="Jackdaw" />)
    const year = new Date().getFullYear().toString()
    const copy = screen.getByText(new RegExp(`${year}.*Jackdaw`, 'i'))
    expect(copy).toBeInTheDocument()
  })

  it('honours an explicit copyright string', () => {
    render(<SiteFooter {...BASE} copyright="© 2026 Jackdaw Instruments Ltd." />)
    expect(screen.getByText('© 2026 Jackdaw Instruments Ltd.')).toBeInTheDocument()
  })

  it('defaults to size md and honours size sm', () => {
    const { container, rerender } = render(<SiteFooter {...BASE} />)
    expect(container.querySelector('footer')).toHaveAttribute('data-size', 'md')
    rerender(<SiteFooter {...BASE} size="sm" />)
    expect(container.querySelector('footer')).toHaveAttribute('data-size', 'sm')
  })
})

describe('SiteFooter — social', () => {
  it('renders social links with accessible names, hrefs, and safe rel', () => {
    render(<SiteFooter {...BASE} />)
    const gh = screen.getByRole('link', { name: 'GitHub' })
    expect(gh).toHaveAttribute('href', 'https://github.com/jackdaw')
    expect(gh).toHaveAttribute('target', '_blank')
    expect(gh).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('renders no social region when none are supplied', () => {
    render(<SiteFooter columns={COLUMNS} />)
    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument()
  })
})

describe('SiteFooter — theme toggle', () => {
  it('is hidden when themeMode is not provided', () => {
    render(<SiteFooter {...BASE} />)
    expect(screen.queryByRole('button', { name: /theme/i })).not.toBeInTheDocument()
  })

  it('relabels to the target theme (action-button pattern, no aria-pressed)', () => {
    const { rerender } = render(<SiteFooter {...BASE} themeMode="light" onThemeModeChange={() => {}} />)
    const toggle = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(toggle).not.toHaveAttribute('aria-pressed')
    rerender(<SiteFooter {...BASE} themeMode="dark" onThemeModeChange={() => {}} />)
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument()
  })

  it('fires onThemeModeChange with the opposite mode on click', () => {
    const onThemeModeChange = vi.fn()
    render(<SiteFooter {...BASE} themeMode="light" onThemeModeChange={onThemeModeChange} />)
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }))
    expect(onThemeModeChange).toHaveBeenCalledWith('dark')
  })
})

describe('SiteFooter — newsletter', () => {
  it('is hidden when newsletter is not provided', () => {
    render(<SiteFooter {...BASE} />)
    expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument()
  })

  it('fires onSubscribe with the typed email on submit', () => {
    const onSubscribe = vi.fn()
    render(<SiteFooter {...BASE} newsletter={{}} onSubscribe={onSubscribe} />)
    const input = screen.getByRole('textbox', { name: /email/i })
    fireEvent.change(input, { target: { value: 'fan@jackdaw.fm' } })
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }))
    expect(onSubscribe).toHaveBeenCalledWith('fan@jackdaw.fm')
  })

  it('does not fire onSubscribe for an empty email', () => {
    const onSubscribe = vi.fn()
    render(<SiteFooter {...BASE} newsletter={{}} onSubscribe={onSubscribe} />)
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }))
    expect(onSubscribe).not.toHaveBeenCalled()
  })
})

describe('SiteFooter — intents', () => {
  it('fires onNavigate with the href when a column link is clicked', () => {
    const onNavigate = vi.fn()
    render(<SiteFooter {...BASE} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link', { name: 'Blog' }))
    expect(onNavigate).toHaveBeenCalledWith('/blog', expect.anything())
  })

  it('fires onNavigate with the brand href on brand click', () => {
    const onNavigate = vi.fn()
    render(<SiteFooter {...BASE} brandHref="/" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link', { name: /jackdaw.*home/i }))
    expect(onNavigate).toHaveBeenCalledWith('/', expect.anything())
  })
})
