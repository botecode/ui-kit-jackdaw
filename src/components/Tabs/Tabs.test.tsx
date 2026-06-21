// src/components/Tabs/Tabs.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Tabs } from './Tabs'

const TABS = [
  { id: 'clips', label: 'Clips' },
  { id: 'automation', label: 'Automation' },
  { id: 'sends', label: 'Sends' },
]

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('Tabs – rendering', () => {
  it('renders a tablist', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getByRole('tablist')).toBeInTheDocument()
  })

  it('renders one tab per entry', () => {
    const { getAllByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getAllByRole('tab')).toHaveLength(3)
  })

  it('renders a tabpanel', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getByRole('tabpanel')).toBeInTheDocument()
  })

  it('active tab has aria-selected=true', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="automation" onChange={vi.fn()} />
    )
    expect(getByRole('tab', { name: 'Automation' })).toHaveAttribute('aria-selected', 'true')
  })

  it('inactive tabs have aria-selected=false', () => {
    const { getAllByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    const inactive = getAllByRole('tab').filter(t => t.getAttribute('aria-selected') === 'false')
    expect(inactive).toHaveLength(2)
  })

  it('active tab has tabIndex=0 (roving tabindex)', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getByRole('tab', { name: 'Clips' })).toHaveAttribute('tabindex', '0')
  })

  it('inactive tabs have tabIndex=-1 (roving tabindex)', () => {
    const { getAllByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    const inactive = getAllByRole('tab').filter(t => t.getAttribute('aria-selected') === 'false')
    inactive.forEach(t => expect(t).toHaveAttribute('tabindex', '-1'))
  })

  it('data-active present on active tab', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getByRole('tab', { name: 'Clips' })).toHaveAttribute('data-active')
  })

  it('data-active absent on inactive tabs', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(getByRole('tab', { name: 'Automation' })).not.toHaveAttribute('data-active')
  })

  it('data-size=md by default', () => {
    const { container } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'md')
  })

  it('data-size=sm when size=sm', () => {
    const { container } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} size="sm" />
    )
    expect(container.firstChild).toHaveAttribute('data-size', 'sm')
  })

  it('all tabs aria-controls point to the same panel id', () => {
    const { getByRole, getAllByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()} />
    )
    const panel = getByRole('tabpanel')
    const tabs = getAllByRole('tab')
    tabs.forEach(tab => {
      expect(tab.getAttribute('aria-controls')).toBe(panel.id)
    })
  })

  it('tabpanel aria-labelledby points to active tab id', () => {
    const { getByRole } = render(
      <Tabs tabs={TABS} active="automation" onChange={vi.fn()} />
    )
    const panel = getByRole('tabpanel')
    const activeTab = getByRole('tab', { name: 'Automation' })
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.id)
  })

  it('renders children inside tabpanel', () => {
    const { getByRole, getByText } = render(
      <Tabs tabs={TABS} active="clips" onChange={vi.fn()}>
        <span>Panel content</span>
      </Tabs>
    )
    expect(getByRole('tabpanel')).toContainElement(getByText('Panel content'))
  })

  it('disabled tab has aria-disabled attribute', () => {
    const tabs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ]
    const { getByRole } = render(<Tabs tabs={tabs} active="a" onChange={vi.fn()} />)
    expect(getByRole('tab', { name: 'B' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('disabled tab has data-disabled attribute', () => {
    const tabs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ]
    const { getByRole } = render(<Tabs tabs={tabs} active="a" onChange={vi.fn()} />)
    expect(getByRole('tab', { name: 'B' })).toHaveAttribute('data-disabled')
  })
})

// ─── Interaction ─────────────────────────────────────────────────────────────

describe('Tabs – interaction', () => {
  it('click on inactive tab calls onChange with tab id', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={onChange} />
    )
    fireEvent.click(getByRole('tab', { name: 'Automation' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('automation')
  })

  it('click on disabled tab does not call onChange', () => {
    const onChange = vi.fn()
    const tabs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
    ]
    const { getByRole } = render(<Tabs tabs={tabs} active="a" onChange={onChange} />)
    fireEvent.click(getByRole('tab', { name: 'B' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ArrowRight moves to next tab', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('automation')
  })

  it('ArrowLeft moves to previous tab', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="automation" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('clips')
  })

  it('ArrowRight wraps from last to first', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="sends" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('clips')
  })

  it('ArrowLeft wraps from first to last', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('sends')
  })

  it('Home moves to first enabled tab', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="sends" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('clips')
  })

  it('End moves to last enabled tab', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('sends')
  })

  it('ArrowRight skips disabled tabs', () => {
    const onChange = vi.fn()
    const tabs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
      { id: 'c', label: 'C' },
    ]
    const { getByRole } = render(<Tabs tabs={tabs} active="a" onChange={onChange} />)
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('ArrowLeft skips disabled tabs', () => {
    const onChange = vi.fn()
    const tabs = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', disabled: true },
      { id: 'c', label: 'C' },
    ]
    const { getByRole } = render(<Tabs tabs={tabs} active="c" onChange={onChange} />)
    fireEvent.keyDown(getByRole('tablist'), { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('unrelated key press does not call onChange', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <Tabs tabs={TABS} active="clips" onChange={onChange} />
    )
    fireEvent.keyDown(getByRole('tablist'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})
