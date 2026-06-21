// src/components/OnboardingStep/OnboardingStep.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingStep } from './OnboardingStep'
import type { OnboardingStepData } from './OnboardingStep'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TUTORIAL: OnboardingStepData = {
  type: 'tutorial',
  text: 'Never waste one idea.',
  subtitle: 'Right-click any clip to save it to your library.',
}

const ACTION_CHOICES: OnboardingStepData = {
  type: 'action',
  text: 'Which instrument do you want to record?',
  subtitle: 'Select the type that best describes your setup.',
  actions: [
    { id: 'voice',  label: 'Voice' },
    { id: 'guitar', label: 'Guitar' },
    { id: 'midi',   label: 'Midi keyboard' },
  ],
}

const ACTION_GUIDED: OnboardingStepData = {
  type: 'action',
  text: 'Now select the right input for your guitar.',
  subtitle: 'Give it a name and pick the input below.',
}

const BASE_PROPS = {
  onNext:   vi.fn(),
  onAction: vi.fn(),
  onSkip:   vi.fn(),
}

beforeEach(() => { vi.clearAllMocks() })

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('OnboardingStep — rendering', () => {
  it('renders role="region"', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('region')).toBeInTheDocument()
  })

  it('sets aria-labelledby pointing to the headline', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    const region = screen.getByRole('region')
    const labelledBy = region.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = document.getElementById(labelledBy!)
    expect(heading?.textContent).toBe(TUTORIAL.text)
  })

  it('renders the headline as an h2', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('heading', { level: 2, name: TUTORIAL.text })).toBeInTheDocument()
  })

  it('renders the subtitle text', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByText(TUTORIAL.subtitle)).toBeInTheDocument()
  })

  it('applies data-type="tutorial" for tutorial steps', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('region')).toHaveAttribute('data-type', 'tutorial')
  })

  it('applies data-type="action" for action steps', () => {
    render(<OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS} />)
    expect(screen.getByRole('region')).toHaveAttribute('data-type', 'action')
  })

  it('applies data-size="md" by default', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('region')).toHaveAttribute('data-size', 'md')
  })

  it('applies data-size="sm" when size prop is sm', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} size="sm" />)
    expect(screen.getByRole('region')).toHaveAttribute('data-size', 'sm')
  })
})

// ── Skip and Next ─────────────────────────────────────────────────────────────

describe('OnboardingStep — Skip / Next', () => {
  it('always renders a Skip button', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
  })

  it('Skip calls onSkip', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(BASE_PROPS.onSkip).toHaveBeenCalledTimes(1)
  })

  it('tutorial type renders a Next button', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('Next calls onNext', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(BASE_PROPS.onNext).toHaveBeenCalledTimes(1)
  })

  it('last step shows "Finish" on the Next button', () => {
    render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 5, total: 5 }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })

  it('non-last step shows "Next" (not Finish)', () => {
    render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 3, total: 5 }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
  })
})

// ── Action type — choices ─────────────────────────────────────────────────────

describe('OnboardingStep — action choices', () => {
  it('renders choice buttons for each action', () => {
    render(<OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: 'Voice' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guitar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Midi keyboard' })).toBeInTheDocument()
  })

  it('choices group has role="group" and accessible label', () => {
    render(<OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS} />)
    expect(screen.getByRole('group', { name: 'Select one' })).toBeInTheDocument()
  })

  it('clicking a choice calls onAction with the choice id', () => {
    render(<OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guitar' }))
    expect(BASE_PROPS.onAction).toHaveBeenCalledWith('guitar')
  })

  it('action type with choices does NOT render a Next button', () => {
    render(<OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS} />)
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Finish' })).not.toBeInTheDocument()
  })
})

// ── Action type — guided (no actions array) ───────────────────────────────────

describe('OnboardingStep — action guided', () => {
  it('renders a Next button when action has no choices', () => {
    render(
      <OnboardingStep step={ACTION_GUIDED} {...BASE_PROPS}>
        <input aria-label="Track name" />
      </OnboardingStep>,
    )
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('renders children in the guided slot', () => {
    render(
      <OnboardingStep step={ACTION_GUIDED} {...BASE_PROPS}>
        <input aria-label="Track name" />
      </OnboardingStep>,
    )
    expect(screen.getByRole('textbox', { name: 'Track name' })).toBeInTheDocument()
  })

  it('does not render guided slot when step has choices', () => {
    render(
      <OnboardingStep step={ACTION_CHOICES} {...BASE_PROPS}>
        <input aria-label="Should not appear" />
      </OnboardingStep>,
    )
    expect(screen.queryByRole('textbox', { name: 'Should not appear' })).not.toBeInTheDocument()
  })
})

// ── Progress ──────────────────────────────────────────────────────────────────

describe('OnboardingStep — progress', () => {
  it('renders no progress when progress prop is omitted', () => {
    render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    expect(screen.queryByText(/of/)).not.toBeInTheDocument()
  })

  it('renders "N of M" progress label', () => {
    render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 3, total: 8 }}
      />,
    )
    expect(screen.getByText('3 of 8')).toBeInTheDocument()
  })

  it('renders the correct number of dots', () => {
    const { container } = render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 2, total: 5 }}
      />,
    )
    // dots are aria-hidden spans; query by class pattern
    const dots = container.querySelectorAll('[class*="dot"]:not([class*="dots"])')
    expect(dots).toHaveLength(5)
  })

  it('marks the current dot as active', () => {
    const { container } = render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 2, total: 5 }}
      />,
    )
    const dots = container.querySelectorAll('[class*="dot"]:not([class*="dots"])')
    expect(dots[1]).toHaveAttribute('data-active')    // 0-indexed → step 2
    expect(dots[0]).not.toHaveAttribute('data-active') // step 1
    expect(dots[2]).not.toHaveAttribute('data-active') // step 3
  })

  it('does not render dots when total > 10', () => {
    const { container } = render(
      <OnboardingStep
        step={TUTORIAL}
        {...BASE_PROPS}
        progress={{ current: 3, total: 12 }}
      />,
    )
    const dots = container.querySelectorAll('[class*="dot"]:not([class*="dots"])')
    expect(dots).toHaveLength(0)
    expect(screen.getByText('3 of 12')).toBeInTheDocument()
  })
})

// ── Media ─────────────────────────────────────────────────────────────────────

describe('OnboardingStep — media slot', () => {
  it('renders a media img when media is provided', () => {
    const { container } = render(
      <OnboardingStep
        step={{ ...TUTORIAL, media: { src: 'clip-save.gif', kind: 'gif' } }}
        {...BASE_PROPS}
      />,
    )
    // The media img carries data-kind; query by that to skip the brand mark img
    const img = container.querySelector('img[data-kind]')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', 'clip-save.gif')
    expect(img).toHaveAttribute('data-kind', 'gif')
  })

  it('renders a brand mark img in the header', () => {
    const { container } = render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    // BrandMark always renders at least one img (the mark)
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('does not render a media img when media is omitted', () => {
    const { container } = render(<OnboardingStep step={TUTORIAL} {...BASE_PROPS} />)
    // The media slot img has data-kind; the brand mark img does not
    expect(container.querySelector('img[data-kind]')).toBeNull()
  })
})
