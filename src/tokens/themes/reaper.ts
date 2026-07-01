import type { ThemeTokens } from '../types'

export const reaperTheme: ThemeTokens = {
  "--bg": "#2b2b2b",
  "--surface": "#333333",
  "--surface-2": "#3c3c3c",
  "--rail-bg": "#262626",
  "--panel-bg": "#333333",
  "--arrange-bg": "#2f2f2f",
  "--strip-bg": "#272727",
  "--strip-mini-timeline": "#2e2e2e",
  "--menu-bg": "#2a2a2a",
  "--footer-bg": "#383838",
  "--meter-track-bg": "#3a3a3a",
  "--border": "#454545",
  "--border-strong": "#5c5c5c",
  "--text": "#d0d0d0",
  "--text-muted": "#909090",
  "--text-dim": "#6a6a6a",
  "--accent": "#e74c3c",
  "--accent-contrast": "#ffffff",
  "--accent-green": "#4caf50",
  "--accent-green-dim": "#2e5532",
  "--rail-indicator": "#d0d0d0",
  "--radius": "3px",

  // ── Stage ─────────────────────────────────────────────────────────────────
  "--stage":      "#000000",
  "--stage-2":    "#141411",
  "--stage-text": "#E8E4E0",

  // ── Spectrum ramp ──────────────────────────────────────────────────────────
  "--chroma-red":    "#E74B37",
  "--chroma-orange": "#FA7437",
  "--chroma-yellow": "#F5B213",
  "--chroma-green":  "#46A147",
  "--chroma-teal":   "#4EC1E0",
  "--chroma-blue":   "#3F73B3",
  "--chroma-purple": "#6E4FA2",

  // ── LED palette ────────────────────────────────────────────────────────────
  "--led-red-core":    "#FF9A86",
  "--led-red":         "#E74B37",
  "--led-red-deep":    "#C73A28",
  "--led-orange-core": "#FBA462",
  "--led-orange":      "#FA7437",
  "--led-orange-deep": "#FA6428",
  "--led-yellow-core": "#FCF85D",
  "--led-yellow":      "#FCEF3D",
  "--led-yellow-deep": "#FCEB39",
  "--led-green-core":  "#D4FECB",
  "--led-green":       "#46A147",
  "--led-green-deep":  "#2E7A2F",
  "--led-cyan-core":   "#73E8FA",
  "--led-cyan":        "#71E8FF",
  "--led-cyan-deep":   "#4EDEFA",
  "--led-purple-core": "#B79AE0",
  "--led-purple":      "#6E4FA2",
  "--led-purple-deep": "#512E7C",

  // ── Meter guardrail ────────────────────────────────────────────────────────
  "--meter-safe": "#46A147",
  "--meter-hot":  "#F5B213",
  "--meter-clip": "#E74B37",

  // ── Semantic ───────────────────────────────────────────────────────────────
  "--done":   "#46A147",
  "--danger": "#E74B37",
  "--danger-contrast": "#FFF6F3",   // on-red LED label (fixed lens property, not theme hue)

  // ── Texture ────────────────────────────────────────────────────────────────
  "--texture-paper": "none",
  "--texture-stage": "none",
}
