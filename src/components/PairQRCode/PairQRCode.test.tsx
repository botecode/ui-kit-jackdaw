import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, within } from '@testing-library/react'
import { PairQRCode } from './PairQRCode'

function renderPair(props: Partial<React.ComponentProps<typeof PairQRCode>> = {}) {
  const utils = render(
    <PairQRCode code="nioh://pair/7-tuna-zebra-piano" deviceName="Fernando's MacBook" {...props} />,
  )
  const root = utils.getByTestId('pairqrcode-root')
  const status = utils.getByTestId('pairqrcode-status')
  return { ...utils, root, status }
}

// ─── Rendering ──────────────────────────────────────────────────────────────────

describe('PairQRCode rendering', () => {
  it('renders the root, the QR image and the device name', () => {
    const { root, getByRole, getByText } = renderPair()
    expect(root).toBeInTheDocument()
    expect(getByRole('img', { name: /pairing qr code/i })).toBeInTheDocument()
    expect(getByText("Fernando's MacBook")).toBeInTheDocument()
  })

  it('defaults to md size and waiting status', () => {
    const { root } = renderPair()
    expect(root).toHaveAttribute('data-size', 'md')
    expect(root).toHaveAttribute('data-status', 'waiting')
  })

  it('reflects the size prop', () => {
    const { root } = renderPair({ size: 'sm' })
    expect(root).toHaveAttribute('data-size', 'sm')
  })

  it('encodes the code into the QR path (changes with the code)', () => {
    const a = render(<PairQRCode code="nioh://pair/aaa" deviceName="Dev" />)
    const pathA = within(a.container).getByTestId('pairqrcode-qr-path').getAttribute('d')
    const b = render(<PairQRCode code="nioh://pair/zzz-different" deviceName="Dev" />)
    const pathB = within(b.container).getByTestId('pairqrcode-qr-path').getAttribute('d')
    expect(pathA).toBeTruthy()
    expect(pathA).not.toEqual(pathB)
  })
})

// ─── Waiting state ──────────────────────────────────────────────────────────────

describe('PairQRCode waiting', () => {
  it('shows the waiting copy and a live status region', () => {
    const { status } = renderPair({ status: 'waiting' })
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status.textContent).toMatch(/waiting for the other device/i)
  })

  it('renders the Cancel button while waiting', () => {
    const { getByRole } = renderPair({ status: 'waiting' })
    expect(getByRole('button', { name: /cancel pairing/i })).toBeInTheDocument()
  })

  it('fires onCancel when Cancel is pressed', () => {
    const onCancel = vi.fn()
    const { getByRole } = renderPair({ status: 'waiting', onCancel })
    fireEvent.click(getByRole('button', { name: /cancel pairing/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// ─── Connected (success) transition ─────────────────────────────────────────────

describe('PairQRCode connected', () => {
  it('transitions waiting → connected: seal replaces QR, success copy, no Cancel', () => {
    const { rerender, root, status, getByRole, queryByRole, queryByTestId } = renderPair({
      status: 'waiting',
    })
    expect(getByRole('img', { name: /pairing qr code/i })).toBeInTheDocument()

    rerender(
      <PairQRCode
        code="nioh://pair/7-tuna-zebra-piano"
        deviceName="Fernando's MacBook"
        status="connected"
        peerName="Studio iPad"
      />,
    )
    expect(root).toHaveAttribute('data-status', 'connected')
    // QR is gone, the success seal is shown instead.
    expect(queryByRole('img', { name: /pairing qr code/i })).not.toBeInTheDocument()
    expect(queryByTestId('pairqrcode-seal')).toBeInTheDocument()
    expect(status.textContent).toMatch(/connected/i)
    expect(status.textContent).toMatch(/studio ipad/i)
    // Nothing to cancel once connected.
    expect(queryByRole('button', { name: /cancel pairing/i })).not.toBeInTheDocument()
  })

  it('shows a generic connected message when no peerName is given', () => {
    const { status } = renderPair({ status: 'connected' })
    expect(status.textContent).toMatch(/connected/i)
  })
})

// ─── Cancelled state ────────────────────────────────────────────────────────────

describe('PairQRCode cancelled', () => {
  it('shows cancelled copy, no Cancel button, and dims the frame', () => {
    const { root, status, queryByRole } = renderPair({ status: 'cancelled' })
    expect(root).toHaveAttribute('data-status', 'cancelled')
    expect(status.textContent).toMatch(/pairing cancelled/i)
    expect(queryByRole('button', { name: /cancel pairing/i })).not.toBeInTheDocument()
  })
})
