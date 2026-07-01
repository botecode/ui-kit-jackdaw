import type { ThemeTokens } from '../types'

export const pineTheme: ThemeTokens = {
  "--bg": "#0d1612",
  "--surface": "#122019",
  "--surface-2": "#18291f",
  "--rail-bg": "#0b130f",
  "--panel-bg": "#122019",
  "--arrange-bg": "#0f1a14",
  "--strip-bg": "#0b130f",
  "--strip-mini-timeline": "#111c16",
  "--menu-bg": "#0c1410",
  "--footer-bg": "#111c16",
  "--meter-track-bg": "#1a2c20",
  "--border": "#1f3327",
  "--border-strong": "#355040",
  "--text": "#d6e4d8",
  "--text-muted": "#88a892",
  "--text-dim": "#5a7564",
  "--accent": "#e08a4a",
  "--accent-contrast": "#11201a",
  "--accent-green": "#4caf72",
  "--accent-green-dim": "#234d33",
  "--rail-indicator": "#e08a4a",
  "--radius": "5px",

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
