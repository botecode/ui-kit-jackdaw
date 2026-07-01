import type { ThemeTokens } from '../types'

export const inkTheme: ThemeTokens = {
  "--bg": "#0c0c0c",
  "--surface": "#141414",
  "--surface-2": "#1e1e1e",
  "--rail-bg": "#0a0a0a",
  "--panel-bg": "#141414",
  "--arrange-bg": "#101010",
  "--strip-bg": "#0a0a0a",
  "--strip-mini-timeline": "#161616",
  "--menu-bg": "#0c0c0c",
  "--footer-bg": "#161616",
  "--meter-track-bg": "#222222",
  "--border": "#2a2a2a",
  "--border-strong": "#555555",
  "--text": "#fafafa",
  "--text-muted": "#9a9a9a",
  "--text-dim": "#5a5a5a",
  "--accent": "#ff3b30",
  "--accent-contrast": "#ffffff",
  "--accent-green": "#9a9a9a",
  "--accent-green-dim": "#3a3a3a",
  "--rail-indicator": "#fafafa",
  "--radius": "2px",

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
