// src/components/Avatar/Avatar.test.tsx

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Avatar, AvatarGroup } from './Avatar'

// ─── Avatar rendering ────────────────────────────────────────────────────────

describe('Avatar rendering', () => {
  it('renders as role="img" with aria-label equal to name', () => {
    const { getByRole } = render(<Avatar name="Alice Johnson" />)
    expect(getByRole('img', { name: 'Alice Johnson' })).toBeInTheDocument()
  })

  it('derives initials from two-word name (first + last initial)', () => {
    const { getByRole } = render(<Avatar name="Alice Johnson" />)
    expect(getByRole('img').textContent).toBe('AJ')
  })

  it('derives initials from single-word name (first two chars)', () => {
    const { getByText } = render(<Avatar name="Bjork" />)
    expect(getByText('BJ')).toBeInTheDocument()
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<Avatar name="Alice" />)
    expect(getByRole('img').getAttribute('data-size')).toBe('md')
  })

  it('data-size="xs" when size="xs"', () => {
    const { getByRole } = render(<Avatar name="Alice" size="xs" />)
    expect(getByRole('img').getAttribute('data-size')).toBe('xs')
  })

  it('data-size="sm" when size="sm"', () => {
    const { getByRole } = render(<Avatar name="Alice" size="sm" />)
    expect(getByRole('img').getAttribute('data-size')).toBe('sm')
  })

  it('renders <img> element when src provided', () => {
    const { container } = render(<Avatar name="Alice" src="photo.jpg" />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.getAttribute('src')).toBe('photo.jpg')
  })

  it('<img> has empty alt (decorative — aria-label on root carries the name)', () => {
    const { container } = render(<Avatar name="Alice" src="photo.jpg" />)
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  it('no <img> element when src absent', () => {
    const { container } = render(<Avatar name="Alice" />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('applies --_avatar-color inline style when color provided', () => {
    const { getByRole } = render(<Avatar name="Alice" color="#e8a87c" />)
    expect(getByRole('img')).toHaveStyle({ '--_avatar-color': '#e8a87c' })
  })

  it('applies --_avatar-color inline style when color absent (derived)', () => {
    const { getByRole } = render(<Avatar name="Alice" />)
    // derived — just assert the inline style property exists and is non-empty
    const style = (getByRole('img') as HTMLElement).style.getPropertyValue('--_avatar-color')
    expect(style).toBeTruthy()
  })
})

// ─── Avatar status ───────────────────────────────────────────────────────────

describe('Avatar status', () => {
  it('no status dot when status absent', () => {
    const { container } = render(<Avatar name="Alice" />)
    expect(container.querySelector('[data-status]')).toBeNull()
  })

  it('renders status dot with data-status="online"', () => {
    const { container } = render(<Avatar name="Alice" status="online" />)
    const dot = container.querySelector('[data-status]')
    expect(dot).toBeInTheDocument()
    expect(dot?.getAttribute('data-status')).toBe('online')
  })

  it('renders status dot with data-status="away"', () => {
    const { container } = render(<Avatar name="Alice" status="away" />)
    const dot = container.querySelector('[data-status]')
    expect(dot).toBeInTheDocument()
    expect(dot?.getAttribute('data-status')).toBe('away')
  })

  it('aria-label includes status when status provided', () => {
    const { getByRole } = render(<Avatar name="Alice" status="online" />)
    expect(getByRole('img', { name: 'Alice, online' })).toBeInTheDocument()
  })

  it('aria-label is just name when no status', () => {
    const { getByRole } = render(<Avatar name="Alice" />)
    expect(getByRole('img', { name: 'Alice' })).toBeInTheDocument()
  })

  it('status dot is aria-hidden', () => {
    const { container } = render(<Avatar name="Alice" status="online" />)
    expect(container.querySelector('[data-status]')?.getAttribute('aria-hidden')).toBe('true')
  })
})

// ─── AvatarGroup rendering ───────────────────────────────────────────────────

describe('AvatarGroup rendering', () => {
  const five = [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Carol' },
    { name: 'Dave' },
    { name: 'Eve' },
  ]

  it('renders role="group" with aria-label listing visible names', () => {
    const { getByRole } = render(
      <AvatarGroup avatars={[{ name: 'Alice' }, { name: 'Bob' }]} max={5} />,
    )
    const group = getByRole('group')
    expect(group.getAttribute('aria-label')).toContain('Alice')
    expect(group.getAttribute('aria-label')).toContain('Bob')
  })

  it('data-size="md" by default', () => {
    const { getByRole } = render(<AvatarGroup avatars={[{ name: 'Alice' }]} />)
    expect(getByRole('group').getAttribute('data-size')).toBe('md')
  })

  it('data-size passed to group', () => {
    const { getByRole } = render(
      <AvatarGroup avatars={[{ name: 'Alice' }]} size="sm" />,
    )
    expect(getByRole('group').getAttribute('data-size')).toBe('sm')
  })

  it('renders correct number of avatars up to max', () => {
    const { container } = render(<AvatarGroup avatars={five} max={3} />)
    expect(container.querySelectorAll('[role="img"]').length).toBe(3)
  })

  it('shows "+N" overflow badge when avatars exceed max', () => {
    const { container } = render(<AvatarGroup avatars={five} max={3} />)
    expect(container.textContent).toContain('+2')
  })

  it('no overflow badge when avatars are within max', () => {
    const { container } = render(
      <AvatarGroup avatars={five.slice(0, 3)} max={5} />,
    )
    expect(container.textContent).not.toContain('+')
  })

  it('overflow badge is aria-hidden', () => {
    const { container } = render(<AvatarGroup avatars={five} max={3} />)
    // the overflow element has no role="img" but has aria-hidden
    const badge = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find(
      el => el.textContent?.startsWith('+'),
    )
    expect(badge).toBeInTheDocument()
  })

  it('aria-label mentions overflow when present', () => {
    const { getByRole } = render(<AvatarGroup avatars={five} max={3} />)
    expect(getByRole('group').getAttribute('aria-label')).toContain('and 2 more')
  })

  it('passes size down to each avatar', () => {
    const { container } = render(
      <AvatarGroup avatars={[{ name: 'Alice' }, { name: 'Bob' }]} size="xs" />,
    )
    const avatars = container.querySelectorAll('[role="img"]')
    avatars.forEach(a => {
      expect(a.getAttribute('data-size')).toBe('xs')
    })
  })
})
