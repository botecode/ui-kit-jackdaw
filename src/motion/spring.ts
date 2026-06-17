// src/motion/spring.ts
import { useEffect, useRef, useState } from 'react'

const reducedMotionMql = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)')

interface Config {
  stiffness?: number
  damping?: number
}

// Critically-damped spring using symplectic (semi-implicit) Euler integration.
// Default: stiffness 200, damping 30 → ζ ≈ 1.06 (just past critical: zero overshoot).
// Heavier settle (resize divider): { stiffness: 120, damping: 22 } → ζ ≈ 1.0.
//
// UNIT CONTRACT: target must be in PIXELS. The settle epsilon (0.01) is calibrated
// for pixel values and will cause ~1% early settle on a normalised 0–1 input.
// If you need to spring a normalised value, scale to pixels first, then convert back.
//
// Brand rule: weight ≠ bounce. Tune for firm, authoritative settle. Never increase
// stiffness to the point of overshoot — that's the tell of a toy.
export function useSpring(target: number, { stiffness = 200, damping = 30 }: Config = {}) {
  const [value, setValue] = useState(target)
  const state = useRef({ pos: target, vel: 0 })
  const rafId = useRef(0)

  useEffect(() => {
    const mql = reducedMotionMql()

    if (mql.matches) {
      cancelAnimationFrame(rafId.current)
      setValue(target)
      state.current = { pos: target, vel: 0 }
      return
    }

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30) // cap at 30fps minimum
      last = now

      // Symplectic Euler: update velocity first, then position with new velocity.
      // More stable than explicit Euler — no energy gain on large dt.
      const force = stiffness * (target - state.current.pos) - damping * state.current.vel
      state.current.vel += force * dt
      state.current.pos += state.current.vel * dt

      const settled =
        Math.abs(target - state.current.pos) < 0.01 &&
        Math.abs(state.current.vel) < 0.01

      if (settled) {
        setValue(target)
        state.current = { pos: target, vel: 0 }
        return // loop ends; no cancelAnimationFrame needed
      }

      setValue(state.current.pos)
      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)

    const onMqlChange = () => {
      if (mql.matches) {
        cancelAnimationFrame(rafId.current)
        state.current = { pos: target, vel: 0 }
        setValue(target)
      }
    }
    mql.addEventListener('change', onMqlChange)

    return () => {
      cancelAnimationFrame(rafId.current)
      mql.removeEventListener('change', onMqlChange)
    }
  }, [target, stiffness, damping])

  return value
}
