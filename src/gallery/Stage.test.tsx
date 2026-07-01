// src/gallery/Stage.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Stage } from './Stage'
import styles from './Stage.module.css'

describe('Stage', () => {
  // Layout regression: the non-compare scroll viewport (`.content`, a definite-
  // height overflow-y:auto flex column) wraps the demo in a single fill wrapper
  // (`flex: 1 0 auto`). Without that wrapper the demo collapses to its content
  // height, so DemoShell's `min-height: 100%` resolves against an auto-height
  // ancestor rather than the viewport and a short demo leaves a phantom empty
  // scroll region below its content.
  it('grows the demo wrapper to fill the scroll viewport', () => {
    const { container } = render(<Stage />)
    const content = container.querySelector(`.${styles.content}`)
    expect(content).not.toBeNull()
    const wrapper = content!.firstElementChild as HTMLElement
    expect(wrapper.className).toContain(styles.viewportInner)
  })
})
