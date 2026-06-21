// src/components/OnboardingStep/OnboardingStep.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { InputSelect } from '../InputSelect'
import { OnboardingStep } from './OnboardingStep'
import type { OnboardingStepData } from './OnboardingStep'

export const meta: DemoMeta = {
  name: 'OnboardingStep',
  group: 'Composites',
  route: '/onboarding-step',
  order: 55,
}

// ── SVG placeholder (avoids real network URLs in gallery) ────────────────────
// Single-quotes inside the string must stay as-is inside a double-quoted literal.

const MEDIA_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='480' height='180'%3E%3Crect width='480' height='180' fill='%230d0d0d'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-family='monospace' font-size='13' fill='%23444'%3E%5B gif preview %5D%3C/text%3E%3C/svg%3E"

// ── Shared styles for the inline text field in guided demo ────────────────────

const INPUT_STYLE: React.CSSProperties = {
  appearance: 'none',
  background: 'var(--stage)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.45)',
  color: 'var(--stage-text)',
  fontFamily: 'var(--font-ui)',
  fontSize: 'var(--text-base)',
  padding: '6px var(--space-3)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TUTORIAL_STEP: OnboardingStepData = {
  type: 'tutorial',
  text: 'Never waste one idea.',
  // double-quoted so the apostrophe in "doesn't" / "it'll" is safe
  subtitle:
    "You had an idea that doesn't fit this song? Right-click the track and save it to your library — it'll be waiting the next time inspiration strikes.",
  media: { src: MEDIA_PLACEHOLDER, kind: 'gif' },
}

const TUTORIAL_NO_MEDIA: OnboardingStepData = {
  type: 'tutorial',
  text: 'Solo first, always.',
  subtitle:
    'Jackdaw is built for the songwriter. Start recording and worry about the mix later — the interface gets out of your way.',
}

const ACTION_CHOICES_STEP: OnboardingStepData = {
  type: 'action',
  text: 'Which instrument do you want to record?',
  subtitle: 'Jackdaw will set sensible defaults for your session.',
  actions: [
    { id: 'voice',  label: 'Voice' },
    { id: 'guitar', label: 'Guitar' },
    { id: 'midi',   label: 'Midi keyboard' },
  ],
}

const ACTION_GUIDED_STEP: OnboardingStepData = {
  type: 'action',
  text: 'Now set up your input.',
  // double-quoted so the apostrophe in "you're" is safe
  subtitle:
    "Select the right input for your guitar and give the track a name. Hit Next when you're ready.",
}

const INPUT_OPTIONS = [
  { id: 'builtin-mic',  label: 'Built-in Microphone' },
  { id: 'focusrite-1',  label: 'Focusrite — Input 1' },
  { id: 'focusrite-2',  label: 'Focusrite — Input 2' },
  { id: 'aggregate',    label: 'Aggregate Device' },
]

// ── State cards ───────────────────────────────────────────────────────────────

