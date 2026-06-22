// src/components/SyncHub/SyncHub.tsx
import { useId } from 'react'
import { DeviceMobile, SlidersHorizontal, QrCode, Scan } from '@phosphor-icons/react'
import styles from './SyncHub.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────
// The home of the Nioh sync feature — opened by the mobile topbar QR icon. It is
// the same surface whether you're linking phone↔phone (across networks, via the
// QR handshake) or phone↔DAW (same network, where the desktop is auto-discovered
// and you can connect without a code). `kind` is what tells those two contexts
// apart, so it lives on every device shape here.
//
// This is the canonical sync-surface contract: `onShowCode` opens PairQRCode,
// `onScan` opens PairScanner, `onReconnect(id)` relinks a known device (or
// connects to an auto-discovered DAW), so the component drops into the app with
// no rework.

export type SyncStatus = 'disconnected' | 'connecting' | 'connected'

/** Phone companion vs. the Jackdaw desktop — drives the glyph and the context copy. */
export type SyncDeviceKind = 'phone' | 'daw'

export interface SyncPeer {
  id: string
  /** "Bob's phone" / "Your DAW" — shown verbatim in the readout. */
  name: string
  kind: SyncDeviceKind
}

export interface KnownDevice {
  id: string
  name: string
  kind: SyncDeviceKind
  /** True when this device is auto-discovered on the local network right now (a
   *  DAW on the same Wi-Fi). Connecting to it skips the QR handshake entirely. */
  onNetwork?: boolean
}

export interface SyncHubProps {
  /** The connection lifecycle. Default `disconnected`. */
  status?: SyncStatus
  /** The peer once connecting/connected — drives the status readout. */
  peer?: SyncPeer
  /** Known / recently-paired devices to reconnect to. Omit for none. */
  devices?: KnownDevice[]
  size?: 'sm' | 'md'
  /** Show this device's code → opens PairQRCode. */
  onShowCode: () => void
  /** Scan another device's code → opens PairScanner. */
  onScan: () => void
  /** Relink a known device, or connect to an auto-discovered DAW. */
  onReconnect?: (deviceId: string) => void
  /** Tear down the current link. While connecting it cancels the handshake. */
  onDisconnect?: () => void
}

// ── Glyphs ──────────────────────────────────────────────────────────────────
// The peer's hardware glyph (phone / DAW) sits in the indicator well so "what
// you're linked to" reads as a physical thing, matching IncomingShare's origin
// badge. Disconnected has no peer, so it shows a bespoke broadcast glyph (inline
// SVG, not a Phosphor icon) — the kit "listening for a link" mark.

function DeviceGlyph({ kind, size }: { kind: SyncDeviceKind; size: number }) {
  const Icon = kind === 'phone' ? DeviceMobile : SlidersHorizontal
  return <Icon size={size} weight="regular" />
}

function BroadcastGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <path
        d="M7.4 16.6a6.5 6.5 0 0 1 0-9.2M4.6 19.4a10.5 10.5 0 0 1 0-14.8M16.6 7.4a6.5 6.5 0 0 1 0 9.2M19.4 4.6a10.5 10.5 0 0 1 0 14.8"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ── Device row ────────────────────────────────────────────────────────────────
// A raised chip on the recessed devices tray. The currently-linked device is lit
// (green dot, "Connected", inert); an auto-discovered DAW lights its own
// on-network dot and offers a one-tap Connect; everything else is a quiet
// Reconnect target.

