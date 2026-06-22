// src/components/CTABanner/CTABanner.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CTABanner } from './CTABanner'
import type { CTABannerProps } from './CTABanner'

const BASE: CTABannerProps = {
  headline: 'Finish the song.',
  ctaLabel: 'Download Jackdaw',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CTABanner — content', () => {
  it('renders the headline', () => {
    render(<CTABanner {...BASE} />)
    expect(screen.getByText('Finish the song.')).toBeInTheDocument()
  })

  it('renders the sub when given', () => {
    render(<CTABanner {...BASE} sub="Small on purpose, like the bird." />)
    expect(screen.getByText('Small on purpose, like the bird.')).toBeInTheDocument()
  })

  it('renders the eyebrow when given', () => {
    render(<CTABanner {...BASE} eyebrow="Early access" />)
    expect(screen.getByText('Early access')).toBeInTheDocument()
  })
})

describe('CTABanner — primary CTA', () => {
  it('renders the CTA button with its label', () => {
    render(<CTABanner {...BASE} />)
    expect(screen.getByRole('button', { name: 'Download Jackdaw' })).toBeInTheDocument()
  })

  it('calls onCta when clicked', () => {
    const onCta = vi.fn()
    render(<CTABanner {...BASE} onCta={onCta} />)
    fireEvent.click(screen.getByRole('button', { name: 'Download Jackdaw' }))
    expect(onCta).toHaveBeenCalledTimes(1)
  })
})

describe('CTABanner — email capture', () => {
  it('does not render the email form by default', () => {
    render(<CTABanner {...BASE} />)
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('renders a labeled email input when emailCapture is on', () => {
    render(<CTABanner {...BASE} emailCapture />)
    const input = screen.getByLabelText(/email/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('emits onSubmit with a trimmed, valid email', () => {
    const onSubmit = vi.fn()
    render(<CTABanner {...BASE} emailCapture onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '  writer@jackdaw.app  ' } })
    fireEvent.click(screen.getByRole('button', { name: /notify|early access|sign up|submit/i }))
    expect(onSubmit).toHaveBeenCalledWith('writer@jackdaw.app')
  })

  it('shows a validation message and does NOT emit on an invalid email', () => {
    const onSubmit = vi.fn()
    render(<CTABanner {...BASE} emailCapture onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: /notify|early access|sign up|submit/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows a validation message on an empty submit', () => {
    const onSubmit = vi.fn()
    render(<CTABanner {...BASE} emailCapture onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /notify|early access|sign up|submit/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('clears the validation message once the email becomes valid and submits', () => {
    const onSubmit = vi.fn()
    render(<CTABanner {...BASE} emailCapture onSubmit={onSubmit} />)
    const input = screen.getByLabelText(/email/i)
    fireEvent.change(input, { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: /notify|early access|sign up|submit/i }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'ok@jackdaw.app' } })
    fireEvent.click(screen.getByRole('button', { name: /notify|early access|sign up|submit/i }))
    expect(onSubmit).toHaveBeenCalledWith('ok@jackdaw.app')
  })
})

describe('CTABanner — submission status', () => {
  it('disables the submit while submitting and does not emit', () => {
    const onSubmit = vi.fn()
    render(<CTABanner {...BASE} emailCapture status="submitting" onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ok@jackdaw.app' } })
    const submit = screen.getByRole('button', { name: /notify|early access|sign up|submit|sending/i })
    expect(submit).toBeDisabled()
    fireEvent.click(submit)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows the success message and hides the input on success', () => {
    render(
      <CTABanner {...BASE} emailCapture status="success" successMessage="You're on the list." />,
    )
    expect(screen.getByText("You're on the list.")).toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  })

  it('shows the error message as an alert on error', () => {
    render(
      <CTABanner {...BASE} emailCapture status="error" errorMessage="Something went wrong." />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.')
    // the form stays so the user can retry
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})

describe('CTABanner — size', () => {
  it('defaults to md', () => {
    const { container } = render(<CTABanner {...BASE} />)
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('exposes data-size=sm', () => {
    const { container } = render(<CTABanner {...BASE} size="sm" />)
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
  })
})
