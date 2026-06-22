// src/components/ProductFrame/ProductFrame.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { BrandMark } from '../BrandMark'
import { ProductFrame } from './ProductFrame'

export const meta: DemoMeta = {
  name: 'ProductFrame',
  group: 'Composites',
  route: '/product-frame',
  order: 110,
}

// ── Stand-in screenshots ────────────────────────────────────────────────────
// Real product shots are fixed pixels (the frame is themed, the shot is not), so
// these mocks deliberately use literal colours — they stand in for a PNG the site
// would pass via `src`. Encoded as data-URI SVGs so the demo has a real, non-
// broken image to wrap without shipping a binary asset.

function dataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const DESKTOP_SHOT = dataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#1c1a17"/>
  <rect width="640" height="40" fill="#26231f"/>
  <circle cx="24" cy="20" r="5" fill="#e8a87c"/>
  <rect x="40" y="14" width="120" height="12" rx="3" fill="#3a352f"/>
  <rect x="0" y="40" width="150" height="360" fill="#222019"/>
  <rect x="16" y="64" width="118" height="48" rx="6" fill="#2c2922"/>
  <rect x="16" y="120" width="118" height="48" rx="6" fill="#2c2922"/>
  <rect x="16" y="176" width="118" height="48" rx="6" fill="#2c2922"/>
  <rect x="170" y="72" width="440" height="34" rx="5" fill="#e8a87c" opacity="0.85"/>
  <rect x="170" y="128" width="360" height="34" rx="5" fill="#7ec8a4" opacity="0.85"/>
  <rect x="170" y="184" width="280" height="34" rx="5" fill="#7eb8d4" opacity="0.85"/>
  <rect x="170" y="240" width="400" height="34" rx="5" fill="#c4a0e4" opacity="0.85"/>
  <rect x="0" y="360" width="640" height="40" fill="#26231f"/>
  <circle cx="320" cy="380" r="10" fill="#7ec8a4"/>
</svg>`)

const PHONE_SHOT = dataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 270 570">
  <rect width="270" height="570" fill="#1c1a17"/>
  <rect x="0" y="0" width="270" height="64" fill="#26231f"/>
  <rect x="20" y="26" width="120" height="14" rx="4" fill="#3a352f"/>
  <rect x="20" y="96" width="230" height="44" rx="8" fill="#e8a87c" opacity="0.85"/>
  <rect x="20" y="156" width="230" height="44" rx="8" fill="#7ec8a4" opacity="0.85"/>
  <rect x="20" y="216" width="230" height="44" rx="8" fill="#7eb8d4" opacity="0.85"/>
  <rect x="20" y="276" width="230" height="44" rx="8" fill="#c4a0e4" opacity="0.85"/>
  <circle cx="135" cy="500" r="28" fill="#e47a7a"/>
</svg>`)

function StatesDemo() {
  return (
    <StatesGrid>
      <State label="default (desktop)">
        <div style={{ width: 360 }}>
          <ProductFrame variant="desktop" src={DESKTOP_SHOT} alt="Jackdaw arrangement view" />
        </div>
      </State>

      <State label="default (phone)">
        <ProductFrame variant="phone" src={PHONE_SHOT} alt="Jackdaw on mobile" />
      </State>

      <State label="with caption">
        <div style={{ width: 360 }}>
          <ProductFrame
            variant="desktop"
            src={DESKTOP_SHOT}
            alt="Jackdaw arrangement view"
            caption="The writing surface. Lyrics, chords, takes, all in one place."
          />
        </div>
      </State>

      <State label="hover lift (hover me)">
        <div style={{ width: 360 }}>
          <ProductFrame variant="desktop" src={DESKTOP_SHOT} alt="Jackdaw arrangement view" hoverLift />
        </div>
      </State>

      <State label="sheen off">
        <div style={{ width: 360 }}>
          <ProductFrame variant="desktop" src={DESKTOP_SHOT} alt="Jackdaw arrangement view" sheen={false} />
        </div>
      </State>

      <State label="live content slot (children)">
        <div style={{ width: 360 }}>
          <ProductFrame variant="desktop" caption="Wrap a real kit surface, not just a PNG.">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <BrandMark variant="lockup" size={44} />
            </div>
          </ProductFrame>
        </div>
      </State>

      <State label="empty (screen-off, no shot)">
        <div style={{ width: 360 }}>
          <ProductFrame variant="desktop" />
        </div>
      </State>

      <State label="small (scales fluidly)">
        <div style={{ width: 200 }}>
          <ProductFrame variant="desktop" src={DESKTOP_SHOT} alt="Jackdaw arrangement view" />
        </div>
      </State>
    </StatesGrid>
  )
}

function PlaygroundDemo() {
  const [phone, setPhone] = useState(false)
  const [hoverLift, setHoverLift] = useState(true)
  const [sheen, setSheen] = useState(true)
  const [withCaption, setWithCaption] = useState(true)

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: phone ? 'auto' : 360 }}>
          <ProductFrame
            variant={phone ? 'phone' : 'desktop'}
            src={phone ? PHONE_SHOT : DESKTOP_SHOT}
            alt="Jackdaw"
            hoverLift={hoverLift}
            sheen={sheen}
            caption={withCaption ? 'Made by someone who would rather be writing songs.' : undefined}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', minWidth: 160 }}>
          <Toggle checked={phone} onChange={setPhone} size="sm" label="phone variant" />
          <Toggle checked={hoverLift} onChange={setHoverLift} size="sm" label="hover lift" />
          <Toggle checked={sheen} onChange={setSheen} size="sm" label="glass sheen" />
          <Toggle checked={withCaption} onChange={setWithCaption} size="sm" label="caption" />
        </div>
      </div>
    </Playground>
  )
}

export default function ProductFrameDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
