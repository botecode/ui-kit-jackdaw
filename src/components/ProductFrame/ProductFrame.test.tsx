// src/components/ProductFrame/ProductFrame.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductFrame } from './ProductFrame'

const SHOT = '/shots/arrangement.png'

describe('ProductFrame — content', () => {
  it('renders the screenshot with its alt text', () => {
    render(<ProductFrame src={SHOT} alt="The Jackdaw arrangement view" />)
    const img = screen.getByRole('img', { name: /arrangement view/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', SHOT)
  })

  it('treats an empty alt as a decorative image (no accessible name)', () => {
    render(<ProductFrame src={SHOT} />)
    // Decorative images are excluded from the accessibility tree.
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('renders children in the screen instead of an image when no src is given', () => {
    render(
      <ProductFrame>
        <div data-testid="live-slot">live surface</div>
      </ProductFrame>,
    )
    expect(screen.getByTestId('live-slot')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('prefers the image over children when both are given', () => {
    render(
      <ProductFrame src={SHOT} alt="shot">
        <div data-testid="live-slot">live surface</div>
      </ProductFrame>,
    )
    expect(screen.getByRole('img', { name: 'shot' })).toBeInTheDocument()
    expect(screen.queryByTestId('live-slot')).toBeNull()
  })

  it('renders without crashing when empty (no src, no children)', () => {
    const { container } = render(<ProductFrame />)
    expect(container.querySelector('figure')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })
})

describe('ProductFrame — caption', () => {
  it('renders the caption as a figcaption', () => {
    render(<ProductFrame src={SHOT} alt="shot" caption="The writing surface" />)
    const fig = screen.getByRole('figure')
    expect(fig).toBeInTheDocument()
    expect(screen.getByText('The writing surface').tagName.toLowerCase()).toBe('figcaption')
  })

  it('renders no figcaption when no caption is given', () => {
    const { container } = render(<ProductFrame src={SHOT} alt="shot" />)
    expect(container.querySelector('figcaption')).toBeNull()
  })
})

describe('ProductFrame — variant', () => {
  it('defaults to the desktop variant', () => {
    const { container } = render(<ProductFrame src={SHOT} alt="shot" />)
    expect(container.querySelector('[data-variant="desktop"]')).toBeInTheDocument()
  })

  it('exposes data-variant=phone', () => {
    const { container } = render(<ProductFrame variant="phone" src={SHOT} alt="shot" />)
    expect(container.querySelector('[data-variant="phone"]')).toBeInTheDocument()
  })

  it('renders the earpiece groove only on the phone variant', () => {
    const { container: phone } = render(<ProductFrame variant="phone" src={SHOT} alt="shot" />)
    const { container: desk } = render(<ProductFrame variant="desktop" src={SHOT} alt="shot" />)
    // The earpiece is the only aria-hidden span besides the sheen; assert one extra
    // decorative element appears on phone (earpiece + sheen) vs desktop (sheen).
    expect(phone.querySelectorAll('span[aria-hidden="true"]').length).toBe(2)
    expect(desk.querySelectorAll('span[aria-hidden="true"]').length).toBe(1)
  })
})

describe('ProductFrame — sheen', () => {
  it('renders the glass sheen by default', () => {
    const { container } = render(<ProductFrame src={SHOT} alt="shot" />)
    expect(container.querySelector('span[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('omits the sheen when sheen=false', () => {
    const { container } = render(<ProductFrame variant="desktop" src={SHOT} alt="shot" sheen={false} />)
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull()
  })
})

describe('ProductFrame — hover lift', () => {
  it('is not liftable by default', () => {
    const { container } = render(<ProductFrame src={SHOT} alt="shot" />)
    expect(container.querySelector('[data-hover-lift]')).toBeNull()
  })

  it('exposes data-hover-lift when enabled', () => {
    const { container } = render(<ProductFrame src={SHOT} alt="shot" hoverLift />)
    expect(container.querySelector('[data-hover-lift]')).toBeInTheDocument()
  })
})