function DeviceRow({
  device,
  active,
  onReconnect,
}: {
  device: KnownDevice
  active: boolean
  onReconnect?: (id: string) => void
}) {
  const meta = active ? 'Connected' : device.onNetwork ? 'On your network' : 'Recent'
  const actionLabel = device.onNetwork ? 'Connect' : 'Reconnect'

  return (
    <li className={styles.device} data-active={active || undefined} data-kind={device.kind}>
      <button
        type="button"
        className={styles.deviceBtn}
        onClick={() => onReconnect?.(device.id)}
        disabled={active}
        aria-label={active ? `Connected to ${device.name}` : `${actionLabel} ${device.name}`}
      >
        <span className={styles.deviceGlyph} aria-hidden="true">
          <DeviceGlyph kind={device.kind} size={18} />
        </span>
        <span className={styles.deviceText}>
          <span className={styles.deviceName}>{device.name}</span>
          <span className={styles.deviceMeta} data-on-network={device.onNetwork || undefined}>
            {(active || device.onNetwork) && (
              <span className={styles.deviceDot} data-active={active || undefined} aria-hidden="true" />
            )}
            {meta}
          </span>
        </span>
        {!active && <span className={styles.deviceAction}>{actionLabel}</span>}
      </button>
    </li>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
// Why this isn't a webpage: a web sync screen is a list with a green "Connected"
// pill and a blue "Pair" button. This is the Walkman-deck idiom instead — a
// recessed status window whose connection LED actually lights (recessed-off →
// green bloom on link, accent breathing while it handshakes, on incandescent
// timing), the linked device's hardware glyph seated inside that lit well, and
// two big tactile hardware pads for Show my code / Scan to connect. Recent
// devices are raised chips on a recessed tray, and a DAW found on your network
// lights its own on-network LED so you reconnect with one tap, no QR. Every
// depth and color is a token, so it reskins through every theme.
//
// Decision (recorded per KIT-LEAD §6): the card lists exactly four states
// (disconnected / connecting / connected-to-phone / connected-to-daw) — no
// failure state, so per YAGNI none is invented here; a failed handshake is the
// Pair screens' job and simply returns the hub to `disconnected`. `connected` +
// `peer.kind` carries the phone-vs-DAW distinction rather than two enum members,
// so one readout serves both contexts.

export function SyncHub({
  status = 'disconnected',
  peer,
  devices,
  size = 'md',
  onShowCode,
  onScan,
  onReconnect,
  onDisconnect,
}: SyncHubProps) {
  const labelId = useId()

  const title =
    status === 'connected'
      ? peer
        ? `Connected to ${peer.name}`
        : 'Connected'
      : status === 'connecting'
        ? peer
          ? `Connecting to ${peer.name}…`
          : 'Connecting…'
        : 'Not connected'

  const caption =
    status === 'disconnected'
      ? 'Show your code or scan to link a device'
      : peer?.kind === 'daw'
        ? 'On your network'
        : status === 'connecting'
          ? 'Pairing…'
          : 'On a different network'

  // The indicator shows the peer's hardware glyph once there's a peer; otherwise
  // the bespoke broadcast mark.
  const glyphSize = size === 'sm' ? 22 : 26
  const showDisconnect = (status === 'connected' || status === 'connecting') && !!onDisconnect

  return (
    <section
      className={styles.root}
      data-status={status}
      data-size={size}
      role="region"
      aria-labelledby={labelId}
    >
      {/* The Walkman-LED status window. */}
      <div className={styles.readout} data-status={status}>
        <span className={styles.indicator} data-status={status} aria-hidden="true">
          {peer ? <DeviceGlyph kind={peer.kind} size={glyphSize} /> : <BroadcastGlyph size={glyphSize} />}
        </span>

        <div className={styles.readoutText}>
          <span
            id={labelId}
            className={styles.statusTitle}
            data-status={status}
            role="status"
            aria-live="polite"
            data-testid="synchub-status"
          >
            {title}
          </span>
          <span className={styles.statusCaption}>{caption}</span>
        </div>

        {showDisconnect && (
          <button
            type="button"
            className={styles.disconnect}
            onClick={onDisconnect}
            aria-label={status === 'connecting' ? 'Cancel connecting' : 'Disconnect'}
          >
            {status === 'connecting' ? 'Cancel' : 'Disconnect'}
          </button>
        )}
      </div>

      {/* Two big tactile actions. */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={onShowCode}
          data-testid="synchub-show-code"
        >
          <span className={styles.actionGlyph} aria-hidden="true">
            <QrCode size={size === 'sm' ? 24 : 28} weight="regular" />
          </span>
          <span className={styles.actionLabel}>Show my code</span>
        </button>

        <button
          type="button"
          className={styles.action}
          onClick={onScan}
          data-testid="synchub-scan"
        >
          <span className={styles.actionGlyph} aria-hidden="true">
            <Scan size={size === 'sm' ? 24 : 28} weight="regular" />
          </span>
          <span className={styles.actionLabel}>Scan to connect</span>
        </button>
      </div>

      {/* Known / recent devices — reconnect without a fresh handshake. */}
      {devices && devices.length > 0 && (
        <div className={styles.devices}>
          <p className={styles.devicesLabel}>Recent devices</p>
          <ul className={styles.well}>
            {devices.map(device => (
              <DeviceRow
                key={device.id}
                device={device}
                active={status === 'connected' && peer?.id === device.id}
                onReconnect={onReconnect}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
