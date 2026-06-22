// src/components/SiteHeader/SiteHeader.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRef } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { SiteHeader } from './SiteHeader'
import type { SiteHeaderProps, SiteNavLink } from './SiteHeader'

const LINKS: SiteNavLink[] = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing', current: true },
  { label: 'Blog', href: '/blog' },
]

const BASE: SiteHeaderProps = {
  links: LINKS,
  cta: { label: 'Get Jackdaw', href: '/download' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SiteHeader — structure', () => {
  it('renders a primary nav landmark', () => {
    render(<SiteHeader {...BASE} />)
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
  })

  it('renders the brand wordmark linking home', () => {
    render(<SiteHeader {...BASE} brand="Jackdaw" brandHref="/" />)
    const brand = screen.getByRole('link', { name: /jackdaw.*home/i })
    expect(brand).toHaveAttribute('href', '/')
  })

  it('renders every nav link', () => {
    render(<SiteHeader {...BASE} />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    for (const link of LINKS) {
      expect(within(nav).getByRole('link', { name: link.label })).toHaveAttribute('href', link.href)
    }
  })

  it('marks the current page with aria-current', () => {
    render(<SiteHeader {...BASE} />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Features' })).not.toHaveAttribute('aria-current')
  })

  it('renders the CTA, or hides it when omitted', () => {
    const { rerender } = render(<SiteHeader {...BASE} />)
    expect(screen.getByRole('link', { name: 'Get Jackdaw' })).toHaveAttribute('href', '/download')
    rerender(<SiteHeader links={LINKS} />)
    expect(screen.queryByRole('link', { name: 'Get Jackdaw' })).not.toBeInTheDocument()
  })

  it('defaults to size md and honours size sm', () => {
    const { container, rerender } = render(<SiteHeader {...BASE} />)
    expect(container.querySelector('header')).toHaveAttribute('data-size', 'md')
    rerender(<SiteHeader {...BASE} size="sm" />)
    expect(container.querySelector('header')).toHaveAttribute('data-size', 'sm')
  })
})

describe('SiteHeader — scroll state', () => {
  it('is transparent (no data-scrolled) at the top', () => {
    const { container } = render(<SiteHeader {...BASE} />)
    expect(container.querySelector('header')).not.toHaveAttribute('data-scrolled')
  })

  it('honours a controlled scrolled prop', () => {
    const { container, rerender } = render(<SiteHeader {...BASE} scrolled />)
    expect(container.querySelector('header')).toHaveAttribute('data-scrolled')
    rerender(<SiteHeader {...BASE} scrolled={false} />)
    expect(container.querySelector('header')).not.toHaveAttribute('data-scrolled')
  })

  it('flips to solid when a container scrolls past the threshold', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <div ref={ref} style={{ overflow: 'auto' }}>
        <SiteHeader {...BASE} scrollContainerRef={ref} scrollThreshold={8} />
      </div>,
    )
    const header = container.querySelector('header')!
    expect(header).not.toHaveAttribute('data-scrolled')

    Object.defineProperty(ref.current!, 'scrollTop', { value: 40, configurable: true })
    fireEvent.scroll(ref.current!)
    expect(header).toHaveAttribute('data-scrolled')

    Object.defineProperty(ref.current!, 'scrollTop', { value: 2, configurable: true })
    fireEvent.scroll(ref.current!)
    expect(header).not.toHaveAttribute('data-scrolled')
  })
})

describe('SiteHeader — mobile drawer', () => {
  it('opens the drawer when the hamburger is clicked', () => {
    render(<SiteHeader {...BASE} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument()
  })

  it('reflects open state on the hamburger via aria-expanded', () => {
    render(<SiteHeader {...BASE} />)
    const burger = screen.getByRole('button', { name: /open menu/i })
    expect(burger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(burger)
    expect(burger).toHaveAttribute('aria-expanded', 'true')
  })

  it('lists the nav links and CTA inside the drawer', () => {
    render(<SiteHeader {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('link', { name: 'Features' })).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Get Jackdaw' })).toBeInTheDocument()
  })

  it('moves focus into the drawer on open', () => {
    render(<SiteHeader {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('closes on the close button and returns focus to the hamburger', () => {
    render(<SiteHeader {...BASE} />)
    const burger = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(burger)
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.activeElement).toBe(burger)
  })

  it('closes on Escape', () => {
    render(<SiteHeader {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on scrim click', () => {
    render(<SiteHeader {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    // scrim is the dialog's parent; click it directly (not the dialog).
    const scrim = screen.getByRole('dialog').parentElement!
    fireEvent.click(scrim)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('wraps focus with Tab at the end of the drawer (focus trap)', () => {
    render(<SiteHeader {...BASE} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    const cta = within(dialog).getByRole('link', { name: 'Get Jackdaw' })
    cta.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    const closeBtn = within(dialog).getByRole('button', { name: /close menu/i })
    expect(document.activeElement).toBe(closeBtn)
  })
})

describe('SiteHeader — intents', () => {
  it('fires onNavigate with the href when a link is clicked', () => {
    const onNavigate = vi.fn()
    render(<SiteHeader {...BASE} onNavigate={onNavigate} />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    fireEvent.click(within(nav).getByRole('link', { name: 'Blog' }))
    expect(onNavigate).toHaveBeenCalledWith('/blog', expect.anything())
  })

  it('fires onNavigate with the brand href on brand click', () => {
    const onNavigate = vi.fn()
    render(<SiteHeader {...BASE} brandHref="/" onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link', { name: /jackdaw.*home/i }))
    expect(onNavigate).toHaveBeenCalledWith('/', expect.anything())
  })

  it('fires onCtaClick (and onNavigate) when the CTA is clicked', () => {
    const onCtaClick = vi.fn()
    const onNavigate = vi.fn()
    render(<SiteHeader {...BASE} onCtaClick={onCtaClick} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('link', { name: 'Get Jackdaw' }))
    expect(onCtaClick).toHaveBeenCalledTimes(1)
    expect(onNavigate).toHaveBeenCalledWith('/download', expect.anything())
  })

  it('closes the drawer after a drawer link is clicked', () => {
    const onNavigate = vi.fn()
    render(<SiteHeader {...BASE} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('link', { name: 'Features' }))
    expect(onNavigate).toHaveBeenCalledWith('/features', expect.anything())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
