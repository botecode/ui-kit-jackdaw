import type { ThemeTokens } from '../types'

// SVG turbulence noise at low opacity — multiply blended over --bg for paper grain.
// Use as: background-image: var(--texture-paper); background-blend-mode: multiply;
const TEXTURE_PAPER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`

// Subtle scanline — multiply blended over --stage for the black matrix panel feel.
const TEXTURE_STAGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3Crect width='2' height='1' y='1' fill='white' opacity='.04'/%3E%3C/svg%3E")`

// Hologram Chroma Console — warm vintage-hardware cream + espresso ink + hot-orange accent.
// Palette anchored to sampled values from the Hologram Electronics site.
// [exact] = sampled · [derived] = interpolated to complete the ramp
export const chromaTheme: ThemeTokens = {
  // ── Surface hierarchy (light "paper + ink" theme) ──────────────────────────
  "--bg":                  "#FFF7EB",   // warm paper cream [exact]
  "--surface":             "#FBF2E2",   // cards — a hair warmer [derived]
  "--surface-2":           "#E0DCD5",   // recessed light [exact]
  "--rail-bg":             "#F5EFE2",   // track rail — between bg and surface
  "--panel-bg":            "#FBF2E2",   // panel = surface
  "--arrange-bg":          "#F8F3E8",   // arrange canvas
  "--strip-bg":            "#F2ECE0",   // strip column
  "--strip-mini-timeline": "#EDE7D8",   // mini timeline
  "--menu-bg":             "#F8F3E8",   // menus
  "--footer-bg":           "#F2EBD8",   // footer bar
  "--meter-track-bg":      "#0A0A08",   // meters sit in stage wells

  // ── Borders ─────────────────────────────────────────────────────────────────
  "--border":        "#E0DCD5",              // hairline [exact]
  "--border-strong": "rgba(34,40,32,0.70)",  // printed-outline stroke — text at ~70% alpha

  // ── Typography ──────────────────────────────────────────────────────────────
  "--text":       "#222820",   // warm espresso [exact]
  "--text-muted": "#6E6657",   // mid tone [derived]
  "--text-dim":   "#9A9384",   // subtle [derived]

  // ── Accent (CHARACTER button — oranger than chroma-red for distinctness) ────
  "--accent":          "#EE5E2A",   // warm vermilion-orange
  "--accent-contrast": "#FFF7EB",   // cream on accent
  "--accent-green":    "#46A147",   // maps to chroma-green [exact]
  "--accent-green-dim":"#C5E8C4",   // light sage for labels on cream

  // ── Rail ────────────────────────────────────────────────────────────────────
  "--rail-indicator": "#EE5E2A",
  "--radius":         "5px",

  // ── Stage (dark recessed wells — always near-black on this light theme) ─────
  "--stage":      "#0A0A08",   // the black matrix panel [derived from exact #000]
  "--stage-2":    "#161613",   // slight lift [derived]
  "--stage-text": "#FFF7EB",   // cream text on stage

  // ── Spectrum ramp — module color-coding [exact / measured / derived] ─────────
  "--chroma-red":    "#E74B37",   // [exact]
  "--chroma-orange": "#FA7437",   // [measured, lit]
  "--chroma-yellow": "#F5B213",   // [exact]
  "--chroma-green":  "#46A147",   // [exact]
  "--chroma-teal":   "#4EC1E0",   // jewel cyan [exact]
  "--chroma-blue":   "#3F73B3",   // [derived]
  "--chroma-purple": "#6E4FA2",   // [derived] — finalize against the SWELL print swatch

  // ── LED palette — lit states (pedal buttons are real LEDs) ──────────────────
  // Recipe: radial-gradient(circle at 45% 40%, core, body 55%, deep 100%)
  //         + box-shadow of body at ~45% alpha
  //         + near-white specular hotspot top-left
  // Off: hue sunk into --stage well (~15–20% lightness), no glow.
  "--led-red-core":    "#FF9A86",
  "--led-red":         "#E74B37",
  "--led-red-deep":    "#C73A28",

  "--led-orange-core": "#FBA462",   // [exact]
  "--led-orange":      "#FA7437",   // [exact]
  "--led-orange-deep": "#FA6428",   // [exact]

  "--led-yellow-core": "#FCF85D",   // [exact]
  "--led-yellow":      "#FCEF3D",   // [exact]
  "--led-yellow-deep": "#FCEB39",   // [exact]

  "--led-green-core":  "#D4FECB",   // pale bloom [exact]
  "--led-green":       "#46A147",   // [exact]
  "--led-green-deep":  "#2E7A2F",   // [derived]

  "--led-cyan-core":   "#73E8FA",   // [exact]
  "--led-cyan":        "#71E8FF",   // [exact]
  "--led-cyan-deep":   "#4EDEFA",   // [exact]

  "--led-purple-core": "#B79AE0",   // [derived]
  "--led-purple":      "#6E4FA2",   // [derived]
  "--led-purple-deep": "#512E7C",   // [derived]

  // ── Meter guardrail ──────────────────────────────────────────────────────────
  "--meter-safe": "#46A147",
  "--meter-hot":  "#F5B213",   // sampled amber — warn
  "--meter-clip": "#E74B37",   // sampled red — clip

  // ── Semantic ─────────────────────────────────────────────────────────────────
  "--done":   "#46A147",   // chroma-green
  "--danger": "#E74B37",   // chroma-red

  // ── Texture ──────────────────────────────────────────────────────────────────
  "--texture-paper": TEXTURE_PAPER,
  "--texture-stage": TEXTURE_STAGE,
}
