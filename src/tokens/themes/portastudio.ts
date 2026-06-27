import type { ThemeTokens } from '../types'

// ── Portastudio ───────────────────────────────────────────────────────────────
// A warm-graphite 4-track cassette deck — the reference is the Tascam Portastudio
// (244 / 414 / 424). Where Chroma is cream paper and Calm is a quiet page, this
// is HARDWARE: a dark warm chassis, putty control surfaces, cream/amber VU wells,
// the iconic Tascam record-red, and an ochre knob-cap accent. Tactile, lit, a
// little lo-fi. Designed to read as "a unit on the desk," not a webpage.
export const portastudioTheme: ThemeTokens = {
  // ── Surface hierarchy (the chassis: warm graphite, putty faces) ─────────────
  "--bg":                  "#2B2825",   // the deck
  "--surface":             "#33302B",   // raised panel
  "--surface-2":           "#3F3A33",   // control face / recessed-light
  "--rail-bg":             "#302C28",   // track rail
  "--panel-bg":            "#33302B",
  "--arrange-bg":          "#2E2A26",   // arrange canvas
  "--strip-bg":            "#37322C",   // channel strip face (putty)
  "--strip-mini-timeline": "#29251F",
  "--menu-bg":             "#33302B",
  "--footer-bg":           "#302C28",
  "--meter-track-bg":      "#19160F",   // VU well — warm near-black

  // ── Borders (machined seams) ────────────────────────────────────────────────
  "--border":        "#47423A",
  "--border-strong": "#5E584E",

  // ── Typography (warm cream on graphite) ─────────────────────────────────────
  "--text":       "#EDE6D5",
  "--text-muted": "#A89E8C",
  "--text-dim":   "#7B7263",

  // ── Accent (ochre knob-cap — the warm Portastudio character) ────────────────
  "--accent":          "#E09A33",
  "--accent-contrast": "#241F18",
  "--accent-green":    "#5FA463",   // the green level LED
  "--accent-green-dim":"#33503455",

  // ── Rail ────────────────────────────────────────────────────────────────────
  "--rail-indicator": "#E09A33",
  "--radius":         "4px",

  // ── Stage (recessed wells — warm near-black) ────────────────────────────────
  "--stage":      "#1A1710",
  "--stage-2":    "#241F16",
  "--stage-text": "#EDE6D5",

  // ── Spectrum ramp (channel colour-coding — vivid, slightly warmed) ──────────
  "--chroma-red":    "#E0492E",
  "--chroma-orange": "#E8852E",
  "--chroma-yellow": "#E8C13A",
  "--chroma-green":  "#5FA463",
  "--chroma-teal":   "#37A0A6",
  "--chroma-blue":   "#3A78B0",
  "--chroma-purple": "#8A6BB0",

  // ── LED palette — lit indicators (core → body → deep) ───────────────────────
  "--led-red-core":    "#FF9A86",
  "--led-red":         "#E0492E",
  "--led-red-deep":    "#B83320",

  "--led-orange-core": "#F6B26B",
  "--led-orange":      "#E8852E",
  "--led-orange-deep": "#C26A1F",

  "--led-yellow-core": "#FCEB7A",
  "--led-yellow":      "#E8C13A",
  "--led-yellow-deep": "#C29E22",

  "--led-green-core":  "#BFF0B8",
  "--led-green":       "#5FA463",
  "--led-green-deep":  "#3E7A41",

  "--led-cyan-core":   "#8FE3E8",
  "--led-cyan":        "#37A0A6",
  "--led-cyan-deep":   "#1F7479",

  "--led-purple-core": "#C3AEE0",
  "--led-purple":      "#8A6BB0",
  "--led-purple-deep": "#5E4788",

  // ── Meter guardrail (VU: green safe → amber hot → red clip) ──────────────────
  "--meter-safe": "#5FA463",
  "--meter-hot":  "#E8C13A",
  "--meter-clip": "#E0492E",

  // ── Semantic ─────────────────────────────────────────────────────────────────
  "--done":   "#5FA463",
  "--danger": "#E0492E",

  // ── Texture (none for v1 — a brushed-panel grain is a follow-up) ────────────
  "--texture-paper": "none",
  "--texture-stage": "none",
}
