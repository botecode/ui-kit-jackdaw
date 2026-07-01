import type { ThemeTokens } from '../types'

export const nocturneTheme: ThemeTokens = {
  "--bg": "#0a0e1a",
  "--surface": "#0f1424",
  "--surface-2": "#161d33",
  "--rail-bg": "#080b15",
  "--panel-bg": "#0f1424",
  "--arrange-bg": "#0c1120",
  "--strip-bg": "#080b15",
  "--strip-mini-timeline": "#11172a",
  "--menu-bg": "#0a0e1c",
  "--footer-bg": "#11162a",
  "--meter-track-bg": "#1a2238",
  "--border": "#20284a",
  "--border-strong": "#36437a",
  "--text": "#cdd5ee",
  "--text-muted": "#7e88b0",
  "--text-dim": "#525a80",
  "--accent": "#8a7dff",
  "--accent-contrast": "#0a0e1a",
  "--accent-green": "#4a9e8f",
  "--accent-green-dim": "#244a44",
  "--rail-indicator": "#8a7dff",
  "--radius": "6px",

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
