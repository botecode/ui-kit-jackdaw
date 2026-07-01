import type { ThemeTokens } from '../types'

export const gilTheme: ThemeTokens = {
  "--bg": "#241813",
  "--surface": "#2e1f17",
  "--surface-2": "#3a2820",
  "--rail-bg": "#20150f",
  "--panel-bg": "#2e1f17",
  "--arrange-bg": "#281a13",
  "--strip-bg": "#1f140e",
  "--strip-mini-timeline": "#2a1c14",
  "--menu-bg": "#221610",
  "--footer-bg": "#2c1e16",
  "--meter-track-bg": "#38261c",
  "--border": "#45301f",
  "--border-strong": "#5e4230",
  "--text": "#ecd9c4",
  "--text-muted": "#b09478",
  "--text-dim": "#7a6450",
  "--accent": "#c75b39",
  "--accent-contrast": "#ffffff",
  "--accent-green": "#7d8a4f",
  "--accent-green-dim": "#3e4528",
  "--rail-indicator": "#c75b39",
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
