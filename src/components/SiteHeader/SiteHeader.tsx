// src/components/SiteHeader/SiteHeader.tsx
import { useEffect, useId, useRef, useState } from 'react'
import { List, X } from '@phosphor-icons/react'
import { BrandMark } from '../BrandMark'
import styles from './SiteHeader.module.css'

// ── Contract ──────────────────────────────────────────────────────────────────
// The marketing site's top nav. Web surface (not the DAW), but built from the
// same Chroma tokens so the instrument and its storefront feel like one object.
//
// Why this isn't a webpage: a generic SaaS bar is a flat strip with an underline
// on hover and a borderless "Sign up" button. This one is milled hardware. At the
// top it floats invisibly over the hero; on scroll the warm surface drops in on
// incandescent timing (fast settle / slow fade) with a hairline keyline and a
// top-highlight, like a panel lighting up. Nav links well into a recessed pill
// under the pointer (a press, not a text underline); the current page stays lit —
// accent ink under a small glowing LED bar. The CTA is the one loud lamp: a milled
// cap with a top highlight that blooms warmer on hover and presses 1px on click.
// The header sizes to its OWN width (container query), so it collapses to a
// hamburger wherever it's dropped, not just at a global viewport breakpoint.

export interface SiteNavLink {
  /** Visible label. */
  label: string
  /** Destination. Real anchors so the nav works without JS / right-click-opens. */
  href: string
  /** Marks the current page — accent underline + aria-current="page". */
  current?: boolean
}

export interface SiteHeaderProps {
  /** Wordmark text next to the mark. */
  brand?: string
  /** Where the brand links (home). */
  brandHref?: string
  /** Center/right nav links. */
  links: SiteNavLink[]
  /** Primary call to action (right). Omit to hide. */
  cta?: { label: string; href: string }
  /**
   * Controlled scroll state. When provided, the top↔solid transition is driven
   * by the host (handy for static gallery states). Omit for internal detection.
   */
  scrolled?: boolean
  /**
   * Scroll target for internal detection. Defaults to `window` (the real site).
   * Pass a container ref when the page scrolls inside an element (the gallery).
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  /** px scrolled past the top before switching to the solid state. Default 8. */
  scrollThreshold?: number
  /** Router intent — fired on brand / nav / CTA / drawer-link click. */
  onNavigate?: (href: string, e: React.MouseEvent) => void
  /** CTA intent (also fires onNavigate with the CTA href). */
  onCtaClick?: (e: React.MouseEvent) => void
  size?: 'sm' | 'md'
  className?: string
}

// Focus-trap selector — mirrors Dialog's (the kit's settled trap recipe).
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
}

export function SiteHeader({
  brand = 'Jackdaw',
  brandHref = '/',
  links,
  cta,
  scrolled,
  scrollContainerRef,
  scrollThreshold = 8,
  onNavigate,
  onCtaClick,
  size = 'md',
  className,
}: SiteHeaderProps) {
  const isControlled = scrolled !== undefined
  const [autoScrolled, setAutoScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const menuId = useId()
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // ── Scroll detection — window by default, container when handed a ref ───────
  useEffect(() => {
    if (isControlled) return
    const target: HTMLElement | Window = scrollContainerRef?.current ?? window
    const read = () => {
      const y = target === window
        ? window.scrollY
        : (target as HTMLElement).scrollTop
      setAutoScrolled(y > scrollThreshold)
    }
    read()
    target.addEventListener('scroll', read, { passive: true })
    return () => target.removeEventListener('scroll', read)
  }, [isControlled, scrollContainerRef, scrollThreshold])

  const isScrolled = isControlled ? scrolled : autoScrolled

  // ── Drawer: Esc to close, focus trap, return focus (Dialog's recipe) ────────
  // We render the drawer inline (no portal): a site header has no overflow-
  // clipping ancestor, so position:fixed already escapes to the viewport, and
  // staying in-tree means tokens resolve without usePortalTarget plumbing and
  // the drawer can be framed inside a device mock for the gallery.
  useEffect(() => {
    if (!menuOpen) return
    // Explicit focus on open — WKWebView won't focus a clicked <button>, so we
    // can't trust document.activeElement; move focus into the drawer ourselves.
    const node = drawerRef.current
    if (node) (getFocusable(node)[0] ?? node).focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMenuOpen(false)
        return
      }
      if (e.key !== 'Tab' || !drawerRef.current) return
      const f = getFocusable(drawerRef.current)
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Return focus to the hamburger when the drawer closes.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !menuOpen) hamburgerRef.current?.focus()
    wasOpen.current = menuOpen
  }, [menuOpen])

  function handleNavigate(href: string, e: React.MouseEvent) {
    onNavigate?.(href, e)
    setMenuOpen(false)
  }

  function handleCta(e: React.MouseEvent) {
    onCtaClick?.(e)
    if (cta) onNavigate?.(cta.href, e)
    setMenuOpen(false)
  }

  return (
    <header
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-scrolled={isScrolled || undefined}
      data-size={size}
    >
      <div className={styles.inner}>
        {/* Brand (left, links home) */}
        <a
          href={brandHref}
          className={styles.brand}
          aria-label={`${brand} — home`}
          onClick={(e) => handleNavigate(brandHref, e)}
        >
          <BrandMark variant="mark" size={size === 'sm' ? 24 : 28} />
          <span className={styles.wordmark}>{brand}</span>
        </a>

        {/* Desktop nav (center/right) */}
        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.navList}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={styles.navLink}
                  data-current={link.current || undefined}
                  aria-current={link.current ? 'page' : undefined}
                  onClick={(e) => handleNavigate(link.href, e)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA (right) */}
        {cta && (
          <a
            href={cta.href}
            className={styles.cta}
            onClick={handleCta}
          >
            {cta.label}
          </a>
        )}

        {/* Hamburger (mobile only — CSS-gated) */}
        <button
          ref={hamburgerRef}
          type="button"
          className={styles.hamburger}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          <List weight="bold" size={size === 'sm' ? 18 : 20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.scrim} onClick={() => setMenuOpen(false)}>
          <div
            ref={drawerRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className={styles.drawer}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.drawerHead}>
              <span className={styles.drawerBrand}>{brand}</span>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X weight="bold" size={18} />
              </button>
            </div>
            <nav className={styles.drawerNav} aria-label="Mobile">
              <ul className={styles.drawerList}>
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={styles.drawerLink}
                      data-current={link.current || undefined}
                      aria-current={link.current ? 'page' : undefined}
                      onClick={(e) => handleNavigate(link.href, e)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            {cta && (
              <a href={cta.href} className={styles.drawerCta} onClick={handleCta}>
                {cta.label}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
