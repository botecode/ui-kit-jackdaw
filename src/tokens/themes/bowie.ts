import type { ThemeTokens } from '../types'

export const bowieTheme: ThemeTokens = {
  "--bg": "#0b0b0f",
  "--surface": "#141319",
  "--surface-2": "#1f1d28",
  "--rail-bg": "#090910",
  "--panel-bg": "#141319",
  "--arrange-bg": "#100f16",
  "--strip-bg": "#0a0a10",
  "--strip-mini-timeline": "#15141c",
  "--menu-bg": "#0c0c12",
  "--footer-bg": "#16151d",
  "--meter-track-bg": "#1d1b27",
  "--border": "#2a2838",
  "--border-strong": "#3a4a7a",
  "--text": "#f3e9d2",
  "--text-muted": "#a89e8a",
  "--text-dim": "#6c6678",
  "--accent": "#ef2b3d",
  "--accent-contrast": "#ffffff",
  "--accent-green": "#2b6cff",
  "--accent-green-dim": "#1a3360",
  "--rail-indicator": "#ef2b3d",
  "--radius": "4px",

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