function TutorialWithMedia() {
  return (
    <State label="Tutorial — gif + Next">
      <OnboardingStep
        step={TUTORIAL_STEP}
        progress={{ current: 2, total: 6 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

function TutorialNoMedia() {
  return (
    <State label="Tutorial — no media">
      <OnboardingStep
        step={TUTORIAL_NO_MEDIA}
        progress={{ current: 1, total: 6 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

function ActionChoices() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <State label="Action — choice buttons">
      <OnboardingStep
        step={ACTION_CHOICES_STEP}
        progress={{ current: 3, total: 6 }}
        onNext={() => {}}
        onAction={(id) => setSelected(id)}
        onSkip={() => {}}
      />
      {selected && (
        <p style={{
          marginTop: 'var(--space-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
        }}>
          {`→ onAction("${selected}")`}
        </p>
      )}
    </State>
  )
}

function ActionGuided() {
  const [inputId, setInputId] = useState<string | null>(null)
  const [name, setName] = useState('')
  return (
    <State label="Action — guided (embedded controls)">
      <OnboardingStep
        step={ACTION_GUIDED_STEP}
        progress={{ current: 4, total: 6 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      >
        <InputSelect
          value={inputId}
          onChange={setInputId}
          options={INPUT_OPTIONS}
          variant="field"
          aria-label="Audio input"
          placeholder="Select input..."
        />
        <input
          style={INPUT_STYLE}
          aria-label="Track name"
          placeholder="Track name..."
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </OnboardingStep>
    </State>
  )
}

function FirstStep() {
  return (
    <State label="First step (dot at 1/5)">
      <OnboardingStep
        step={TUTORIAL_NO_MEDIA}
        progress={{ current: 1, total: 5 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

function LastStep() {
  return (
    <State label="Last step — Finish button">
      <OnboardingStep
        step={{
          type: 'tutorial',
          text: 'You are ready.',
          subtitle: 'Everything is set up. Hit Finish and start your first session.',
        }}
        progress={{ current: 5, total: 5 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

function NoProgress() {
  return (
    <State label="No progress indicator">
      <OnboardingStep
        step={TUTORIAL_NO_MEDIA}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

function SmSize() {
  return (
    <State label="sm size">
      <OnboardingStep
        step={TUTORIAL_NO_MEDIA}
        size="sm"
        progress={{ current: 2, total: 4 }}
        onNext={() => {}}
        onAction={() => {}}
        onSkip={() => {}}
      />
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <TutorialWithMedia />
      <TutorialNoMedia />
      <ActionChoices />
      <ActionGuided />
      <FirstStep />
      <LastStep />
      <NoProgress />
      <SmSize />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

const STEPS: OnboardingStepData[] = [
  TUTORIAL_STEP,
  TUTORIAL_NO_MEDIA,
  ACTION_CHOICES_STEP,
  ACTION_GUIDED_STEP,
  {
    type: 'tutorial',
    text: 'You are ready.',
    subtitle: 'Hit Finish to begin your first Jackdaw session.',
  },
]

function PlaygroundDemo() {
  const [stepIdx,      setStepIdx]      = useState(0)
  const [showProgress, setShowProgress] = useState(true)
  const [inputId,      setInputId]      = useState<string | null>(null)
  const [trackName,    setTrackName]    = useState('')
  const [lastAction,   setLastAction]   = useState<string | null>(null)

  const total = STEPS.length
  const current = stepIdx + 1
  const step = STEPS[stepIdx]!

  function handleNext() {
    if (stepIdx < total - 1) setStepIdx(i => i + 1)
  }
  function handleAction(id: string) {
    setLastAction(id)
    if (stepIdx < total - 1) setStepIdx(i => i + 1)
  }
  function handleSkip() { setStepIdx(0) }

  const progress = showProgress ? { current, total } : undefined

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Live OnboardingStep */}
        <OnboardingStep
          step={step}
          progress={progress}
          onNext={handleNext}
          onAction={handleAction}
          onSkip={handleSkip}
        >
          {step === ACTION_GUIDED_STEP && (
            <>
              <InputSelect
                value={inputId}
                onChange={setInputId}
                options={INPUT_OPTIONS}
                variant="field"
                aria-label="Audio input"
                placeholder="Select input..."
              />
              <input
                style={INPUT_STYLE}
                aria-label="Track name"
                placeholder="Track name..."
                value={trackName}
                onChange={e => setTrackName(e.target.value)}
              />
            </>
          )}
        </OnboardingStep>

        {/* Controls — dogfood Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={showProgress}
            onChange={setShowProgress}
            size="sm"
            label="progress indicator"
          />
          {lastAction && (
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-dim)',
              margin: 0,
            }}>
              {`onAction("${lastAction}")`}
            </p>
          )}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            margin: 0,
          }}>
            {`step ${current}/${total} — ${step.type}`}
          </p>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-dim)',
            margin: 0,
          }}>
            Skip resets to step 1
          </p>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function OnboardingStepDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
