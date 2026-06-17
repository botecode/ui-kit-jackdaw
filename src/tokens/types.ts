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
}

export type ThemeId =
  | "default" | "bowie" | "bubble-gum-pop" | "buckley" | "gil"
  | "golden-hour" | "ink" | "manuscript" | "nocturne" | "pine"
  | "reaper" | "songwriter" | "techno" | "tropicalia";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tokens: ThemeTokens;
}
