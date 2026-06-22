// src/components/Faq/Faq.tsx
import { useId, useRef, useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'
import styles from './Faq.module.css'

export interface FaqItem {
  /** Stable identifier. Falls back to the array index when omitted. */
  id?: string
  /** The question — rendered in the disclosure header button. */
  question: string
  /** The answer — revealed when the item is expanded. Rich content allowed. */
  answer: React.ReactNode
  /** Dimmed and non-interactive; skipped by keyboard navigation. */
  disabled?: boolean
}

export interface FaqProps {
  /** The Q&A list. */
  items: FaqItem[]
  /**
   * Allow several panels open at once. Default: single-open — opening one
   * collapses the others (classic accordion). Multi-open lets the reader keep
   * many answers visible at a time.
   */
  allowMultiple?: boolean
  /** Item ids (or index strings) expanded on mount. */
  defaultOpen?: string[]
  /**
   * Heading level wrapping each question button, for correct document outline
   * when the FAQ drops under a section heading. Default 3.
   */
  headingLevel?: 2 | 3 | 4
  /** Copy shown when {@link items} is empty. */
  emptyLabel?: string
  size?: 'sm' | 'md'
}

export function Faq({
  items,
  allowMultiple = false,
  defaultOpen,
  headingLevel = 3,
  emptyLabel = 'No questions yet.',
  size = 'md',
}: FaqProps) {
  const uid = useId()
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(defaultOpen ?? []))

  const itemId = (item: FaqItem, index: number) => item.id ?? String(index)

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Arrow / Home / End move focus among the enabled headers (WAI-ARIA accordion).
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => !item.disabled)
    const pos = enabled.findIndex(({ i }) => i === index)
    if (pos === -1) return

    let target: number | undefined
    if (e.key === 'ArrowDown') target = enabled[(pos + 1) % enabled.length].i
    else if (e.key === 'ArrowUp') target = enabled[(pos - 1 + enabled.length) % enabled.length].i
    else if (e.key === 'Home') target = enabled[0].i
    else if (e.key === 'End') target = enabled[enabled.length - 1].i

    if (target !== undefined) {
      e.preventDefault()
      btnRefs.current[target]?.focus()
    }
  }

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'

  if (items.length === 0) {
    return (
      <div className={styles.root} data-size={size} data-empty>
        <p className={styles.empty}>{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className={styles.root} data-size={size}>
      {items.map((item, index) => {
        const id = itemId(item, index)
        const open = openIds.has(id)
        const btnId = `${uid}-trigger-${id}`
        const panelId = `${uid}-panel-${id}`
        return (
          <div key={id} className={styles.item} data-open={open || undefined} data-disabled={item.disabled || undefined}>
            <Heading className={styles.heading}>
              <button
                id={btnId}
                type="button"
                ref={el => { btnRefs.current[index] = el }}
                className={styles.trigger}
                aria-expanded={open}
                aria-controls={panelId}
                disabled={item.disabled || undefined}
                data-open={open || undefined}
                onClick={() => toggle(id)}
                onKeyDown={e => handleKeyDown(e, index)}
              >
                <span className={styles.groove} aria-hidden="true" />
                <span className={styles.question}>{item.question}</span>
                <CaretDown className={styles.chevron} size={size === 'sm' ? 12 : 14} weight="bold" aria-hidden="true" />
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={styles.panel}
              data-open={open || undefined}
            >
              {/* inert when closed: keeps the element mounted for the height transition
                  while removing collapsed content from the a11y tree and tab order. */}
              <div className={styles.panelInner} inert={!open}>
                <div className={styles.answer}>{item.answer}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
