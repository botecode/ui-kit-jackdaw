import type { ThemeTokens } from '../types'

export const goldenHourTheme: ThemeTokens = {
  "--bg": "#1a1016",
  "--surface": "#221520",
  "--surface-2": "#2e1c2a",
  "--rail-bg": "#160d12",
  "--panel-bg": "#221520",
  "--arrange-bg": "#1d1219",
  "--strip-bg": "#150c11",
  "--strip-mini-timeline": "#20141d",
  "--menu-bg": "#180e14",
  "--footer-bg": "#20141d",
  "--meter-track-bg": "#2c1a28",
  "--border": "#3a2434",
  "--border-strong": "#5a3850",
  "--text": "#f0dcc8",
  "--text-muted": "#b08a9a",
  "--text-dim": "#7a5868",
  "--accent": "#ff8a3d",
  "--accent-contrast": "#2a1012",
  "--accent-green": "#d56a9c",
  "--accent-green-dim": "#5a2e44",
  "--rail-indicator": "#ff8a3d",
  "--radius": "8px",

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
