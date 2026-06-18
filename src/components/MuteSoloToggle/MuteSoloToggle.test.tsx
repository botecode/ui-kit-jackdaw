import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MuteSoloToggle, isSilencedBySolo } from './MuteSoloToggle'

describe('isSilencedBySolo', () => {
  it('returns false when anySoloActive=false', () => {
    expect(isSilencedBySolo(false, false, false)).toBe(false)
  })
  it('returns false when anySoloActive=undefined', () => {
    expect(isSilencedBySolo(false, false, undefined)).toBe(false)
  })
  it('returns true when anySoloActive=true, not muted, not soloed', () => {
    expect(isSilencedBySolo(false, false, true)).toBe(true)
  })
  it('returns false when muted=true (explicit mute wins over silenced)', () => {
    expect(isSilencedBySolo(true, false, true)).toBe(false)
  })
  it('returns false when soloed=true', () => {
    expect(isSilencedBySolo(false, true, true)).toBe(false)
  })
  it('returns false when both muted and soloed', () => {
    expect(isSilencedBySolo(true, true, true)).toBe(false)
  })
})
