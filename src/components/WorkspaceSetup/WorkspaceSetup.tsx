// src/components/WorkspaceSetup/WorkspaceSetup.tsx
//
// WorkspaceSetup — the warm front door. This is the very first thing a new user
// sees (first-run) and the small ceremony of making another studio later (new).
//
// Why this isn't a webpage: a SaaS "create account" modal is a form on a card;
// this is a welcome mat milled from the same cream + ink as the rest of the
// instrument. The BrandMark greets you at the top, the copy is spoken not
// labelled ("Let's set up your studio"), the type chooser is a recessed pill
// whose chosen segment LIGHTS with the accent LED (fast attack / slow decay,
// KIT-LEAD §3) instead of a flat blue highlight, and the whole surface reskins
// through every theme on tokens alone — cream in Chroma, ink-black in Ink, with
// zero new colour. It never levitates: it's a Dialog panel on the shared scrim,
// the same warm --surface with a hairline top-highlight, not a floating web card.
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - Dialog vs. inline panel: the card says "dialog/panel". First-run is the
//   literal first screen and new-workspace is a deliberate interruption, so both
//   are MODAL — composed on the shared Dialog (one overlay language, themed
//   portal, focus trap, Esc). No bespoke overlay (KIT-LEAD §5: don't invent one).
// - first-run is NON-DISMISSIBLE (no Cancel, backdrop won't close): you can't
//   skip making your identity + first studio. new-workspace IS dismissible
//   (Cancel + backdrop): it's optional. Esc still fires onClose either way — the
//   Dialog's escape hatch — the host decides what "close" means on first-run.
// - Type chooser = SegmentedControl (the kit's radiogroup), NOT InputSelect: a
//   handful of mutually-exclusive picks reads better laid out than hidden behind
//   a dropdown on a welcome screen. An "Other" segment is ALWAYS appended and
//   reveals a custom TextField — the card's "allow a custom/other".
// - Controlled: one value object in, onChange(value) on every edit, onSubmit(value)
//   on commit. `type` is a preset id or the OTHER_TYPE sentinel; `customType`
//   carries the free text. resolveWorkspaceType() collapses the two for the host.
// - Submit is gated (disabled) until the required fields are non-empty rather
//   than erroring on blur — a first-run screen shouldn't scold. The optional
//   `error` prop is for HOST-level failures (a duplicate name), shown as a banner.
import { useId } from 'react'
import { Dialog } from '../Dialog'
import { TextField } from '../TextField'
import { SegmentedControl } from '../SegmentedControl'
import type { SegmentedControlOption } from '../SegmentedControl'
import { BrandMark } from '../BrandMark'
import styles from './WorkspaceSetup.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

/** first-run shows the name field (a brand-new user); new hides it (known user). */
export type WorkspaceSetupMode = 'first-run' | 'new'

/** A preset workspace-type quick-pick. `id` is stored; `label` is shown. */
export interface WorkspaceTypeOption {
  id: string
  label: string
}

/** The controlled form value — one object in, one object back on change. */
export interface WorkspaceSetupValue {
  /** The user's display name. Collected + shown only in first-run mode. */
  userName: string
  /** The workspace's name. */
  workspaceName: string
  /** A preset type id, or OTHER_TYPE when the custom field is in use. */
  type: string
  /** Free-text custom type — meaningful only when `type === OTHER_TYPE`. */
  customType: string
}

export interface WorkspaceSetupProps {
  open: boolean
  /** first-run reveals the name field + the fuller welcome; new hides both. */
  mode: WorkspaceSetupMode
  value: WorkspaceSetupValue
  onChange: (value: WorkspaceSetupValue) => void
  /** Commit the setup — only reachable when the required fields are filled. */
  onSubmit: (value: WorkspaceSetupValue) => void
  /** Dismiss. Backdrop/Cancel only close in `new` mode; Esc always calls this. */
  onClose: () => void
  /** Preset type quick-picks. An "Other" choice is always appended after these. */
  types?: WorkspaceTypeOption[]
  /** A host-level error (e.g. a duplicate name) shown as a banner over the actions. */
  error?: string
  size?: 'sm' | 'md'
}

// ── Constants + pure helpers (unit-tested) ──────────────────────────────────────

/** The sentinel `type` value while the custom "Other" field is in use. */
export const OTHER_TYPE = 'other'

/** The default quick-picks — a solo artist, a full band, a duo. */
export const DEFAULT_WORKSPACE_TYPES: WorkspaceTypeOption[] = [
  { id: 'solo', label: 'Solo' },
  { id: 'band', label: 'Band' },
  { id: 'duo',  label: 'Duo' },
]

/** Collapse the chooser to the single type string the host stores: the preset
 *  id, or the trimmed custom text when "Other" is chosen. */
