// src/components/PluginGraph/PluginGraph.test.tsx
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PluginGraph } from './PluginGraph'
import type { PluginGraphProps, GraphNode, GraphCurvePoint, NodePosition } from './PluginGraph'

// ─── Stubs ────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Pointer capture is not implemented in jsdom.
  ;(Element.prototype as unknown as { setPointerCapture: () => void }).setPointerCapture = vi.fn()
  ;(Element.prototype as unknown as { releasePointerCapture: () => void }).releasePointerCapture = vi.fn()
  // getBoundingClientRect returns a zero rect in jsdom, so the component's
  // client→svg map falls back to a 1:1 identity — client coords ARE svg coords.
})

beforeEach(() => vi.clearAllMocks())

// ─── Fixtures ─────────────────────────────────────────────────────────────────
//
// md defaults: w=480, h=220, freqRange [20,20000], dbRange [-18,18].
// A node at freq=1000, gain=0 maps to svg ≈ (272, 110).

const NODE_1K: GraphNode = { id: 'b1', freq: 1000, gain: 0, label: 'Peak 1' }
const NODE_1K_XY = { x: 272, y: 110 }

const CURVE: GraphCurvePoint[] = [
  { freq: 20, db: 0 },
  { freq: 1000, db: 6 },
  { freq: 20000, db: -3 },
]

const SPECTRUM = [0.2, 0.5, 0.8, 0.4, 0.1]
const TRACE = [-1, -0.5, 0, 0.5, 1, 0.5, 0, -0.5, -1]

function graph(overrides: Partial<PluginGraphProps> = {}) {
  return render(<PluginGraph {...overrides} />)
}

function cores() {
  return screen.getAllByRole('slider')
}

// ─── Frame / structure ──────────────────────────────────────────────────────────

describe('PluginGraph frame', () => {
  it('renders the canvas testid', () => {
    graph()
    expect(screen.getByTestId('plugin-graph-canvas')).toBeInTheDocument()
  })

  it('defaults to analyzer mode', () => {
    const { container } = graph()
    expect(container.querySelector('[data-mode="analyzer"]')).toBeInTheDocument()
  })

  it('sets data-mode="scope" in scope mode', () => {
    const { container } = graph({ mode: 'scope' })
    expect(container.querySelector('[data-mode="scope"]')).toBeInTheDocument()
  })

  it('defaults to md size', () => {
    const { container } = graph()
    expect(container.querySelector('[data-size="md"]')).toBeInTheDocument()
  })

  it('honours sm size with smaller canvas', () => {
    const { container } = graph({ size: 'sm' })
    expect(container.querySelector('[data-size="sm"]')).toBeInTheDocument()
    const svg = screen.getByTestId('plugin-graph-canvas')
    expect(svg).toHaveAttribute('width', '300')
  })

  it('honours explicit width/height overrides', () => {
    graph({ width: 640, height: 300 })
    const svg = screen.getByTestId('plugin-graph-canvas')
    expect(svg).toHaveAttribute('width', '640')
    expect(svg).toHaveAttribute('height', '300')
  })

  it('canvas has an img role with a default aria-label', () => {
    graph()
    expect(screen.getByRole('img', { name: 'EQ analyzer' })).toBeInTheDocument()
  })

  it('uses the scope aria-label default in scope mode', () => {
    graph({ mode: 'scope' })
    expect(screen.getByRole('img', { name: 'LFO motion scope' })).toBeInTheDocument()
  })

  it('respects a custom aria-label', () => {
    graph({ 'aria-label': 'Frequalizer response' })
    expect(screen.getByRole('img', { name: 'Frequalizer response' })).toBeInTheDocument()
  })
})

// ─── Analyzer drawing ────────────────────────────────────────────────────────────

describe('PluginGraph analyzer drawing', () => {
  it('draws a response curve path when curve has ≥2 points', () => {
    const { container } = graph({ curve: CURVE })
    expect(container.querySelector('path[class*="curve"]')).toBeInTheDocument()
  })

  it('does not draw a curve with fewer than 2 points', () => {
    const { container } = graph({ curve: [{ freq: 100, db: 0 }] })
    expect(container.querySelector('path[class*="curve"]')).not.toBeInTheDocument()
  })

  it('draws a spectrum wash when spectrum provided', () => {
    const { container } = graph({ spectrum: SPECTRUM })
    expect(container.querySelector('path[class*="spectrum"]')).toBeInTheDocument()
  })

  it('renders grid lines by default', () => {
    const { container } = graph({ curve: CURVE })
    expect(container.querySelectorAll('line[class*="gridLine"]').length).toBeGreaterThan(0)
  })

  it('renders no grid lines when showGrid=false', () => {
    const { container } = graph({ curve: CURVE, showGrid: false })
    expect(container.querySelectorAll('line[class*="gridLine"]').length).toBe(0)
  })

  it('emphasises the 0 dB reference line with data-zero', () => {
    const { container } = graph({ curve: CURVE })
    expect(container.querySelector('line[data-zero]')).toBeInTheDocument()
  })
})

