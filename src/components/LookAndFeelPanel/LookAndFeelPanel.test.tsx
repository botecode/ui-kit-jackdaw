import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { THEMES } from '../../tokens/themes'
import { LookAndFeelPanel } from './LookAndFeelPanel'

const THREE = THEMES.slice(0, 3) // chroma, default, bowie

// ── Rendering ────────────────────────────────────────────────────────────────

describe('LookAndFeelPanel rendering', () => {
  it('renders a radiogroup', () => {
    const { getByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
  })

  it('renders one radio button per theme', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')).toHaveLength(3)
  })

  it('active card has aria-checked="true"', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={() => {}} />,
    )
    // default is index 1 in THREE
    expect(getAllByRole('radio')[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('non-active cards have aria-checked="false"', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).toHaveAttribute('aria-checked', 'false')
    expect(cards[2]).toHaveAttribute('aria-checked', 'false')
  })

  it('active card has data-selected attribute', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')[0]).toHaveAttribute('data-selected')
  })

  it('non-active cards lack data-selected', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).not.toHaveAttribute('data-selected')
    expect(cards[2]).not.toHaveAttribute('data-selected')
  })

  it('renders theme names as text', () => {
    const { getByText } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getByText('Chroma')).toBeInTheDocument()
    expect(getByText('Default')).toBeInTheDocument()
    expect(getByText('Bowie')).toBeInTheDocument()
  })

  it('active card has tabIndex 0', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    expect(getAllByRole('radio')[0]).toHaveAttribute('tabindex', '0')
  })

  it('non-active cards have tabIndex -1', () => {
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={() => {}} />,
    )
    const cards = getAllByRole('radio')
    expect(cards[1]).toHaveAttribute('tabindex', '-1')
    expect(cards[2]).toHaveAttribute('tabindex', '-1')
  })

  it('renders with all THEMES without error', () => {
    expect(() =>
      render(<LookAndFeelPanel themes={THEMES} active="chroma" onSelect={() => {}} />),
    ).not.toThrow()
  })
})

// ── Interaction ──────────────────────────────────────────────────────────────

describe('LookAndFeelPanel interaction', () => {
  it('clicking a non-active card calls onSelect with its id', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.click(getAllByRole('radio')[1])
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('clicking the active card still calls onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.click(getAllByRole('radio')[0])
    expect(onSelect).toHaveBeenCalledWith('chroma')
  })

  it('ArrowDown from index 0 calls onSelect with next theme id', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('ArrowDown from last index wraps to first', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="bowie" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[2], { key: 'ArrowDown' })
    expect(onSelect).toHaveBeenCalledWith('chroma')
  })

  it('ArrowUp from index 0 wraps to last', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('bowie')
  })

  it('ArrowUp from index 2 selects index 1', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="bowie" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[2], { key: 'ArrowUp' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('Enter key calls onSelect with focused card theme', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[1], { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('Space key calls onSelect with focused card theme', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="default" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[1], { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('default')
  })

  it('unrelated key does not call onSelect', () => {
    const onSelect = vi.fn()
    const { getAllByRole } = render(
      <LookAndFeelPanel themes={THREE} active="chroma" onSelect={onSelect} />,
    )
    fireEvent.keyDown(getAllByRole('radio')[0], { key: 'Tab' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
