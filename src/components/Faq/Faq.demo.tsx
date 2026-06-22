// src/components/Faq/Faq.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Faq } from './Faq'
import type { FaqItem } from './Faq'

export const meta: DemoMeta = {
  name: 'Faq',
  group: 'Composites',
  route: '/faq',
  order: 58,
}

const ITEMS: FaqItem[] = [
  {
    id: 'stems',
    question: 'Can I export individual stems?',
    answer: 'Yes. Every track bounces to its own file in one pass — no soloing and re-rendering one at a time.',
  },
  {
    id: 'offline',
    question: 'Does Jackdaw work offline?',
    answer: 'The whole session lives on your machine. You can write, mix and bounce on a plane with no connection.',
  },
  {
    id: 'collab',
    question: 'How does collaboration work?',
    answer: 'Share a transparent link; the other person imports the session locally. Nothing of yours sits on a server.',
  },
  {
    id: 'formats',
    question: 'Which file formats are supported?',
    answer: 'WAV, AIFF and FLAC for audio; standard MIDI for instrument parts.',
  },
]

const RICH_ITEMS: FaqItem[] = [
  {
    id: 'pricing',
    question: 'What does a license include?',
    answer: (
      <>
        <p>A perpetual license for the current major version, including every point release within it.</p>
        <p>
          Upgrades to the next major are optional — see the <a href="#pricing">pricing page</a> for details.
        </p>
      </>
    ),
  },
  {
    id: 'refund',
    question: 'Is there a refund policy?',
    answer: 'Fourteen days, no questions asked. If it is not for you, we send the money back.',
  },
]

const DISABLED_ITEMS: FaqItem[] = [
  { id: 'a', question: 'Available now', answer: 'This answer is open and readable.' },
  { id: 'b', question: 'Coming soon (disabled)', answer: 'You should not be able to reach this.', disabled: true },
  { id: 'c', question: 'Also available', answer: 'And this one opens normally.' },
]

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Default (all collapsed)">
        <div style={{ width: 360 }}>
          <Faq items={ITEMS} />
        </div>
      </State>

      <State label="One open (single-open / selected)">
        <div style={{ width: 360 }}>
          <Faq items={ITEMS} defaultOpen={['stems']} />
        </div>
      </State>

      <State label="Multi-open">
        <div style={{ width: 360 }}>
          <Faq items={ITEMS} allowMultiple defaultOpen={['stems', 'collab']} />
        </div>
      </State>

      <State label="Rich answer content">
        <div style={{ width: 360 }}>
          <Faq items={RICH_ITEMS} defaultOpen={['pricing']} />
        </div>
      </State>

      <State label="Disabled item">
        <div style={{ width: 360 }}>
          <Faq items={DISABLED_ITEMS} />
        </div>
      </State>

      <State label="Size sm">
        <div style={{ width: 320 }}>
          <Faq items={ITEMS} size="sm" defaultOpen={['offline']} />
        </div>
      </State>

      <State label="Empty">
        <div style={{ width: 360 }}>
          <Faq items={[]} />
        </div>
      </State>
    </StatesGrid>
  )
}

// ── Playground ───────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [openFirst, setOpenFirst] = useState(true)
  const [small, setSmall] = useState(false)

  return (
    <Playground>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minWidth: 380 }}>
        <Faq
          key={`${allowMultiple}-${openFirst}-${small}`}
          items={ITEMS}
          allowMultiple={allowMultiple}
          defaultOpen={openFirst ? ['stems'] : undefined}
          size={small ? 'sm' : 'md'}
        />

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-6)',
            alignItems: 'center',
            paddingTop: 'var(--space-2)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          <Toggle checked={allowMultiple} onChange={setAllowMultiple} size="sm" label="multi-open" />
          <Toggle checked={openFirst} onChange={setOpenFirst} size="sm" label="open first" />
          <Toggle checked={small} onChange={setSmall} size="sm" label="size sm" />
        </div>

        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          Click a question, or focus a header and use ↑ ↓ Home End to move between them.
        </p>
      </div>
    </Playground>
  )
}

// ── Default export ───────────────────────────────────────────────────────────────

export default function FaqDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
