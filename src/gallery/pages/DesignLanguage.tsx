// src/gallery/pages/DesignLanguage.tsx
import styles from './DesignLanguage.module.css'

const RULES = [
  {
    number: 1,
    title: 'No default browser inputs',
    body: 'Every control is bespoke. A <input type="range"> is never a fader. If the browser drew it, we didn\'t build it.',
    demo: (
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <input type="range" defaultValue={70} style={{ width: '80px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>❌ browser</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px', height: '80px', background: 'var(--surface-2)',
            borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            boxShadow: 'inset 0 2px 4px hsl(0 0% 0% / 0.4)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '20px', height: '8px', background: 'var(--text-muted)',
              borderRadius: '2px', boxShadow: '0 1px 0 hsl(0 0% 100% / 0.15)',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>✓ bespoke</span>
        </div>
      </div>
    ),
  },
  {
    number: 2,
    title: 'Tokens only — no hardcoded values',
    body: 'No colour, radius, duration, or font is a literal in a component stylesheet. Every value is var(--token-name). Swap a theme, every component re-skins.',
    demo: (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-green)', lineHeight: 1.6 }}>
        <div>{'background: var(--surface);    /* ✓ */'}</div>
        <div style={{ color: 'var(--text-dim)' }}>{'background: #101014;          /* ❌ */'}</div>
        <div style={{ marginTop: '8px' }}>{'border-radius: var(--radius); /* ✓ */'}</div>
        <div style={{ color: 'var(--text-dim)' }}>{'border-radius: 6px;           /* ❌ */'}</div>
      </div>
    ),
  },
  {
    number: 3,
    title: 'Hairline top-highlight',
    body: 'Every raised surface has a single soft light source above it — a 1px highlight on the top edge, slightly lighter than the surface. The tell of a crafted control.',
    demo: (
      <div style={{
        width: '120px', height: '60px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          top highlight
        </span>
      </div>
    ),
  },
  {
    number: 4,
    title: 'Recessed groove for readouts',
    body: 'Meters, dB displays, clock, BPM — all sit in an inset that reads as recessed into the surface. Depth without bevels, fake screws, or 90s-console cosplay.',
    demo: (
      <div style={{
        padding: '8px 12px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        boxShadow: 'inset 0 2px 6px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 0% / 0.3)',
        display: 'inline-block',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--accent-green)', letterSpacing: '0.05em' }}>
          –6.0 dB
        </span>
      </div>
    ),
  },
  {
    number: 5,
    title: 'Weight ≠ bounce',
    body: 'Motion settles with authority. Critically damped, zero overshoot. A bouncy spring is the tell of a toy — an instrument settles once and stops. Tune for firm, never springy.',
    demo: (
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        <div>stiffness: 200, damping: 30 → ζ ≈ 1.06</div>
        <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Just past critical — firm settle, zero overshoot.</div>
      </div>
    ),
  },
  {
    number: 6,
    title: 'The "why isn\'t this a webpage?" check',
    body: 'Before shipping any control, ask the question. If you can\'t answer it — if the control could appear in a SaaS dashboard without looking wrong — it needs more craft.',
    demo: null,
  },
  {
    number: 7,
    title: 'Every control acknowledges input',
    body: 'Hover, active, and focus states are non-negotiable. Tiny, fast, purposeful — the control is alive under your hand. A control that doesn\'t respond to touch is a static screenshot.',
    demo: (
      <div style={{ display: 'flex', gap: '12px' }}>
        {(['default', 'hover', 'active', 'focus'] as const).map(state => (
          <div key={state} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: state === 'active' ? 'var(--accent)' : 'var(--surface)',
              border: state === 'focus' ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              opacity: state === 'hover' ? 0.8 : 1,
              boxShadow: state === 'hover' ? '0 0 0 1px var(--border-strong)' : undefined,
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
              {state}
            </span>
          </div>
        ))}
      </div>
    ),
  },
]

export function DesignLanguage() {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Design Language</h1>
        <p className={styles.subtitle}>
          What makes a Jackdaw control a Jackdaw control. A first-time viewer's reaction should be
          "this is a beautiful instrument," never "nice webpage."
        </p>
      </div>

      <div className={styles.rules}>
        {RULES.map(rule => (
          <div key={rule.number} className={styles.rule}>
            <div className={styles.ruleHeader}>
              <span className={styles.ruleNumber}>{rule.number}</span>
              <h2 className={styles.ruleTitle}>{rule.title}</h2>
            </div>
            <div className={styles.ruleBody}>
              <p className={styles.ruleText}>{rule.body}</p>
              {rule.demo && (
                <div className={styles.ruleDemo}>{rule.demo}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
