import { describe, it, expect } from 'vitest'
import { coverStyle, hasCover, type CoverChoice } from './covers'

describe('coverStyle — the shared cover renderer', () => {
  it('paints a color as background-color, never background-image', () => {
    const s = coverStyle({ kind: 'color', value: '#e8a87c' })
    expect(s.backgroundColor).toBe('#e8a87c')
    expect(s.backgroundImage).toBeUndefined()
  })

  it('paints a gradient as background-image VERBATIM (not wrapped in url())', () => {
    const grad = 'linear-gradient(135deg, #e8a87c, #e47a7a)'
    const s = coverStyle({ kind: 'gradient', value: grad })
    expect(s.backgroundImage).toBe(grad)
    expect(s.backgroundImage).not.toContain('url(')
    expect(s.backgroundColor).toBeUndefined()
  })

  it('paints an image url wrapped in url("…")', () => {
    const s = coverStyle({ kind: 'image', value: 'https://x/y.jpg' })
    expect(s.backgroundImage).toBe('url("https://x/y.jpg")')
  })

  it('paints a data-URL (upload) the same way as a hosted url', () => {
    const data = 'data:image/png;base64,AAAA'
    const s = coverStyle({ kind: 'image', value: data })
    expect(s.backgroundImage).toBe(`url("${data}")`)
  })

  it('returns an empty style for null/empty covers (surface uses its own empty styling)', () => {
    expect(coverStyle(null)).toEqual({})
    expect(coverStyle(undefined)).toEqual({})
    expect(coverStyle({ kind: 'color', value: '' })).toEqual({})
  })

  it('a discriminated CoverChoice narrows on kind', () => {
    const choice: CoverChoice = { kind: 'image', value: 'u', attribution: { authorName: 'Ada' } }
    if (choice.kind === 'image') {
      expect(choice.attribution?.authorName).toBe('Ada')
    }
  })
})

describe('hasCover', () => {
  it('is true only when a paintable value is present', () => {
    expect(hasCover({ kind: 'color', value: '#000' })).toBe(true)
    expect(hasCover({ kind: 'color', value: '' })).toBe(false)
    expect(hasCover(null)).toBe(false)
    expect(hasCover(undefined)).toBe(false)
  })
})
