import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SyncHub } from './SyncHub'
import type { SyncHubProps, KnownDevice } from './SyncHub'

function renderHub(props: Partial<SyncHubProps> = {}) {
  const onShowCode = props.onShowCode ?? vi.fn()
  const onScan = props.onScan ?? vi.fn()
  const utils = render(<SyncHub onShowCode={onShowCode} onScan={onScan} {...props} />)
  return { ...utils, onShowCode, onScan, status: utils.getByTestId('synchub-status') }
}

const PHONE_PEER = { id: 'p1', name: "Bob's phone", kind: 'phone' as const }
const DAW_PEER = { id: 'd1', name: 'Your DAW', kind: 'daw' as const }

const DEVICES: KnownDevice[] = [
  { id: 'd1', name: 'Your DAW', kind: 'daw', onNetwork: true },
  { id: 'p1', name: "Bob's phone", kind: 'phone' },
]

// ─── Rendering / status readout ───────────────────────────────────────────────

describe('SyncHub rendering', () => {
  it('defaults to disconnected + md, with a live status region', () => {
    const { getByRole, status } = renderHub()
    const region = getByRole('region', { name: /not connected/i })
    expect(region).toHaveAttribute('data-status', 'disconnected')
    expect(region).toHaveAttribute('data-size', 'md')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status.textContent).toMatch(/not connected/i)
  })

  it('reflects the size prop', () => {
    const { getByRole } = renderHub({ size: 'sm' })
    expect(getByRole('region')).toHaveAttribute('data-size', 'sm')
  })

  it('shows the connecting readout (with peer name)', () => {
    const { status } = renderHub({ status: 'connecting', peer: PHONE_PEER })
    expect(status.textContent).toMatch(/connecting to bob's phone/i)
  })

  it('shows connected-to-phone with the cross-network caption', () => {
    const { status, getByText } = renderHub({ status: 'connected', peer: PHONE_PEER })
    expect(status.textContent).toMatch(/connected to bob's phone/i)
    expect(getByText(/on a different network/i)).toBeInTheDocument()
  })

  it('shows connected-to-daw with the on-network caption', () => {
    const { status, getByText } = renderHub({ status: 'connected', peer: DAW_PEER })
    expect(status.textContent).toMatch(/connected to your daw/i)
    expect(getByText(/on your network/i)).toBeInTheDocument()
  })

  it('falls back to a generic connected message without a peer', () => {
    const { status } = renderHub({ status: 'connected' })
    expect(status.textContent).toMatch(/^connected$/i)
  })
})

// ─── The two big actions ──────────────────────────────────────────────────────

describe('SyncHub actions', () => {
  it('fires onShowCode when "Show my code" is pressed', () => {
    const onShowCode = vi.fn()
    const { getByTestId } = renderHub({ onShowCode })
    fireEvent.click(getByTestId('synchub-show-code'))
    expect(onShowCode).toHaveBeenCalledTimes(1)
  })

  it('fires onScan when "Scan to connect" is pressed', () => {
    const onScan = vi.fn()
    const { getByTestId } = renderHub({ onScan })
    fireEvent.click(getByTestId('synchub-scan'))
    expect(onScan).toHaveBeenCalledTimes(1)
  })

  it('uses the relabel ARIA model — action buttons carry no aria-pressed', () => {
    const { getByTestId } = renderHub()
    expect(getByTestId('synchub-show-code')).not.toHaveAttribute('aria-pressed')
    expect(getByTestId('synchub-scan')).not.toHaveAttribute('aria-pressed')
  })
})

// ─── Disconnect / Cancel ──────────────────────────────────────────────────────

describe('SyncHub disconnect', () => {
  it('shows Disconnect when connected and fires onDisconnect', () => {
    const onDisconnect = vi.fn()
    const { getByRole, queryByRole } = renderHub({ status: 'connected', peer: DAW_PEER, onDisconnect })
    // disconnected hides it
    expect(queryByRole('button', { name: /cancel connecting/i })).not.toBeInTheDocument()
    fireEvent.click(getByRole('button', { name: /^disconnect$/i }))
    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })

  it('relabels Disconnect → Cancel while connecting', () => {
    const onDisconnect = vi.fn()
    const { getByRole } = renderHub({ status: 'connecting', peer: PHONE_PEER, onDisconnect })
    fireEvent.click(getByRole('button', { name: /cancel connecting/i }))
    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })

  it('omits Disconnect when disconnected', () => {
    const { queryByRole } = renderHub({ status: 'disconnected', onDisconnect: vi.fn() })
    expect(queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument()
  })
})

// ─── Devices tray ─────────────────────────────────────────────────────────────

describe('SyncHub devices', () => {
  it('renders no tray when devices are absent or empty', () => {
    const { queryByText, rerender } = renderHub()
    expect(queryByText(/recent devices/i)).not.toBeInTheDocument()
    rerender(<SyncHub onShowCode={vi.fn()} onScan={vi.fn()} devices={[]} />)
    expect(queryByText(/recent devices/i)).not.toBeInTheDocument()
  })

  it('lists known devices with their names', () => {
    const { getByText } = renderHub({ devices: DEVICES })
    expect(getByText(/recent devices/i)).toBeInTheDocument()
    expect(getByText('Your DAW')).toBeInTheDocument()
    expect(getByText("Bob's phone")).toBeInTheDocument()
  })

  it('fires onReconnect with the device id', () => {
    const onReconnect = vi.fn()
    const { getByRole } = renderHub({ devices: DEVICES, onReconnect })
    fireEvent.click(getByRole('button', { name: /reconnect bob's phone/i }))
    expect(onReconnect).toHaveBeenCalledWith('p1')
  })

  it('an auto-discovered DAW offers a one-tap Connect (skips the QR)', () => {
    const onReconnect = vi.fn()
    const { getByRole } = renderHub({ devices: DEVICES, onReconnect })
    fireEvent.click(getByRole('button', { name: /connect your daw/i }))
    expect(onReconnect).toHaveBeenCalledWith('d1')
  })

  it('marks the currently-linked device as Connected and inert', () => {
    const onReconnect = vi.fn()
    const { getByRole } = renderHub({
      status: 'connected',
      peer: DAW_PEER,
      devices: DEVICES,
      onReconnect,
    })
    const linked = getByRole('button', { name: /connected to your daw/i })
    expect(linked).toBeDisabled()
    fireEvent.click(linked)
    expect(onReconnect).not.toHaveBeenCalled()
  })
})