// ─── Nodes — rendering ──────────────────────────────────────────────────────────

describe('PluginGraph nodes', () => {
  it('renders one slider core per node', () => {
    graph({ nodes: [NODE_1K, { id: 'b2', freq: 200, gain: -6 }] })
    expect(cores()).toHaveLength(2)
  })

  it('gives each node an aria-label with freq + gain', () => {
    graph({ nodes: [NODE_1K] })
    expect(screen.getByRole('slider', { name: /1k Hz/ })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /\+0\.0 dB/ })).toBeInTheDocument()
  })

  it('node cores are keyboard-focusable', () => {
    graph({ nodes: [NODE_1K] })
    expect(cores()[0].getAttribute('tabindex')).toBe('0')
  })

  it('disabled graph makes node cores unfocusable', () => {
    graph({ nodes: [NODE_1K], disabled: true })
    expect(cores()[0].getAttribute('tabindex')).toBe('-1')
  })

  it('per-node disabled marks aria-disabled', () => {
    graph({ nodes: [{ ...NODE_1K, disabled: true }] })
    expect(cores()[0]).toHaveAttribute('aria-disabled', 'true')
  })

  it('no nodes rendered in scope mode', () => {
    graph({ mode: 'scope', trace: TRACE, nodes: [NODE_1K] })
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })
})

// ─── Nodes — pointer drag ────────────────────────────────────────────────────────

describe('PluginGraph node drag', () => {
  it('pressing on a node selects it and calls onNodeSelect', () => {
    const onNodeSelect = vi.fn()
    graph({ nodes: [NODE_1K], onNodeSelect })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    expect(onNodeSelect).toHaveBeenCalledWith('b1')
  })

  it('sets data-dragging while a node is held', () => {
    const { container } = graph({ nodes: [NODE_1K] })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    expect(container.querySelector('[data-dragging]')).toBeInTheDocument()
  })

  it('dragging emits onNodeDrag with a new freq/gain', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    // Move up (smaller y) → gain should increase above 0.
    fireEvent.pointerMove(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y - 40, pointerId: 1 })
    expect(onNodeDrag).toHaveBeenCalled()
    const [id, pos] = onNodeDrag.mock.calls[onNodeDrag.mock.calls.length - 1] as [string, NodePosition]
    expect(id).toBe('b1')
    expect(pos.gain).toBeGreaterThan(0)
  })

  it('pointer up commits with onNodeDragEnd and clears dragging', () => {
    const onNodeDragEnd = vi.fn()
    const { container } = graph({ nodes: [NODE_1K], onNodeDragEnd })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y - 40, pointerId: 1 })
    expect(onNodeDragEnd).toHaveBeenCalledWith('b1', expect.any(Object))
    expect(container.querySelector('[data-dragging]')).not.toBeInTheDocument()
  })

  it('pressing empty space does not start a drag', () => {
    const onNodeDrag = vi.fn()
    const { container } = graph({ nodes: [NODE_1K], onNodeDrag })
    const svg = screen.getByTestId('plugin-graph-canvas')
    // Far from the node.
    fireEvent.pointerDown(svg, { clientX: 5, clientY: 5, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 30, clientY: 30, pointerId: 1 })
    expect(container.querySelector('[data-dragging]')).not.toBeInTheDocument()
    expect(onNodeDrag).not.toHaveBeenCalled()
  })

  it('does not drag when disabled', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag, disabled: true })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y - 40, pointerId: 1 })
    expect(onNodeDrag).not.toHaveBeenCalled()
  })

  it('does not drag a per-node-disabled handle', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [{ ...NODE_1K, disabled: true }], onNodeDrag })
    const svg = screen.getByTestId('plugin-graph-canvas')
    fireEvent.pointerDown(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: NODE_1K_XY.x, clientY: NODE_1K_XY.y - 40, pointerId: 1 })
    expect(onNodeDrag).not.toHaveBeenCalled()
  })
})

// ─── Nodes — keyboard ────────────────────────────────────────────────────────────

