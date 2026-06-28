// src/components/DeviceChassis/DeviceChassis.tsx
//
// DeviceChassis — the warm portastudio shell that wraps the studio view: "the machine."
//
// It gives the studio its outer frame (a flat, tactile device body — character from
// insets, hairlines and the recessed stage well, never from gradients/gloss/shadow)
// plus a header bay, and provides a content slot for the body (the tape + cards).
//
// It is NOT AppShell (the old full-DAW web shell with nav sections — do not extend
// that) and NOT ProductFrame (a marketing screenshot wrapper). It is the device.
//
// Everything in the bay is a SLOT the DAW fills, so the chassis stays a frame and
// never owns DAW behaviour:
//   • brand     — the corner mark (default BrandMark wordmark)
//   • readout   — the Clock; the chassis wraps it in the stage Panel (the LCD well),
//                 so the chassis NEVER builds its own digits (Clock owns that)
//   • transport — TransportButtons / RecordMode
//   • trailing  — undo/redo + the Take chip
//   • children  — the studio body (tape + cards)
//
// Header bay layout:  [ brand · project name ]  …  [ LCD well (readout) ]  …  [ transport ] [ trailing ]
//
// Why this isn't a webpage: the shell reads as a single machined object — a warm
// surface body with a hairline top-highlight, a recessed inner tray (--bg) the body
// sits in, and a black matrix LCD well sunk into the bay. No nav chrome, no cards of
// links, no gradients. The only hot accent is whatever the slots light up (record
// armed, the active Take); the chassis itself stays quiet so the instrument speaks.
//
// Decision (headless, recorded per KIT-LEAD §6): the `dirty` unsaved-changes mark is
// a quiet --text-muted dot, NOT the warm accent — the brief reserves the single hot
// accent for record/Take, so an always-on chassis affordance must not compete.

import { Panel } from '../Panel'
import { BrandMark } from '../BrandMark'
import styles from './DeviceChassis.module.css'

export interface DeviceChassisProps {
  /** Project title shown next to the brand mark. */
  projectName?: string
  /** Unsaved changes → a quiet dot after the name (not the hot accent). */
  dirty?: boolean
  /** Corner mark. Defaults to the Jackdaw wordmark. */
  brand?: React.ReactNode
  /** The Clock-in-well; the chassis wraps it in the stage Panel (the LCD well). */
  readout?: React.ReactNode
  /** Transport slot — TransportButtons / RecordMode. */
  transport?: React.ReactNode
  /** Trailing slot — undo/redo + a Take chip. */
  trailing?: React.ReactNode
  /** The studio body (tape + cards). */
  children?: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

const BRAND_SIZE: Record<'sm' | 'md', number> = { sm: 64, md: 76 }

export function DeviceChassis({
  projectName,
  dirty = false,
  brand,
  readout,
  transport,
  trailing,
  children,
  size = 'md',
  className,
  style,
  'aria-label': ariaLabel,
}: DeviceChassisProps) {
  const brandNode = brand ?? <BrandMark variant="wordmark" size={BRAND_SIZE[size]} />

  return (
    <section
      className={className ? `${styles.root} ${className}` : styles.root}
      style={style}
      data-size={size}
      aria-label={ariaLabel ?? (projectName ? `${projectName} studio` : 'Studio')}
    >
      <header className={styles.bay}>
        {/* Left zone — brand · project name (flexes, so the well stays centred) */}
        <div className={styles.lead}>
          <span className={styles.brand}>{brandNode}</span>
          {projectName && (
            <span className={styles.project}>
              <span className={styles.projectName} title={projectName}>{projectName}</span>
              {dirty && (
                <span
                  className={styles.dirty}
                  role="status"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                />
              )}
            </span>
          )}
        </div>

        {/* Centre zone — the LCD well: the readout sunk into the dark stage Panel */}
        {readout != null && (
          <Panel tone="stage" texture padding="sm" className={styles.well}>
            {readout}
          </Panel>
        )}

        {/* Right zone — transport + trailing (mirrors the lead's flex to centre the well) */}
        <div className={styles.controls}>
          {transport != null && <div className={styles.transport}>{transport}</div>}
          {transport != null && trailing != null && <span className={styles.divider} aria-hidden />}
          {trailing != null && <div className={styles.trailing}>{trailing}</div>}
        </div>
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  )
}
