// src/components/SiteFooter/SiteFooter.tsx
import { useId, useState } from 'react'
import { Sun, Moon, ArrowRight } from '@phosphor-icons/react'
import { BrandMark } from '../BrandMark'
import { SocialIcon } from './socialIcons'
import type { SocialIconName } from './socialIcons'
import styles from './SiteFooter.module.css'

// ── Contract ──────────────────────────────────────────────────────────────────
// The marketing site's footer. Web surface (not the DAW), but milled from the
// same Chroma tokens so the storefront and the instrument feel like one object.
//
// Why this isn't a webpage: a generic SaaS footer is a flat grey slab of
// underlined link lists. This one is the quiet base of the panel. A single
// hairline + top-highlight lifts it off the page like the seam of a milled lid;
// the surface sits on the dedicated `--footer-bg` (a calmer plate than the page).
// Column links rest muted and recessed, then well into a soft pressed pill under
// the pointer — a press, not a web underline. Social marks are recessed wells
// that light to accent ink on hover. The optional theme switch is a milled cap
// that relabels to the mode it will move to (no contradictory pressed state), and
// the newsletter slot is a recessed input feeding one lit "subscribe" cap. It
// sizes to its OWN width (container query), so the columns stack wherever it's
// dropped — narrow column, gallery frame, or real page — not at a global
// viewport breakpoint.

export interface SiteFooterLink {
  /** Visible label. */
  label: string
  /** Destination. Real anchors so links work without JS / right-click-opens. */
  href: string
}

export interface SiteFooterColumn {
  /** Column title (Product / Company / Legal …). Labels the column's nav. */
  heading: string
  links: SiteFooterLink[]
}

export interface SiteSocialLink {
  /** Accessible name for the icon-only link (e.g. "GitHub"). */
  label: string
  href: string
  /** Which bespoke glyph to render. */
  icon: SocialIconName
}

export interface SiteFooterProps {
  /** Wordmark text next to the mark. */
  brand?: string
  /** Where the brand links (home). */
  brandHref?: string
  /** One-line tagline under the brand. */
  tagline?: string
  /** Link columns. Omit to use the default Product / Company / Legal set. */
  columns?: SiteFooterColumn[]
  /** Social icon links. Omit to hide the social row. */
  social?: SiteSocialLink[]
  /** Copyright line. Omit for the default "© {year} {brand}. All rights reserved." */
  copyright?: string
  /**
   * Controlled light/dark theme mode. Provide (with onThemeModeChange) to show
   * the theme switch; omit to hide it. The site owns the actual theme — this is
   * just the surfaced control.
   */
  themeMode?: 'light' | 'dark'
  /** Theme-switch intent — fired with the mode the user is moving TO. */
  onThemeModeChange?: (next: 'light' | 'dark') => void
  /** Newsletter slot copy. Provide (even empty `{}`) to show the slot; omit to hide. */
  newsletter?: { heading?: string; blurb?: string; placeholder?: string; cta?: string }
  /** Newsletter intent — fired with the trimmed email on submit. */
  onSubscribe?: (email: string) => void
  /** Router intent — fired on brand / column-link click. */
  onNavigate?: (href: string, e: React.MouseEvent) => void
  size?: 'sm' | 'md'
  className?: string
}

// Placeholder columns — the real site overrides via `columns`, but a footer
// dropped in bare still reads as the finished article (per the card).
const DEFAULT_COLUMNS: SiteFooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Sounds', href: '/sounds' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Download', href: '/download' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Licenses', href: '/licenses' },
    ],
  },
]

export function SiteFooter({
  brand = 'Jackdaw',
  brandHref = '/',
  tagline,
  columns = DEFAULT_COLUMNS,
  social,
  copyright,
  themeMode,
  onThemeModeChange,
  newsletter,
  onSubscribe,
  onNavigate,
  size = 'md',
  className,
}: SiteFooterProps) {
  const [email, setEmail] = useState('')
  const emailId = useId()

  const year = new Date().getFullYear()
  const copyrightText = copyright ?? `© ${year} ${brand}. All rights reserved.`

  // Relabel pattern (KIT-LEAD §5): the switch says what the click DOES — it moves
  // to the OTHER mode — so there is no aria-pressed and no "dark, pressed" trap.
  const nextMode = themeMode === 'dark' ? 'light' : 'dark'

  function handleNavigate(href: string, e: React.MouseEvent) {
    onNavigate?.(href, e)
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    onSubscribe?.(trimmed)
    setEmail('')
  }

  const iconSize = size === 'sm' ? 24 : 28

  return (
    <footer
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
    >
      <div className={styles.inner}>
        {/* Brand zone — mark + wordmark + tagline, optional newsletter beneath. */}
        <div className={styles.brandZone}>
          <a
            href={brandHref}
            className={styles.brand}
            aria-label={`${brand} — home`}
            onClick={(e) => handleNavigate(brandHref, e)}
          >
            <BrandMark variant="mark" size={iconSize} />
            <span className={styles.wordmark}>{brand}</span>
          </a>

          {tagline && <p className={styles.tagline}>{tagline}</p>}

          {newsletter && (
            <form className={styles.newsletter} onSubmit={handleSubscribe}>
              {newsletter.heading && (
                <span className={styles.newsletterHeading}>{newsletter.heading}</span>
              )}
              {newsletter.blurb && (
                <span className={styles.newsletterBlurb}>{newsletter.blurb}</span>
              )}
              <div className={styles.newsletterRow}>
                <label className={styles.srOnly} htmlFor={emailId}>
                  Email address
                </label>
                <input
                  id={emailId}
                  type="email"
                  className={styles.newsletterInput}
                  placeholder={newsletter.placeholder ?? 'you@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <button type="submit" className={styles.newsletterCta}>
                  <span>{newsletter.cta ?? 'Subscribe'}</span>
                  <ArrowRight weight="bold" size={size === 'sm' ? 14 : 16} />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Link columns. */}
        <div className={styles.columns}>
          {columns.map((col) => (
            <nav key={col.heading} className={styles.column} aria-label={col.heading}>
              <h2 className={styles.columnHeading}>{col.heading}</h2>
              <ul className={styles.columnList}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={styles.columnLink}
                      onClick={(e) => handleNavigate(link.href, e)}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Base bar — copyright, social, theme switch — split by a hairline. */}
      <div className={styles.baseline}>
        <p className={styles.copyright}>{copyrightText}</p>

        <div className={styles.baselineEnd}>
          {social && social.length > 0 && (
            <ul className={styles.social} aria-label="Social">
              {social.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    className={styles.socialLink}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon name={s.icon} size={size === 'sm' ? 16 : 18} />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {themeMode && (
            <button
              type="button"
              className={styles.themeToggle}
              aria-label={`Switch to ${nextMode} theme`}
              onClick={() => onThemeModeChange?.(nextMode)}
            >
              {/* Icon shows the target mode (the lamp you're turning toward).
                  One weight across the component (bold) per the kit's no-mixed-
                  weights rule. */}
              {nextMode === 'dark' ? (
                <Moon weight="bold" size={size === 'sm' ? 14 : 16} />
              ) : (
                <Sun weight="bold" size={size === 'sm' ? 14 : 16} />
              )}
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
