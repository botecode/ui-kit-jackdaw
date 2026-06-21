// src/components/SupportFlow/SupportFlow.tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { usePortalTarget } from '../../theme/ThemeProvider'
import { Dialog } from '../Dialog'
import { Fader } from '../Fader'
import styles from './SupportFlow.module.css'

const MAX_DONATION_CENTS = 2500  // $25 ceiling

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export type SupportFlowPhase = 'countdown' | 'dialog' | 'thankyou' | 'dismissed'

export interface SupportFlowProps {
  phase: SupportFlowPhase
  remainingSeconds: number
  onDefer: () => void
  onDonate: (amountCents: number) => void
  onContinueFree: () => void
}

export function SupportFlow({
  phase,
  remainingSeconds,
  onDefer,
  onDonate,
  onContinueFree,
}: SupportFlowProps) {
  const [amountCents, setAmountCents] = useState(0)
  const portalTarget = usePortalTarget()

  if (phase === 'dismissed') return null

  const showDefer = phase === 'countdown' && remainingSeconds <= 60
  const isDialogOpen = phase === 'dialog' || phase === 'thankyou'

  return (
    <>
      {phase === 'countdown' && createPortal(
        <div
          className={styles.badge}
          data-urgent={showDefer || undefined}
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${formatTime(remainingSeconds)} remaining`}
        >
          <span className={styles.badgeTime} aria-hidden="true">
            {formatTime(remainingSeconds)}
          </span>
          {showDefer && (
            <button
              className={styles.deferBtn}
              onClick={onDefer}
              data-testid="defer-btn"
            >
              +5 min
            </button>
          )}
        </div>,
        portalTarget ?? document.body,
      )}

      <Dialog
        open={isDialogOpen}
        onClose={onContinueFree}
        dismissible={false}
        aria-label="Support Jackdaw"
      >
        {phase === 'thankyou' ? (
          <div className={styles.thankyou} data-testid="thankyou">
            <div className={styles.thankyouMark} aria-hidden="true">♥</div>
            <p className={styles.thankyouText}>
              Thank you — really. It means a lot.
            </p>
            <button className={styles.continueBtn} onClick={onContinueFree}>
              Keep going
            </button>
          </div>
        ) : (
          <div className={styles.dialogContent}>
            <p className={styles.message}>
              I decided to keep Jackdaw free. I'd rather just trust you — if you're in a
              spot where you can chip in, you will, and that keeps the door open for everyone
              who can't. No pressure, no lock. If now's not the time, keep going.
            </p>

            <div className={styles.sliderSection}>
              <div className={styles.amountDisplay} data-testid="amount-display">
                <span
                  className={styles.amountValue}
                  data-testid="amount-value"
                  data-zero={amountCents === 0 || undefined}
                >
                  {amountCents === 0 ? 'free' : `$${Math.round(amountCents / 100)}`}
                </span>
              </div>

              <div className={styles.sliderWrap}>
                <Fader
                  value={amountCents}
                  onChange={setAmountCents}
                  min={0}
                  max={MAX_DONATION_CENTS}
                  step={100}
                  orientation="horizontal"
                  resetValue={0}
                  detent={{ value: 0, strength: 0.5 }}
                  aria-label="Donation amount"
                  size="280px"
                  color="var(--led-green)"
                />
              </div>

              <div className={styles.sliderLabels} aria-hidden="true">
                <span>free</span>
                <span>$25</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.continueBtn}
                onClick={onContinueFree}
                data-testid="continue-free"
              >
                Continue free
              </button>
              <button
                className={styles.donateBtn}
                data-active={amountCents > 0 || undefined}
                onClick={() => { if (amountCents > 0) onDonate(amountCents) }}
                aria-disabled={amountCents === 0}
                data-testid="donate-btn"
              >
                {amountCents > 0 ? `Give $${Math.round(amountCents / 100)}` : 'Give'}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
