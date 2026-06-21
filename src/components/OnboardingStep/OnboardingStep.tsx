// src/components/OnboardingStep/OnboardingStep.tsx
import { useId } from 'react'
import { BrandMark } from '../BrandMark'
import styles from './OnboardingStep.module.css'

export interface ActionChoice {
  id: string
  label: string
}

export interface OnboardingMedia {
  src: string
  kind: 'gif' | 'img'
}

export interface OnboardingStepData {
  type: 'tutorial' | 'action'
  text: string
  subtitle: string
  media?: OnboardingMedia
  /** Choice buttons for action type — selecting one fires onAction(id) and the consumer advances */
  actions?: ActionChoice[]
}

export interface OnboardingStepProps {
  step: OnboardingStepData
  onNext: () => void
  onAction: (id: string) => void
  onSkip: () => void
  progress?: { current: number; total: number }
  /** Guided-action slot: embedded controls rendered when type='action' and no actions array */
  children?: React.ReactNode
  size?: 'sm' | 'md'
}

// Dot threshold: show dots only when total fits comfortably
const MAX_DOTS = 10

export function OnboardingStep({
  step,
  onNext,
  onAction,
  onSkip,
  progress,
  children,
  size = 'md',
}: OnboardingStepProps) {
  const headlineId = useId()
  const isLast = progress != null && progress.current >= progress.total
  const hasChoices = step.type === 'action' && (step.actions?.length ?? 0) > 0

  // tutorial → always show Next
  // action + choices → no Next (choice tap fires onAction which advances)
  // action + no choices (guided) → show Next
  const showNext = step.type === 'tutorial' || !hasChoices

  return (
    <div
      className={styles.root}
      data-size={size}
      data-type={step.type}
      role="region"
      aria-labelledby={headlineId}
    >
      <div className={styles.header}>
        <BrandMark variant="mark" size={20} />
      </div>

      <div className={styles.body}>
        <h2 id={headlineId} className={styles.headline}>{step.text}</h2>
        <p className={styles.subtitle}>{step.subtitle}</p>

        {step.media && (
          <div className={styles.mediaWell}>
            <img
              src={step.media.src}
              alt=""
              className={styles.media}
              data-kind={step.media.kind}
            />
          </div>
        )}

        {hasChoices && (
          <div className={styles.choices} role="group" aria-label="Select one">
            {step.actions!.map(choice => (
              <button
                key={choice.id}
                className={styles.choiceBtn}
                onClick={() => onAction(choice.id)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {!hasChoices && children != null && (
          <div className={styles.guided}>{children}</div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.progress}>
          {progress != null && (
            <>
              {progress.total <= MAX_DOTS && (
                <div className={styles.dots} aria-hidden="true">
                  {Array.from({ length: progress.total }, (_, i) => (
                    <span
                      key={i}
                      className={styles.dot}
                      data-active={i + 1 === progress.current || undefined}
                    />
                  ))}
                </div>
              )}
              <span className={styles.progressLabel} aria-live="polite">
                {progress.current} of {progress.total}
              </span>
            </>
          )}
        </div>

        <div className={styles.footerActions}>
          <button className={styles.skipBtn} onClick={onSkip}>
            Skip
          </button>
          {showNext && (
            <button className={styles.nextBtn} onClick={onNext}>
              {isLast ? 'Finish' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
