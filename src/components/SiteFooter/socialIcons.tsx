// src/components/SiteFooter/socialIcons.tsx
// Bespoke social glyphs as inline SVG. Per the kit's icon rule, Phosphor carries
// the UI set at one weight; brand/social marks live OUTSIDE that set, so they're
// hand-rolled here as single-color paths that ink with `currentColor` — they
// reskin through every theme with the link text, no recolour needed.

import type { ReactElement } from 'react'

export type SocialIconName = 'github' | 'x' | 'youtube' | 'discord'

const ICONS: Record<SocialIconName, ReactElement> = {
  // GitHub octocat silhouette.
  github: (
    <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.52.1.71-.23.71-.5l-.01-1.77c-2.92.63-3.54-1.4-3.54-1.4-.48-1.21-1.17-1.54-1.17-1.54-.95-.65.07-.64.07-.64 1.06.08 1.61 1.09 1.61 1.09.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.07a10 10 0 0 1 5.24 0c2-1.35 2.88-1.07 2.88-1.07.57 1.45.21 2.52.1 2.79.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96l-.01 2.9c0 .28.19.61.72.5A10.5 10.5 0 0 0 12 1.5Z" />
  ),
  // X / Twitter.
  x: (
    <path d="M17.53 3h2.94l-6.43 7.35L21.6 21h-5.92l-4.64-6.07L5.73 21H2.79l6.88-7.86L2.4 3h6.07l4.2 5.55L17.53 3Zm-1.03 16.2h1.63L7.6 4.7H5.85L16.5 19.2Z" />
  ),
  // YouTube play badge.
  youtube: (
    <path d="M23.5 7.2a3 3 0 0 0-2.1-2.12C19.5 4.55 12 4.55 12 4.55s-7.5 0-9.4.53A3 3 0 0 0 .5 7.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.12c1.9.53 9.4.53 9.4.53s7.5 0 9.4-.53a3 3 0 0 0 2.1-2.12c.34-1.58.5-3.18.5-4.8a31.3 31.3 0 0 0-.5-4.8ZM9.6 15.5v-7l6.2 3.5-6.2 3.5Z" />
  ),
  // Discord.
  discord: (
    <path d="M20.32 5.07A18.1 18.1 0 0 0 16 3.74l-.22.4a14 14 0 0 1 3.74 1.7 16 16 0 0 0-13.8-.27c.16-.06.32-.1.49-.13L6 3.74a18 18 0 0 0-4.32 1.33C.93 8.13.32 11.1.5 14.04a18.2 18.2 0 0 0 5.5 2.77l.45-.62a11 11 0 0 1-1.86-.89l.46-.34a12.9 12.9 0 0 0 11.9 0l.46.34c-.6.35-1.22.65-1.86.9l.45.6a18.2 18.2 0 0 0 5.5-2.77c.21-3.4-.76-6.35-2.18-8.96ZM8.52 12.5c-.86 0-1.57-.79-1.57-1.76s.69-1.77 1.57-1.77 1.58.8 1.57 1.77c0 .97-.69 1.76-1.57 1.76Zm6.96 0c-.86 0-1.57-.79-1.57-1.76s.69-1.77 1.57-1.77 1.58.8 1.57 1.77c0 .97-.69 1.76-1.57 1.76Z" />
  ),
}

/** Renders a bespoke social glyph that inks with the surrounding text color. */
export function SocialIcon({ name, size = 18 }: { name: SocialIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
