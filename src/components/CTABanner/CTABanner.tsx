// src/components/CTABanner/CTABanner.tsx
import { useId, useState } from 'react'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import styles from './CTABanner.module.css'

// ── Why this isn't a webpage ──────────────────────────────────────────────────
// A generic closing CTA is a coloured <section> with an orange button. This one is
// the *faceplate* of the instrument: a recessed dark stage panel (--stage + scanline)
// with an LED-accent band lit across the top and a primary CTA that glows like a lit
// pedal button (accent core→deep + bloom, incandescent attack). It reads loud against
// the calm cream sections above it because it looks like hardware, not because it's a
// brighter rectangle. Tokens only → the same band reskins through every theme.
//
// Decisions (headless, resolved against KIT-LEAD.md):
// • Primary CTA = onCta callback, not href — the kit speaks in intents, and YAGNI on
//   link rendering until a card asks for it.
// • Email submit is a quieter ghost-on-stage button so two accent LEDs don't compete;
//   the primary CTA owns the single loud accent.
// • Two error layers, kept distinct: client email-format validation (blocks the emit,
//   field-level) vs. parent-driven status="error" (submission failed, band-level).
// • Bespoke stage-styled input rather than the light-surface TextField — it lives on
//   the dark faceplate and lights its focus ring like the rest of the kit.

export type CTAStatus = 'idle' | 'submitting' | 'success' | 'error'

export interface CTABannerProps {
  /** The closing headline (display type) — the page's last push. */
  headline: string
  /** Supporting line under the headline. */
  sub?: string
  /** Small mono kicker above the headline (e.g. "Early access"). */
  eyebrow?: string
  /** Primary CTA label (e.g. "Download Jackdaw" / "Try it free"). */
  ctaLabel: string
  /** Primary CTA intent. */
  onCta?: () => void
  /** Enable the email-capture form (newsletter / early access). */
  emailCapture?: boolean
  /** Accessible label for the email input. */
  emailLabel?: string
  /** Placeholder shown in the email input. */
  emailPlaceholder?: string
  /** Submit button label for the email form. */
  submitLabel?: string
  /** Submission lifecycle — UI-only; the parent drives it from onSubmit. */
  status?: CTAStatus
  /** Shown when status === 'success'. */
  successMessage?: string
  /** Shown when status === 'error'. */
  errorMessage?: string
  /** Emitted with a valid, trimmed email on submit. */
  onSubmit?: (email: string) => void
  /** Size. Default 'md'. */
  size?: 'sm' | 'md'
}

// Pragmatic client-side check: one @, a dot in the domain, no whitespace.
// The real gate is server-side; this only stops obvious typos before the emit.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function CTABanner({
  headline,
  sub,
  eyebrow,
  ctaLabel,
  onCta,
  emailCapture = false,
  emailLabel = 'Email address',
  emailPlaceholder = 'you@example.com',
  submitLabel = 'Notify me',
  status = 'idle',
  successMessage = "You're on the list.",
  errorMessage = 'Something went wrong. Please try again.',
  onSubmit,
  size = 'md',
}: CTABannerProps) {
  const [email, setEmail] = useState('')
  // Client-side validation message (invalid/empty email). Distinct from status="error".
  const [validationError, setValidationError] = useState<string | null>(null)

  const inputId = useId()
  const msgId = useId()

  const submitting = status === 'submitting'
  const succeeded = status === 'success'

  // The field-level message shown under the input: validation first, then a
  // parent-driven submission error. role="alert" so SR users hear it on submit.
  const fieldError = validationError ?? (status === 'error' ? errorMessage : null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || succeeded) return
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setValidationError('Please enter a valid email address.')
      return
    }
    setValidationError(null)
    onSubmit?.(trimmed)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (validationError) setValidationError(null)
  }

  return (
    <section className={styles.root} data-size={size} aria-label={headline}>
      {/* LED-accent band — the lit signature across the top of the faceplate. */}
      <span className={styles.ledBand} aria-hidden="true" />

      <div className={styles.inner}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.headline}>{headline}</h2>
        {sub && <p className={styles.sub}>{sub}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cta}
            onClick={onCta}
          >
            <span>{ctaLabel}</span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>

          {emailCapture && !succeeded && (
            <form className={styles.emailForm} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label htmlFor={inputId} className={styles.srOnly}>
                  {emailLabel}
                </label>
                <input
                  id={inputId}
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={handleChange}
                  placeholder={emailPlaceholder}
                  disabled={submitting}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={fieldError ? msgId : undefined}
                  data-error={fieldError ? '' : undefined}
                />
                <button
                  type="submit"
                  className={styles.submit}
                  disabled={submitting}
                  data-busy={submitting || undefined}
                >
                  {submitting ? 'Sending…' : submitLabel}
                </button>
              </div>
              {fieldError && (
                <p id={msgId} className={styles.message} data-kind="error" role="alert">
                  {fieldError}
                </p>
              )}
            </form>
          )}

          {emailCapture && succeeded && (
            <p className={styles.success} role="status">
              <CheckCircle size={18} weight="fill" aria-hidden="true" />
              <span>{successMessage}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
