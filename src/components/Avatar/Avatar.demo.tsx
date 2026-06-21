// src/components/Avatar/Avatar.demo.tsx

import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { Avatar, AvatarGroup } from './Avatar'
import type { AvatarSize, AvatarStatus } from './Avatar'

export const meta: DemoMeta = {
  name: 'Avatar',
  group: 'Primitives',
  route: '/avatar',
  order: 18,
}

// ── States grid ────────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="Initials md">
        <Avatar name="Alice Johnson" />
      </State>
      <State label="Initials sm">
        <Avatar name="Bob Smith" size="sm" />
      </State>
      <State label="Initials xs">
        <Avatar name="Carol White" size="xs" />
      </State>
      <State label="Online">
        <Avatar name="Eve Chen" status="online" />
      </State>
      <State label="Away">
        <Avatar name="Frank Lee" status="away" />
      </State>
      <State label="Custom color">
        <Avatar name="Grace Kim" color="var(--chroma-teal)" />
      </State>
      <State label="All sizes">
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Avatar name="Quinn Taylor" size="md" />
          <Avatar name="Quinn Taylor" size="sm" />
          <Avatar name="Quinn Taylor" size="xs" />
        </div>
      </State>
      <State label="Status + sizes">
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <Avatar name="Alice Johnson" size="md" status="online" />
          <Avatar name="Bob Smith" size="sm" status="away" />
          <Avatar name="Carol White" size="xs" status="online" />
        </div>
      </State>
      <State label="Group 3+2">
        <AvatarGroup
          avatars={[
            { name: 'Alice Johnson' },
            { name: 'Bob Smith' },
            { name: 'Carol White' },
            { name: 'Dave Martinez' },
            { name: 'Eve Chen' },
          ]}
          max={3}
        />
      </State>
      <State label="Group sm">
        <AvatarGroup
          avatars={[
            { name: 'Alice Johnson' },
            { name: 'Bob Smith' },
            { name: 'Carol White' },
          ]}
          max={5}
          size="sm"
        />
      </State>
      <State label="Group xs 2+1">
        <AvatarGroup
          avatars={[
            { name: 'Alice Johnson' },
            { name: 'Bob Smith' },
            { name: 'Carol White' },
          ]}
          max={2}
          size="xs"
        />
      </State>
      <State label="No overflow">
        <AvatarGroup
          avatars={[
            { name: 'Alice Johnson' },
            { name: 'Bob Smith' },
          ]}
          max={5}
        />
      </State>
    </StatesGrid>
  )
}

// ── Playground ─────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [size, setSize] = useState<AvatarSize>('md')
  const [showStatus, setShowStatus] = useState(false)
  const [status, setStatus] = useState<AvatarStatus>('online')

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Live instance */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Avatar
            name="Quinn Taylor"
            size={size}
            status={showStatus ? status : undefined}
          />
          <AvatarGroup
            avatars={[
              { name: 'Quinn Taylor' },
              { name: 'Alice Johnson' },
              { name: 'Bob Smith' },
              { name: 'Carol White' },
            ]}
            max={3}
            size={size}
          />
        </div>

        {/* Controls — dogfood Toggle for booleans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Toggle
            checked={showStatus}
            onChange={(next) => setShowStatus(next)}
            size="sm"
            label="status dot"
          />
          {showStatus && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              status
              <select
                value={status}
                onChange={e => setStatus(e.target.value as AvatarStatus)}
                style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
              >
                <option value="online">online</option>
                <option value="away">away</option>
              </select>
            </label>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            size
            <select
              value={size}
              onChange={e => setSize(e.target.value as AvatarSize)}
              style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)' }}
            >
              <option value="md">md (36px)</option>
              <option value="sm">sm (28px)</option>
              <option value="xs">xs (20px)</option>
            </select>
          </label>
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function AvatarDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
