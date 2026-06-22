// src/components/CTABanner/CTABanner.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { SegmentedControl } from '../SegmentedControl'
import { CTABanner } from './CTABanner'
import type { CTAStatus } from './CTABanner'

export const meta: DemoMeta = {
  name: 'CTABanner',
  group: 'Composites',
  route: '/cta-banner',
  order: 54,
}

const NOOP = () => {}

// The band is full-width; give each cell room so the contained column reads true.
function Band({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%', maxWidth: 720 }}>{children}</div>
}

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (CTA only)">
        <Band>
          <CTABanner
            eyebrow="Free for solo"
            headline="Finish the song."
            sub="The songwriter's DAW. Small on purpose, like the bird."
            ctaLabel="Download Jackdaw"
            onCta={NOOP}
          />
        </Band>
      </State>

      <State label="email capture (newsletter / early access)">
        <Band>
          <CTABanner
            eyebrow="Early access"
            headline="Be first to fly."
            sub="Get a note when collaboration opens up."
            ctaLabel="Download Jackdaw"
            emailCapture
            submitLabel="Notify me"
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="CTA hover (lit accent — hover the button)">
        <Band>
          <CTABanner
            headline="Make more art."
            sub="Hover the button to see the LED bloom."
            ctaLabel="Try it free"
            onCta={NOOP}
          />
        </Band>
      </State>

      <State label="email field focus (focus the input → lit ring)">
        <Band>
          <CTABanner
            headline="Keep every shiny idea."
            ctaLabel="Download Jackdaw"
            emailCapture
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="submitting (input + submit disabled)">
        <Band>
          <CTABanner
            headline="Be first to fly."
            ctaLabel="Download Jackdaw"
            emailCapture
            status="submitting"
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="success (green LED confirmation)">
        <Band>
          <CTABanner
            headline="Be first to fly."
            ctaLabel="Download Jackdaw"
            emailCapture
            status="success"
            successMessage="You're on the list — welcome to the nest."
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="error (submission failed — retry stays)">
        <Band>
          <CTABanner
            headline="Be first to fly."
            ctaLabel="Download Jackdaw"
            emailCapture
            status="error"
            errorMessage="Couldn't sign you up — please try again."
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="validation error (type a bad email, submit)">
        <Band>
          <CTABanner
            headline="Be first to fly."
            ctaLabel="Download Jackdaw"
            emailCapture
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>

      <State label="sm">
        <Band>
          <CTABanner
            size="sm"
            eyebrow="Early access"
            headline="Be first to fly."
            sub="Get a note when collaboration opens up."
            ctaLabel="Notify me"
            emailCapture
            onCta={NOOP}
            onSubmit={NOOP}
          />
        </Band>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [emailCapture, setEmailCapture] = useState(true)
  const [withEyebrow, setWithEyebrow] = useState(true)
  const [withSub, setWithSub] = useState(true)
  const [small, setSmall] = useState(false)
  const [status, setStatus] = useState<CTAStatus>('idle')
  const [submitted, setSubmitted] = useState<string | null>(null)

  // Dogfood: parent drives the lifecycle off onSubmit, just like the real site would.
  function handleSubmit(email: string) {
    setSubmitted(email)
    setStatus('success')
  }

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <CTABanner
            size={small ? 'sm' : 'md'}
            eyebrow={withEyebrow ? 'Early access' : undefined}
            headline="Finish the song."
            sub={withSub ? 'The songwriter’s DAW. Small on purpose, like the bird.' : undefined}
            ctaLabel="Download Jackdaw"
            emailCapture={emailCapture}
            status={status}
            onCta={NOOP}
            onSubmit={handleSubmit}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
            <Toggle checked={emailCapture} onChange={setEmailCapture} size="sm" label="email capture" />
            <Toggle checked={withEyebrow} onChange={setWithEyebrow} size="sm" label="eyebrow" />
            <Toggle checked={withSub} onChange={setWithSub} size="sm" label="sub" />
            <Toggle checked={small} onChange={setSmall} size="sm" label="sm size" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <SegmentedControl
              size="sm"
              aria-label="Submission status"
              value={status}
              onChange={(v) => setStatus(v as CTAStatus)}
              options={[
                { value: 'idle', label: 'idle' },
                { value: 'submitting', label: 'submitting' },
                { value: 'success', label: 'success' },
                { value: 'error', label: 'error' },
              ]}
            />
            {submitted && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                onSubmit → {submitted}
              </span>
            )}
          </div>
        </div>
      </div>
    </Playground>
  )
}

export default function CTABannerDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
