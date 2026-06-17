// src/gallery/pages/Tokens.tsx
import { useState } from 'react'
import { useTheme } from '../../theme/ThemeProvider'
import { THEMES } from '../../tokens/themes'
import type { ThemeTokens } from '../../tokens/types'
import styles from './Tokens.module.css'

const COLOR_TOKENS: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: '--bg',                label: 'Page background' },
  { key: '--surface',           label: 'Elevated surface' },
  { key: '--surface-2',         label: 'Doubly elevated' },
  { key: '--rail-bg',           label: 'Rail' },
  { key: '--panel-bg',          label: 'Panel' },
  { key: '--arrange-bg',        label: 'Arrange area' },
  { key: '--strip-bg',          label: 'Recording strip' },
  { key: '--strip-mini-timeline', label: 'Strip mini-timeline' },
  { key: '--menu-bg',           label: 'Menu bar' },
  { key: '--footer-bg',         label: 'Footer bar' },
  { key: '--meter-track-bg',    label: 'Meter track' },
  { key: '--border',            label: 'Border' },
  { key: '--border-strong',     label: 'Border strong' },
  { key: '--text',              label: 'Primary text' },
  { key: '--text-muted',        label: 'Muted text' },
  { key: '--text-dim',          label: 'Dim text' },
  { key: '--accent',            label: 'Accent' },
  { key: '--accent-contrast',   label: 'On accent' },
  { key: '--accent-green',      label: 'Accent green' },
  { key: '--accent-green-dim',  label: 'Accent green dim' },
  { key: '--rail-indicator',    label: 'Rail indicator' },
]

const TEXT_SIZES: Array<{ token: string; label: string }> = [
  { token: '--text-xs',      label: 'xs — 10px — meter labels' },
  { token: '--text-sm',      label: 'sm — 11px — secondary' },
  { token: '--text-base',    label: 'base — 13px — body' },
  { token: '--text-md',      label: 'md — 15px' },
  { token: '--text-lg',      label: 'lg — 18px — headings' },
  { token: '--text-display', label: 'display — 24px — title' },
]

const SPACE_TOKENS = [
  '--space-1', '--space-2', '--space-3', '--space-4',
  '--space-5', '--space-6', '--space-8', '--space-10', '--space-12',
]

const TRACK_COLORS = [
  '--track-color-1', '--track-color-2', '--track-color-3',
  '--track-color-4', '--track-color-5', '--track-color-6',
]

const MOTION_TOKENS: Array<{ token: string; label: string }> = [
  { token: '--dur-fast',    label: 'fast — 80ms' },
  { token: '--dur-base',    label: 'base — 120ms' },
  { token: '--dur-slow',    label: 'slow — 200ms' },
]

const EASING_TOKENS: Array<{ token: string; label: string }> = [
  { token: '--ease-out',    label: 'ease-out' },
  { token: '--ease-in-out', label: 'ease-in-out' },
]

export function Tokens() {
  const { theme } = useTheme()
  const themeObj = THEMES.find(t => t.id === theme)?.tokens
  const [activeMotion, setActiveMotion] = useState<string | null>(null)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const toggle = (token: string) =>
    setActiveMotion(prev => prev === token ? null : token)

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Tokens</h1>

      {/* 1 — Colour */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Colour</h2>
        <div className={styles.swatchGrid}>
          {COLOR_TOKENS.map(({ key, label }) => (
            <div key={key} className={styles.swatch}>
              <div
                className={styles.swatchChip}
                style={{ background: `var(${key})`, borderRadius: 'var(--radius)' }}
              />
              <div className={styles.swatchInfo}>
                <span className={styles.swatchToken}>{key}</span>
                <span className={styles.swatchLabel}>{label}</span>
                <span className={styles.swatchValue}>
                  {themeObj?.[key as keyof ThemeTokens] ?? ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h3 className={styles.subTitle}>Readability</h3>
        <div className={styles.readabilityRow}>
          <div className={styles.readabilitySample} style={{ background: 'var(--bg)' }}>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --text on --bg
            </span>
          </div>
          <div className={styles.readabilitySample} style={{ background: 'var(--surface)' }}>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --text on --surface
            </span>
          </div>
          <div className={styles.readabilitySample} style={{ background: 'var(--accent)' }}>
            <span style={{ color: 'var(--accent-contrast)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --accent-contrast on --accent
            </span>
          </div>
        </div>
      </section>

      {/* 2 — Type scale */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Type scale</h2>
        {TEXT_SIZES.map(({ token, label }) => (
          <div key={token} className={styles.typeRow}>
            <span className={styles.typeLabel}>{label}</span>
            <div className={styles.typeSamples}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: `var(${token})`, fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                Cabinet Grotesk
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: `var(${token})`, fontWeight: 'var(--weight-normal)', color: 'var(--text)' }}>
                General Sans
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: `var(${token})`, fontWeight: 'var(--weight-normal)', color: 'var(--text)' }}>
                1234 –6.0 dB
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* 3 — Spacing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing</h2>
        <div className={styles.spacingScale}>
          {SPACE_TOKENS.map(token => (
            <div key={token} className={styles.spacingRow}>
              <span className={styles.spacingToken}>{token}</span>
              <div
                className={styles.spacingBar}
                style={{ width: `var(${token})` }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Radius */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Radius</h2>
        <p className={styles.meta}>
          Current: <code className={styles.code}>{themeObj?.['--radius'] ?? ''}</code>
        </p>
        <div className={styles.radiusRow}>
          {['--surface', '--surface-2', '--accent'].map(bg => (
            <div
              key={bg}
              className={styles.radiusBox}
              style={{ background: `var(${bg})`, borderRadius: 'var(--radius)' }}
            />
          ))}
        </div>
      </section>

      {/* 5 — Elevation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Elevation</h2>
        <div className={styles.elevationRow}>
          {(['--shadow-sm', '--shadow-md', '--shadow-lg'] as const).map(token => (
            <div
              key={token}
              className={styles.elevationBox}
              style={{ boxShadow: `var(${token})` }}
            >
              <span>{token}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6 — Motion */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Motion</h2>
        {reducedMotion && (
          <div className={styles.reducedBadge}>
            prefers-reduced-motion: active — decorative durations zeroed
          </div>
        )}
        <h3 className={styles.subTitle}>Durations (click to animate)</h3>
        <div className={styles.motionList}>
          {MOTION_TOKENS.map(({ token, label }) => (
            <div key={token} className={styles.motionRow}>
              <span className={styles.motionLabel}>{label}</span>
              <button
                className={styles.motionDemo}
                data-active={activeMotion === token}
                style={{ transitionDuration: `var(${token})`, transitionTimingFunction: 'var(--ease-out)' }}
                onClick={() => toggle(token)}
                aria-label={`Demo ${label}`}
              />
            </div>
          ))}
        </div>
        <h3 className={styles.subTitle}>Easings (click to animate)</h3>
        <div className={styles.motionList}>
          {EASING_TOKENS.map(({ token, label }) => (
            <div key={token} className={styles.motionRow}>
              <span className={styles.motionLabel}>{label}</span>
              <button
                className={styles.motionDemo}
                data-active={activeMotion === token}
                style={{ transitionTimingFunction: `var(${token})`, transitionDuration: 'var(--dur-slow)' }}
                onClick={() => toggle(token)}
                aria-label={`Demo ${label}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 7 — Track palette */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Track palette</h2>
        <div className={styles.trackRow}>
          {TRACK_COLORS.map(token => (
            <div
              key={token}
              className={styles.trackSwatch}
              style={{ background: `var(${token})` }}
              title={token}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