describe('PluginGraph node keyboard', () => {
  it('ArrowUp raises gain and commits', () => {
    const onNodeDrag = vi.fn()
    const onNodeDragEnd = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag, onNodeDragEnd })
    fireEvent.keyDown(cores()[0], { key: 'ArrowUp' })
    expect(onNodeDrag).toHaveBeenCalledWith('b1', { freq: 1000, gain: 1 })
    expect(onNodeDragEnd).toHaveBeenCalledWith('b1', { freq: 1000, gain: 1 })
  })

  it('ArrowDown lowers gain', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag })
    fireEvent.keyDown(cores()[0], { key: 'ArrowDown' })
    expect(onNodeDrag).toHaveBeenCalledWith('b1', { freq: 1000, gain: -1 })
  })

  it('ArrowRight raises frequency', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag })
    fireEvent.keyDown(cores()[0], { key: 'ArrowRight' })
    const [, pos] = onNodeDrag.mock.calls[0] as [string, NodePosition]
    expect(pos.freq).toBeGreaterThan(1000)
  })

  it('ArrowLeft lowers frequency', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag })
    fireEvent.keyDown(cores()[0], { key: 'ArrowLeft' })
    const [, pos] = onNodeDrag.mock.calls[0] as [string, NodePosition]
    expect(pos.freq).toBeLessThan(1000)
  })

  it('honours a custom gainStep', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag, gainStep: 3 })
    fireEvent.keyDown(cores()[0], { key: 'ArrowUp' })
    expect(onNodeDrag).toHaveBeenCalledWith('b1', { freq: 1000, gain: 3 })
  })

  it('clamps gain to dbRange', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [{ id: 'b1', freq: 1000, gain: 18 }], onNodeDrag, dbRange: [-18, 18] })
    fireEvent.keyDown(cores()[0], { key: 'ArrowUp' })
    expect(onNodeDrag).toHaveBeenCalledWith('b1', { freq: 1000, gain: 18 })
  })

  it('ignores non-arrow keys', () => {
    const onNodeDrag = vi.fn()
    graph({ nodes: [NODE_1K], onNodeDrag })
    fireEvent.keyDown(cores()[0], { key: 'Enter' })
    expect(onNodeDrag).not.toHaveBeenCalled()
  })

  it('focusing a node fires onNodeSelect', () => {
    const onNodeSelect = vi.fn()
    graph({ nodes: [NODE_1K], onNodeSelect })
    fireEvent.focus(cores()[0])
    expect(onNodeSelect).toHaveBeenCalledWith('b1')
  })
})

// ─── Scope mode ──────────────────────────────────────────────────────────────────

describe('PluginGraph scope mode', () => {
  it('draws a trace path with ≥2 samples', () => {
    const { container } = graph({ mode: 'scope', trace: TRACE })
    expect(container.querySelector('path[class*="trace"]')).toBeInTheDocument()
  })

  it('draws no trace with fewer than 2 samples', () => {
    const { container } = graph({ mode: 'scope', trace: [0] })
    expect(container.querySelector('path[class*="trace"]')).not.toBeInTheDocument()
  })

  it('draws a centre reference line', () => {
    const { container } = graph({ mode: 'scope', trace: TRACE })
    expect(container.querySelector('line[data-zero]')).toBeInTheDocument()
  })

  it('does not draw the analyzer curve in scope mode', () => {
    const { container } = graph({ mode: 'scope', trace: TRACE, curve: CURVE })
    expect(container.querySelector('path[class*="curve"]')).not.toBeInTheDocument()
  })
})

// ─── Readout ─────────────────────────────────────────────────────────────────────

describe('PluginGraph readout', () => {
  it('shows "No signal" when analyzer has no data', () => {
    graph()
    expect(screen.getByText('No signal')).toBeInTheDocument()
  })

  it('shows the selected node label + values after focus', () => {
    graph({ nodes: [NODE_1K] })
    fireEvent.focus(cores()[0])
    expect(screen.getByText('Peak 1')).toBeInTheDocument()
    expect(screen.getByText('1k Hz')).toBeInTheDocument()
    expect(screen.getByText('+0.0 dB')).toBeInTheDocument()
  })

  it('shows "No signal" for an empty scope', () => {
    graph({ mode: 'scope' })
    expect(screen.getByText('No signal')).toBeInTheDocument()
  })

  it('shows the LFO label for a live scope', () => {
    graph({ mode: 'scope', trace: TRACE })
    expect(screen.getByText('LFO')).toBeInTheDocument()
  })
})
