import type { ThemeTokens } from '../types'

// ── Calm ──────────────────────────────────────────────────────────────────────
// A distraction-free, writerly theme — the reference is Calmly Writer / Ommwriter.
// Where Chroma is warm hardware (recessed wells, LED bloom, black matrix stages),
// Calm is soft paper: low contrast, desaturated, generous, quiet. No glow, no
// console. State is shown by gentle fills and muted colour, never luminance.
//
// Calm is an "aware theme": these tokens set the palette, but the trackhead and
// its primitives also swap to hand-built Calm implementations (see
// theme/themeRegistry.tsx). The two layers together make the instrument feel
// like a calm page rather than a mixing desk.
export const calmTheme: ThemeTokens = {
  // ── Surface hierarchy (soft warm paper) ─────────────────────────────────────
  "--bg":                  "#F3F0E8",   // calm paper
  "--surface":             "#FAF8F2",   // cards lift a touch off the page
  "--surface-2":           "#ECE7DC",   // gently recessed
  "--rail-bg":             "#F0ECE2",
  "--panel-bg":            "#FAF8F2",
  "--arrange-bg":          "#F1EDE4",
  "--strip-bg":            "#EEE9DF",
  "--strip-mini-timeline": "#E7E1D4",
  "--menu-bg":             "#FAF8F2",
  "--footer-bg":           "#EEE9DF",
  "--meter-track-bg":      "#E4DECE",   // meters sit in soft wells, not black

  // ── Borders (hairline, low contrast) ────────────────────────────────────────
  "--border":        "#E2DCCF",
  "--border-strong": "#CFC8B8",

  // ── Typography (soft ink, never pure black) ─────────────────────────────────
  "--text":       "#3B382F",
  "--text-muted": "#79746A",
  "--text-dim":   "#A8A294",

  // ── Accent (muted eucalyptus — a calm, breathing green) ─────────────────────
  "--accent":          "#7C9A8E",
  "--accent-contrast": "#FAF8F2",
  "--accent-green":    "#7C9A7E",
  "--accent-green-dim":"#CDD9C9",

  // ── Rail ────────────────────────────────────────────────────────────────────
  "--rail-indicator": "#7C9A8E",
  "--radius":         "10px",   // soft, rounded

  // ── Stage (kept soft — warm charcoal, never the black matrix) ───────────────
  "--stage":      "#2E2B26",
  "--stage-2":    "#3A372F",
  "--stage-text": "#F3F0E8",

  // ── Spectrum ramp (desaturated, dusty) ──────────────────────────────────────
  "--chroma-red":    "#C57B6B",
  "--chroma-orange": "#D2996B",
  "--chroma-yellow": "#D9C078",
  "--chroma-green":  "#8AA88C",
  "--chroma-teal":   "#7FA9A6",
  "--chroma-blue":   "#7E96AE",
  "--chroma-purple": "#9A8CA8",

  // ── LED palette — muted so even base components read calm under this theme ──
  "--led-red-core":    "#E2A99B",
  "--led-red":         "#C57B6B",
  "--led-red-deep":    "#A65F50",
  "--led-orange-core": "#E6BB91",
  "--led-orange":      "#D2996B",
  "--led-orange-deep": "#B47C52",
  "--led-yellow-core": "#EAD9A0",
  "--led-yellow":      "#D9C078",
  "--led-yellow-deep": "#BBA25C",
  "--led-green-core":  "#C7D8C2",
  "--led-green":       "#8AA88C",
  "--led-green-deep":  "#6B8A6E",
  "--led-cyan-core":   "#BCD6D3",
  "--led-cyan":        "#7FA9A6",
  "--led-cyan-deep":   "#5E8884",
  "--led-purple-core": "#CBBFD4",
  "--led-purple":      "#9A8CA8",
  "--led-purple-deep": "#796C87",

  // ── Meter guardrail (calm heat: sage → dusty amber → muted terracotta) ──────
  "--meter-safe": "#8AA88C",
  "--meter-hot":  "#D9B26A",
  "--meter-clip": "#C57B6B",

  // ── Semantic ─────────────────────────────────────────────────────────────────
  "--done":   "#8AA88C",
  "--danger": "#C57B6B",

  // ── Texture (none — calm is clean paper) ────────────────────────────────────
  "--texture-paper": "none",
  "--texture-stage": "none",
}
