import type { ThemeTokens } from '../types'

export const tropicaliaTheme: ThemeTokens = {
  "--bg": "#fdf6e3",
  "--surface": "#fffdf6",
  "--surface-2": "#fff3d6",
  "--rail-bg": "#ffe9b8",
  "--panel-bg": "#fffdf6",
  "--arrange-bg": "#fef7e6",
  "--strip-bg": "#fff0cf",
  "--strip-mini-timeline": "#ffe8c0",
  "--menu-bg": "#ffe3a8",
  "--footer-bg": "#fff0cf",
  "--meter-track-bg": "#ffe0b0",
  "--border": "#f0d49a",
  "--border-strong": "#e0a85a",
  "--text": "#2a1a0a",
  "--text-muted": "#7a5a30",
  "--text-dim": "#a07a45",
  "--accent": "#ff4d6d",
  "--accent-contrast": "#2a1a0a",
  "--accent-green": "#2bb673",
  "--accent-green-dim": "#a8e6c4",
  "--rail-indicator": "#ff4d6d",
  "--radius": "12px",

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