export function resolveWorkspaceType(value: WorkspaceSetupValue): string {
  return value.type === OTHER_TYPE ? value.customType.trim() : value.type.trim()
}

/** Whether every required field is filled — first-run also needs the user name. */
export function canSubmitSetup(value: WorkspaceSetupValue, mode: WorkspaceSetupMode): boolean {
  const nameOk = value.workspaceName.trim().length > 0
  const typeOk = resolveWorkspaceType(value).length > 0
  const userOk = mode === 'first-run' ? value.userName.trim().length > 0 : true
  return nameOk && typeOk && userOk
}

// ── Bespoke type glyphs — dot-count tells the group size at a glance ─────────────
// Inline SVG (KIT-LEAD §3: bespoke audio/identity glyphs are custom SVG, not
// Phosphor). Known preset ids get a dot cluster; unknown host ids render plain.

function TypeGlyph({ id }: { id: string }) {
  const dots =
    id === 'solo' ? [[8, 8]] :
    id === 'duo'  ? [[5, 8], [11, 8]] :
    id === 'band' ? [[5, 6], [11, 6], [8, 11]] :
    null
  if (!dots) {
    // "Other" / custom — a small plus, the make-your-own mark.
    if (id === OTHER_TYPE) {
      return (
        <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    }
    return null
  }
  return (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="currentColor" />
      ))}
    </svg>
  )
}

// ── WorkspaceSetup ──────────────────────────────────────────────────────────────

export function WorkspaceSetup({
  open,
  mode,
  value,
  onChange,
  onSubmit,
  onClose,
  types = DEFAULT_WORKSPACE_TYPES,
  error,
  size = 'md',
}: WorkspaceSetupProps) {
  const formId  = useId()
  const errorId = useId()

  const isFirstRun = mode === 'first-run'
  const canSubmit  = canSubmitSetup(value, mode)
  const showCustom = value.type === OTHER_TYPE

  // Preset quick-picks + the always-present Other segment.
  const typeOptions: SegmentedControlOption[] = [
    ...types.map(t => ({
      value: t.id,
      label: t.label,
      icon: <TypeGlyph id={t.id} />,
    })),
    { value: OTHER_TYPE, label: 'Other', icon: <TypeGlyph id={OTHER_TYPE} /> },
  ]

  const heading = isFirstRun ? 'Welcome to Jackdaw' : 'New workspace'
  const subhead = isFirstRun
    ? "Let's set up your studio."
    : 'Name it and pick who it’s for.'

  function patch(next: Partial<WorkspaceSetupValue>) {
    onChange({ ...value, ...next })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(value)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // first-run can't be dismissed by the backdrop; Esc still reaches onClose.
      dismissible={!isFirstRun}
      size={size}
      aria-label={heading}
      bodyStyle={{ padding: 0 }}
    >
      <form className={styles.form} onSubmit={handleSubmit} aria-describedby={error ? errorId : undefined}>
        {/* Warm greeting — the BrandMark actually welcomes you in. */}
        <header className={styles.head} data-mode={mode}>
          <BrandMark variant={isFirstRun ? 'lockup' : 'mark'} size={isFirstRun ? 40 : 30} />
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.subhead}>{subhead}</p>
        </header>

        <div className={styles.fields}>
          {isFirstRun && (
            <TextField
              tone="surface"
              label="Your name"
              placeholder="e.g. Fernando"
              value={value.userName}
              onChange={v => patch({ userName: v })}
              size={size}
            />
          )}

          <TextField
            tone="surface"
            label="Workspace name"
            placeholder="e.g. Debut EP"
            value={value.workspaceName}
            onChange={v => patch({ workspaceName: v })}
            size={size}
          />

          <div className={styles.typeField}>
            <span className={styles.typeLabel} id={`${formId}-type`}>Workspace type</span>
            <SegmentedControl
              options={typeOptions}
              value={value.type}
              onChange={v => patch({ type: v })}
              size={size}
              aria-label="Workspace type"
            />
            {showCustom && (
              <TextField
                tone="surface"
                aria-label="Custom workspace type"
                placeholder="e.g. Choir, Trio, Podcast…"
                value={value.customType}
                onChange={v => patch({ customType: v })}
                size={size}
                autoFocus
              />
            )}
          </div>
        </div>

        {error && (
          <p className={styles.error} id={errorId} role="alert">
            {error}
          </p>
        )}

        {/* Footer actions. first-run has no Cancel — you don't opt out of setup. */}
        <div className={styles.actions} data-single={isFirstRun || undefined}>
          {!isFirstRun && (
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
          )}
          <button type="submit" className={styles.btnPrimary} disabled={!canSubmit}>
            {isFirstRun ? 'Get started' : 'Create workspace'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
