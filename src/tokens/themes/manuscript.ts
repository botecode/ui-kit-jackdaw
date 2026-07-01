import type { ThemeTokens } from '../types'

export const manuscriptTheme: ThemeTokens = {
  "--bg": "#f6f1e7",
  "--surface": "#fffdf8",
  "--surface-2": "#efe8d8",
  "--rail-bg": "#ece4d3",
  "--panel-bg": "#fffdf8",
  "--arrange-bg": "#f3eddf",
  "--strip-bg": "#efe7d6",
  "--strip-mini-timeline": "#e9e0cd",
  "--menu-bg": "#ece4d3",
  "--footer-bg": "#efe8d8",
  "--meter-track-bg": "#e4dac4",
  "--border": "#ddd3bf",
  "--border-strong": "#c2b598",
  "--text": "#2b2620",
  "--text-muted": "#6f6657",
  "--text-dim": "#9a8f7a",
  "--accent": "#356a8c",
  "--accent-contrast": "#ffffff",
  "--accent-green": "#4f7d52",
  "--accent-green-dim": "#bcd4be",
  "--rail-indicator": "#356a8c",
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
