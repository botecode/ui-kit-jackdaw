import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MuteSoloToggleCalm } from './MuteSoloToggle.calm'

describe('MuteSoloToggleCalm', () => {
  it('reflects mute/solo via aria-pressed and fires callbacks', () => {
    const onToggleMute = vi.fn()
    const onToggleSolo = vi.fn()
    const { getByLabelText } = render(
      <MuteSoloToggleCalm
        muted soloed={false}
        onToggleMute={onToggleMute}
        onToggleSolo={onToggleSolo}
      />,
    )
    expect(getByLabelText('Mute')).toHaveAttribute('aria-pressed', 'true')
    expect(getByLabelText('Solo')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(getByLabelText('Solo'))
    expect(onToggleSolo).toHaveBeenCalledTimes(1)
  })

  it('annotates mute as silenced when another track is soloed', () => {
    const { getByLabelText } = render(
      <MuteSoloToggleCalm
        muted={false} soloed={false} anySoloActive
        onToggleMute={() => {}} onToggleSolo={() => {}}
      />,
    )
    expect(getByLabelText('Mute (silenced by solo)')).toHaveAttribute('data-silenced', 'true')
  })
})
