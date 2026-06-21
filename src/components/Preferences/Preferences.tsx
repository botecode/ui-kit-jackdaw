// src/components/Preferences/Preferences.tsx
import { useRef, useState } from 'react'
import { GearSix } from '@phosphor-icons/react'
import { ContextMenu } from '../ContextMenu'
import type { MenuEntry } from '../ContextMenu'
import { Dialog } from '../Dialog'
import styles from './Preferences.module.css'

export interface PreferencesSection {
  id: string
  label: string
  panel: React.ReactNode
}

export interface PreferencesProps {
  sections: PreferencesSection[]
}

export function Preferences({ sections }: PreferencesProps) {
  const triggerRef    = useRef<HTMLButtonElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const closeTimeRef  = useRef(0)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [menuPos,  setMenuPos]            = useState({ x: 0, y: 0 })
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const activeData = activeSection ? sections.find(s => s.id === activeSection) ?? null : null

  function openMenu() {
    // Guard: if Popover outside-click fired on the trigger just before this
    // click, closeMenu set closeTimeRef — skip the reopen.
    if (Date.now() - closeTimeRef.current < 300) return
    const el = triggerRef.current
    if (!el) return
    el.focus() // WKWebView: clicking a button does NOT focus it
    const rect = el.getBoundingClientRect()
    setMenuPos({ x: rect.left, y: rect.bottom + 2 })
    setMenuOpen(true)
  }

  function closeMenu() {
    closeTimeRef.current = Date.now()
    setMenuOpen(false)
  }

  function selectSection(id: string) {
    setActiveSection(id)
    // ContextMenu calls onClose (closeMenu) after onSelect, returning focus to trigger
  }

  function closeSection() {
    setActiveSection(null)
    // Dialog's returnFocusRef restores focus to the trigger automatically
  }

  const menuItems: MenuEntry[] = sections.map(s => ({
    id:       s.id,
    label:    s.label,
    onSelect: () => selectSection(s.id),
  }))

  return (
    <div ref={containerRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Preferences"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={openMenu}
      >
        <GearSix weight="regular" size={16} aria-hidden />
      </button>

      {menuOpen && (
        <ContextMenu
          items={menuItems}
          open={menuOpen}
          x={menuPos.x}
          y={menuPos.y}
          onClose={closeMenu}
          aria-label="Preferences sections"
        />
      )}

      <Dialog
        open={activeSection !== null}
        onClose={closeSection}
        title={activeData ? `Preferences / ${activeData.label}` : ''}
        showCloseButton
        style={{ width: 800, height: 560 }}
        bodyStyle={{ padding: 0, overflow: 'auto' }}
      >
        {activeData?.panel}
      </Dialog>
    </div>
  )
}
