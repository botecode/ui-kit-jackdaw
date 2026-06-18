// src/components/BrandMark/BrandMark.test.tsx
import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('renders icon variant without throwing', () => {
    render(<BrandMark variant="icon" size={64} />)
  })

  it('renders full variant without throwing', () => {
    render(<BrandMark variant="full" size={128} />)
  })

  it('renders sigil variant without throwing', () => {
    render(<BrandMark variant="sigil" size={32} />)
  })

  it('renders stage (dark) variant without throwing', () => {
    render(<BrandMark variant="icon" size={64} stage />)
  })
})
