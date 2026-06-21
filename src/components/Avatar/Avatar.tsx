// src/components/Avatar/Avatar.tsx
//
// Collaborator avatar — image or initials fallback, per-user palette color,
// optional semantic status dot, and an AvatarGroup stacking primitive.
//
// Color: consumer passes `color` (any CSS value) or omits it and the hash
// of `name` selects a track-color slot — always a CSS token, never hardcoded.
//
// Status semantics follow KIT-LEAD §6:
//   online → green LED  (active/rolling family)
//   away   → amber LED  (attention/partial family)

import styles from './Avatar.module.css'

// ── Color derivation ──────────────────────────────────────────────────────────

// Tokens only — derive palette index from name, reference track-color slots.
const PALETTE = [
  'var(--track-color-1)',
  'var(--track-color-2)',
  'var(--track-color-3)',
  'var(--track-color-4)',
  'var(--track-color-5)',
  'var(--track-color-6)',
] as const

function deriveColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = Math.imul(31, h) + name.charCodeAt(i) | 0
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AvatarSize = 'xs' | 'sm' | 'md'
export type AvatarStatus = 'online' | 'away'

export interface AvatarProps {
  name: string
  src?: string
  color?: string
  size?: AvatarSize
  status?: AvatarStatus
}

export interface AvatarGroupProps {
  avatars: AvatarProps[]
  max?: number
  size?: AvatarSize
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  src,
  color,
  size = 'md',
  status,
}: AvatarProps) {
  const resolvedColor = color ?? deriveColor(name)
  const initials = deriveInitials(name)
  const ariaLabel = status ? `${name}, ${status}` : name

  return (
    <div
      className={styles.root}
      data-size={size}
      role="img"
      aria-label={ariaLabel}
      style={{ '--_avatar-color': resolvedColor } as React.CSSProperties}
    >
      {src ? (
        <img src={src} alt="" className={styles.image} />
      ) : (
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
      )}
      {status && (
        <span
          className={styles.statusDot}
          data-status={status}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// ── AvatarGroup ───────────────────────────────────────────────────────────────

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - visible.length

  const groupLabel = [
    ...visible.map(a => a.name),
    overflow > 0 ? `and ${overflow} more` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div
      className={styles.group}
      data-size={size}
      role="group"
      aria-label={groupLabel}
    >
      {visible.map((avatar, i) => (
        <div
          key={`${avatar.name}-${i}`}
          className={styles.groupItem}
          style={{ zIndex: visible.length - i }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div className={styles.groupItem} style={{ zIndex: 0 }}>
          <div
            className={styles.overflowBadge}
            data-size={size}
            aria-hidden="true"
          >
            +{overflow}
          </div>
        </div>
      )}
    </div>
  )
}
