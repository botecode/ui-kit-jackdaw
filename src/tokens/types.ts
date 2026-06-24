// src/tokens/types.ts
// Identical interface to ui/src/theme/tokens.ts in the real app.
// Zero divergence — this is the drop-in compatibility guarantee.

export interface ThemeTokens {
  "--bg": string;
  "--surface": string;
  "--surface-2": string;
  "--rail-bg": string;
  "--panel-bg": string;
  "--arrange-bg": string;
  "--strip-bg": string;
  "--strip-mini-timeline": string;
  "--menu-bg": string;
  "--footer-bg": string;
  "--meter-track-bg": string;
  "--border": string;
  "--border-strong": string;
  "--text": string;
  "--text-muted": string;
  "--text-dim": string;
  "--accent": string;
  "--accent-contrast": string;
  "--accent-green": string;
  "--accent-green-dim": string;
  "--rail-indicator": string;
  "--radius": string;

  // ── Stage (dark recessed wells — meters, dot matrix, waveform lanes) ──
  "--stage": string;
  "--stage-2": string;
  "--stage-text": string;

  // ── Spectrum ramp (module color-coding: DRIVE/SWEETEN/FUZZ/HOWL/SWELL…) ──
  "--chroma-red": string;
  "--chroma-orange": string;
  "--chroma-yellow": string;
  "--chroma-green": string;
  "--chroma-teal": string;
  "--chroma-blue": string;
  "--chroma-purple": string;

  // ── LED palette — lit states (core → body → deep, each hue) ──
  "--led-red-core": string;
  "--led-red": string;
  "--led-red-deep": string;
  "--led-orange-core": string;
  "--led-orange": string;
  "--led-orange-deep": string;
  "--led-yellow-core": string;
  "--led-yellow": string;
  "--led-yellow-deep": string;
  "--led-green-core": string;
  "--led-green": string;
  "--led-green-deep": string;
  "--led-cyan-core": string;
  "--led-cyan": string;
  "--led-cyan-deep": string;
  "--led-purple-core": string;
  "--led-purple": string;
  "--led-purple-deep": string;

  // ── Meter guardrail ──
  "--meter-safe": string;
  "--meter-hot": string;
  "--meter-clip": string;

  // ── Semantic ──
  "--done": string;
  "--danger": string;

  // ── Texture (background-image value; set to `none` to disable) ──
  "--texture-paper": string;
  "--texture-stage": string;
}

export type ThemeId =
  | "chroma"
  | "default" | "bowie" | "bubble-gum-pop" | "buckley" | "gil"
  | "golden-hour" | "ink" | "manuscript" | "nocturne" | "pine"
  | "reaper" | "songwriter" | "techno" | "tropicalia" | "calm";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tokens: ThemeTokens;
}
