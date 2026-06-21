// src/components/NavRail/NavRail.tsx
import { useRef } from 'react'
import { Tooltip } from '../Tooltip'
import { BrandMark } from '../BrandMark'
import styles from './NavRail.module.css'

export interface NavRailItem {
  id:     string
  icon:   React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  label:  string
  badge?: number   // undefined = no badge; 0 = dot-only; n > 0 = count
}

export interface NavRailProps {
  items:        NavRailItem[]
  footerItems:  NavRailItem[]
  active:       string
  onSelect:     (id: string) => void
  collapsed?:   boolean
  'aria-label'?: string
  /** Which side tooltips open toward. 'left' when rail is on the right edge. */
  side?:        'left' | 'right'
  /** When provided, renders a mixer toggle button above footer items. */
  mixerOpen?:       boolean
  onToggleMixer?:   (open: boolean) => void
}

// ── Mixer glyph (custom inline SVG — three vertical faders) ──────────────────

function MixerFaderIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <line x1="4"  y1="3" x2="4"  y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2"  y="7"  width="4" height="3.5" rx="0.75" fill="currentColor" />
      <rect x="8"  y="4"  width="4" height="3.5" rx="0.75" fill="currentColor" />
      <rect x="14" y="11" width="4" height="3.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  return (
    <span className={styles.badge} aria-hidden="true">
      {count > 0 ? (count >= 100 ? '99+' : String(count)) : ''}
    </span>
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────────

interface NavItemProps {
  item:     NavRailItem
  isActive: boolean
  onSelect: (id: string) => void
  listRef:  React.RefObject<HTMLUListElement | null>
  side:     'left' | 'right'
}

function NavItem({ item, isActive, onSelect, listRef, side }: NavItemProps) {
  const { id, icon: Icon, label, badge } = item

  const ariaLabel =
    badge === undefined ? label
    : badge === 0       ? `${label}, notification`
    :                     `${label}, ${badge} unread`

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const list = listRef.current
    if (!list) return
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button'))
    const idx = buttons.findIndex(b => b === e.currentTarget)
    if (idx === -1) return
    const next = e.key === 'ArrowDown'
      ? buttons[(idx + 1) % buttons.length]
      : buttons[(idx - 1 + buttons.length) % buttons.length]
    next?.focus()
  }

  return (
    <li className={styles.listItem}>
      <Tooltip content={label} placement={side} delay={400}>
        <button
          type="button"
          className={styles.item}
          data-active={isActive || undefined}
          aria-label={ariaLabel}
          aria-current={isActive ? 'page' : undefined}
          onClick={() => onSelect(id)}
          onKeyDown={handleKeyDown}
        >
          <Icon size={20} aria-hidden />
          {badge !== undefined && <Badge count={badge} />}
        </button>
      </Tooltip>
    </li>
  )
}

// ── NavRail ────────────────────────────────────────────────────────────────────

export function NavRail({
  items,
  footerItems,
  active,
  onSelect,
  collapsed = false,
  'aria-label': ariaLabel = 'Primary navigation',
  side = 'left',
  mixerOpen,
  onToggleMixer,
}: NavRailProps) {
  const primaryListRef = useRef<HTMLUListElement>(null)
  const footerListRef  = useRef<HTMLUListElement>(null)

  function handleMixerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const list = footerListRef.current
    if (!list) return
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button'))
    const idx = buttons.findIndex(b => b === e.currentTarget)
    if (idx === -1) return
    const next = e.key === 'ArrowDown'
      ? buttons[(idx + 1) % buttons.length]
      : buttons[(idx - 1 + buttons.length) % buttons.length]
    next?.focus()
  }

  return (
    <nav
      className={styles.rail}
      data-collapsed={collapsed || undefined}
      aria-label={ariaLabel}
    >
      {!collapsed && (
        <div className={styles.brandWrap}>
          <BrandMark variant="mark" size={20} />
        </div>
      )}

      <ul ref={primaryListRef} className={styles.list} role="list">
        {items.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={item.id === active}
            onSelect={onSelect}
            listRef={primaryListRef}
            side={side}
          />
        ))}
      </ul>

      <div className={styles.separator} aria-hidden="true" />

      <ul ref={footerListRef} className={styles.footerList} role="list">
        {onToggleMixer !== undefined && (
          <li className={styles.listItem}>
            <Tooltip content="Mixer" placement={side} delay={400}>
              <button
                type="button"
                className={styles.item}
                data-active={mixerOpen || undefined}
                aria-pressed={mixerOpen ?? false}
                aria-label="Mixer"
                onClick={() => onToggleMixer(!mixerOpen)}
                onKeyDown={handleMixerKeyDown}
              >
                <MixerFaderIcon size={20} />
              </button>
            </Tooltip>
          </li>
        )}
        {footerItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={item.id === active}
            onSelect={onSelect}
            listRef={footerListRef}
            side={side}
          />
        ))}
      </ul>
    </nav>
  )
}
