# Phase 1: Scaffold + Foundations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `ui-jackdaw` Vite + React + TS repo with a complete token system (14 themes), ThemeProvider, three-layer motion system, gallery shell (sidebar + stage + compare mode), and two live pages (Tokens + Design Language) — the verified foundation for all component work.

**Architecture:** Token system splits into theme-identity tokens (color + radius, per-theme) and structural tokens (spacing, type, motion, elevation — global `:root` defaults, per-theme overridable via cascade). Gallery shell uses hash routing with no router dep; demo files are auto-discovered via `import.meta.glob`; sidebar chrome is pinned to the default theme while the stage is theme-switchable.

**Tech Stack:** Vite 6, React 19, TypeScript 5 (strict), CSS Modules, Vitest 2 + @testing-library/react.

## Global Constraints

- Zero runtime dependencies beyond `react`, `react-dom` — no animation libs, no router, no component libs.
- All component stylesheets: CSS Modules (`.module.css`) referencing only CSS custom properties — no hardcoded colours, sizes, or durations.
- `ThemeTokens` interface in `src/tokens/types.ts` must be identical to the real app's `ui/src/theme/tokens.ts` — zero divergence.
- Fonts are self-hosted in `public/fonts/` — no CDN imports anywhere.
- `tsconfig.json`: `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`.
- Spring `useSpring(target)` — `target` must be in pixels; epsilon `0.01` is calibrated for pixel values.
- `data-theme` selector overrides structural tokens only; colour/radius live in the theme object.
- `prefers-reduced-motion`: zeroes decorative durations; functional motion (playhead, meters) kept running.

---

## File Map

```
ui-jackdaw/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── public/fonts/
│   ├── CabinetGrotesk-Variable.woff2
│   ├── GeneralSans-Variable.woff2
│   ├── SpaceMono-Regular.woff2
│   └── SpaceMono-Bold.woff2
└── src/
    ├── main.tsx
    ├── test-setup.ts
    ├── tokens/
    │   ├── types.ts                    # ThemeTokens interface + ThemeId + ThemeMeta
    │   ├── themes/
    │   │   ├── index.ts                # THEMES registry
    │   │   ├── default.ts … ink.ts     # 14 theme maps (colour + radius)
    │   ├── global.css                  # structural tokens + @font-face + prefers-reduced-motion
    │   └── reset.css                   # box-sizing, zero margins, line-height 1.5
    ├── theme/
    │   └── ThemeProvider.tsx           # inline CSS vars + data-theme; ThemeContext
    ├── motion/
    │   └── spring.ts                   # useSpring — critically-damped, symplectic Euler
    ├── components/
    │   └── .gitkeep
    └── gallery/
        ├── App.tsx + App.module.css    # grid layout; ThemeContext provider
        ├── Sidebar.tsx + .module.css   # nav from glob + planned list; fixed default theme
        ├── Stage.tsx + .module.css     # route → page; compare mode
        ├── useHashRoute.ts             # 10-line hash hook
        ├── registry.ts                 # import.meta.glob auto-discovery
        ├── planned.ts                  # static planned-but-not-built list
        ├── pages/
        │   ├── Tokens.tsx + .module.css          # 7-section visual token reference
        │   └── DesignLanguage.tsx + .module.css  # 7 design rules
        └── ui/
            ├── ThemeSwitcher.tsx + .module.css   # native <select> for Phase 1
            ├── DemoShell.tsx + .module.css        # demo wrapper (meta header + body)
            ├── StatesGrid.tsx + .module.css       # 9-state grid
            └── Playground.tsx + .module.css       # prop controls container
```

---

### Task 1: Repo init + Vite scaffold + Vitest

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/test-setup.ts`

**Interfaces:**
- Produces: `npm run dev` starts dev server; `npm run test` runs Vitest; `npm run build` type-checks and bundles.

- [ ] **Step 1: Initialise git**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw
git init
```

- [ ] **Step 2: Scaffold Vite project**

```bash
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, choose to ignore/keep them (the reference files `types.ts`, `schema.json`, `MARKETING.md` stay).

- [ ] **Step 3: Install deps + add Vitest**

```bash
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 4: Replace `vite.config.ts`**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bridge': resolve(__dirname, 'types.ts'),
      '@tokens': resolve(__dirname, 'src/tokens'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 5: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@bridge": ["./types.ts"],
      "@tokens/*": ["./src/tokens/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Write `src/test-setup.ts`**

```ts
// src/test-setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Jackdaw UI Kit</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Write minimal `src/main.tsx`** (will be replaced in Task 6)

```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <p style={{ color: 'white', padding: '2rem', fontFamily: 'sans-serif' }}>
      Jackdaw UI Kit — scaffold OK
    </p>
  </React.StrictMode>
)
```

- [ ] **Step 9: Delete Vite boilerplate**

```bash
rm -rf src/assets src/App.tsx src/App.css src/index.css
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite starts on `http://localhost:5173`, page shows "Jackdaw UI Kit — scaffold OK".

- [ ] **Step 11: Verify Vitest runs**

```bash
npm run test
```

Expected: "No test files found" — that's fine, no tests yet.

- [ ] **Step 12: Create `components/.gitkeep` and add `.gitignore`**

```bash
mkdir -p src/components && touch src/components/.gitkeep
```

Add to `.gitignore` (append to whatever Vite generated):
```
*.local
.DS_Store
```

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS repo with Vitest"
```

---

### Task 2: Token types + all 14 theme maps

**Files:**
- Create: `src/tokens/types.ts`, `src/tokens/themes/index.ts`, `src/tokens/themes/default.ts` … `src/tokens/themes/tropicalia.ts` (14 files)

**Interfaces:**
- Produces: `ThemeTokens` (interface), `ThemeId` (union), `ThemeMeta` (interface), `THEMES` (ThemeMeta[]), named exports for each theme (`defaultTheme`, `bowieTheme`, …)
- Consumed by: ThemeProvider (Task 4), Tokens page (Task 10)

- [ ] **Step 1: Write `src/tokens/types.ts`**

```ts
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
```

- [ ] **Step 2: Write `src/tokens/themes/default.ts`**

```ts
// src/tokens/themes/default.ts
import type { ThemeTokens } from '../types'

export const defaultTheme: ThemeTokens = {
  "--bg": "#0a0a0a",
  "--surface": "#101014",
  "--surface-2": "#1e1e26",
  "--rail-bg": "#0d0d10",
  "--panel-bg": "#101014",
  "--arrange-bg": "#16161a",
  "--strip-bg": "#0c0c10",
  "--strip-mini-timeline": "#13131a",
  "--menu-bg": "#141416",
  "--footer-bg": "#18181c",
  "--meter-track-bg": "#1c1c22",
  "--border": "#1e1e26",
  "--border-strong": "#3a3a48",
  "--text": "#e5e5e5",
  "--text-muted": "#8080a0",
  "--text-dim": "#52526a",
  "--accent": "#E24B4A",
  "--accent-contrast": "#fff",
  "--accent-green": "#1D9E75",
  "--accent-green-dim": "#274d38",
  "--rail-indicator": "#e5e5e5",
  "--radius": "6px",
}
```

- [ ] **Step 3: Write remaining 13 theme files**

Write each file in `src/tokens/themes/` with the exact values below. Each file follows the same pattern as `default.ts` — import `ThemeTokens`, export a named const.

**`bowie.ts`** — `bowieTheme`:
```ts
import type { ThemeTokens } from '../types'
export const bowieTheme: ThemeTokens = {
  "--bg": "#0b0b0f", "--surface": "#141319", "--surface-2": "#1f1d28",
  "--rail-bg": "#090910", "--panel-bg": "#141319", "--arrange-bg": "#100f16",
  "--strip-bg": "#0a0a10", "--strip-mini-timeline": "#15141c",
  "--menu-bg": "#0c0c12", "--footer-bg": "#16151d", "--meter-track-bg": "#1d1b27",
  "--border": "#2a2838", "--border-strong": "#3a4a7a",
  "--text": "#f3e9d2", "--text-muted": "#a89e8a", "--text-dim": "#6c6678",
  "--accent": "#ef2b3d", "--accent-contrast": "#ffffff",
  "--accent-green": "#2b6cff", "--accent-green-dim": "#1a3360",
  "--rail-indicator": "#ef2b3d", "--radius": "4px",
}
```

**`bubble-gum-pop.ts`** — `bubbleGumPopTheme`:
```ts
import type { ThemeTokens } from '../types'
export const bubbleGumPopTheme: ThemeTokens = {
  "--bg": "#fdf0f8", "--surface": "#fff8fc", "--surface-2": "#fceaf5",
  "--rail-bg": "#fbd6ef", "--panel-bg": "#fff4fa", "--arrange-bg": "#fef0fa",
  "--strip-bg": "#fce4f0", "--strip-mini-timeline": "#fdd7eb",
  "--menu-bg": "#f9c8e8", "--footer-bg": "#fbd1eb", "--meter-track-bg": "#f7bce2",
  "--border": "#f0aad8", "--border-strong": "#e070b8",
  "--text": "#3a0828", "--text-muted": "#9e5580", "--text-dim": "#c490b0",
  "--accent": "#e84da0", "--accent-contrast": "#fff",
  "--accent-green": "#2ecc71", "--accent-green-dim": "#a8f0cc",
  "--rail-indicator": "#e84da0", "--radius": "10px",
}
```

**`buckley.ts`** — `buckleyTheme`:
```ts
import type { ThemeTokens } from '../types'
export const buckleyTheme: ThemeTokens = {
  "--bg": "#0e1419", "--surface": "#141c22", "--surface-2": "#1c2730",
  "--rail-bg": "#0c1116", "--panel-bg": "#141c22", "--arrange-bg": "#111921",
  "--strip-bg": "#0c1116", "--strip-mini-timeline": "#131b22",
  "--menu-bg": "#0e141a", "--footer-bg": "#16202a", "--meter-track-bg": "#1e2a34",
  "--border": "#25323c", "--border-strong": "#3a4d5a",
  "--text": "#d8e0e4", "--text-muted": "#7d8f99", "--text-dim": "#566570",
  "--accent": "#7fa9c2", "--accent-contrast": "#0e1419",
  "--accent-green": "#5f8f86", "--accent-green-dim": "#2c4742",
  "--rail-indicator": "#7fa9c2", "--radius": "6px",
}
```

**`gil.ts`** — `gilTheme`:
```ts
import type { ThemeTokens } from '../types'
export const gilTheme: ThemeTokens = {
  "--bg": "#241813", "--surface": "#2e1f17", "--surface-2": "#3a2820",
  "--rail-bg": "#20150f", "--panel-bg": "#2e1f17", "--arrange-bg": "#281a13",
  "--strip-bg": "#1f140e", "--strip-mini-timeline": "#2a1c14",
  "--menu-bg": "#221610", "--footer-bg": "#2c1e16", "--meter-track-bg": "#38261c",
  "--border": "#45301f", "--border-strong": "#5e4230",
  "--text": "#ecd9c4", "--text-muted": "#b09478", "--text-dim": "#7a6450",
  "--accent": "#c75b39", "--accent-contrast": "#ffffff",
  "--accent-green": "#7d8a4f", "--accent-green-dim": "#3e4528",
  "--rail-indicator": "#c75b39", "--radius": "5px",
}
```

**`golden-hour.ts`** — `goldenHourTheme`:
```ts
import type { ThemeTokens } from '../types'
export const goldenHourTheme: ThemeTokens = {
  "--bg": "#1a1016", "--surface": "#221520", "--surface-2": "#2e1c2a",
  "--rail-bg": "#160d12", "--panel-bg": "#221520", "--arrange-bg": "#1d1219",
  "--strip-bg": "#150c11", "--strip-mini-timeline": "#20141d",
  "--menu-bg": "#180e14", "--footer-bg": "#20141d", "--meter-track-bg": "#2c1a28",
  "--border": "#3a2434", "--border-strong": "#5a3850",
  "--text": "#f0dcc8", "--text-muted": "#b08a9a", "--text-dim": "#7a5868",
  "--accent": "#ff8a3d", "--accent-contrast": "#2a1012",
  "--accent-green": "#d56a9c", "--accent-green-dim": "#5a2e44",
  "--rail-indicator": "#ff8a3d", "--radius": "8px",
}
```

**`ink.ts`** — `inkTheme`:
```ts
import type { ThemeTokens } from '../types'
export const inkTheme: ThemeTokens = {
  "--bg": "#0c0c0c", "--surface": "#141414", "--surface-2": "#1e1e1e",
  "--rail-bg": "#0a0a0a", "--panel-bg": "#141414", "--arrange-bg": "#101010",
  "--strip-bg": "#0a0a0a", "--strip-mini-timeline": "#161616",
  "--menu-bg": "#0c0c0c", "--footer-bg": "#161616", "--meter-track-bg": "#222222",
  "--border": "#2a2a2a", "--border-strong": "#555555",
  "--text": "#fafafa", "--text-muted": "#9a9a9a", "--text-dim": "#5a5a5a",
  "--accent": "#ff3b30", "--accent-contrast": "#ffffff",
  "--accent-green": "#9a9a9a", "--accent-green-dim": "#3a3a3a",
  "--rail-indicator": "#fafafa", "--radius": "2px",
}
```

**`manuscript.ts`** — `manuscriptTheme`:
```ts
import type { ThemeTokens } from '../types'
export const manuscriptTheme: ThemeTokens = {
  "--bg": "#f6f1e7", "--surface": "#fffdf8", "--surface-2": "#efe8d8",
  "--rail-bg": "#ece4d3", "--panel-bg": "#fffdf8", "--arrange-bg": "#f3eddf",
  "--strip-bg": "#efe7d6", "--strip-mini-timeline": "#e9e0cd",
  "--menu-bg": "#ece4d3", "--footer-bg": "#efe8d8", "--meter-track-bg": "#e4dac4",
  "--border": "#ddd3bf", "--border-strong": "#c2b598",
  "--text": "#2b2620", "--text-muted": "#6f6657", "--text-dim": "#9a8f7a",
  "--accent": "#356a8c", "--accent-contrast": "#ffffff",
  "--accent-green": "#4f7d52", "--accent-green-dim": "#bcd4be",
  "--rail-indicator": "#356a8c", "--radius": "4px",
}
```

**`nocturne.ts`** — `nocturneTheme`:
```ts
import type { ThemeTokens } from '../types'
export const nocturneTheme: ThemeTokens = {
  "--bg": "#0a0e1a", "--surface": "#0f1424", "--surface-2": "#161d33",
  "--rail-bg": "#080b15", "--panel-bg": "#0f1424", "--arrange-bg": "#0c1120",
  "--strip-bg": "#080b15", "--strip-mini-timeline": "#11172a",
  "--menu-bg": "#0a0e1c", "--footer-bg": "#11162a", "--meter-track-bg": "#1a2238",
  "--border": "#20284a", "--border-strong": "#36437a",
  "--text": "#cdd5ee", "--text-muted": "#7e88b0", "--text-dim": "#525a80",
  "--accent": "#8a7dff", "--accent-contrast": "#0a0e1a",
  "--accent-green": "#4a9e8f", "--accent-green-dim": "#244a44",
  "--rail-indicator": "#8a7dff", "--radius": "6px",
}
```

**`pine.ts`** — `pineTheme`:
```ts
import type { ThemeTokens } from '../types'
export const pineTheme: ThemeTokens = {
  "--bg": "#0d1612", "--surface": "#122019", "--surface-2": "#18291f",
  "--rail-bg": "#0b130f", "--panel-bg": "#122019", "--arrange-bg": "#0f1a14",
  "--strip-bg": "#0b130f", "--strip-mini-timeline": "#111c16",
  "--menu-bg": "#0c1410", "--footer-bg": "#111c16", "--meter-track-bg": "#1a2c20",
  "--border": "#1f3327", "--border-strong": "#355040",
  "--text": "#d6e4d8", "--text-muted": "#88a892", "--text-dim": "#5a7564",
  "--accent": "#e08a4a", "--accent-contrast": "#11201a",
  "--accent-green": "#4caf72", "--accent-green-dim": "#234d33",
  "--rail-indicator": "#e08a4a", "--radius": "5px",
}
```

**`reaper.ts`** — `reaperTheme`:
```ts
import type { ThemeTokens } from '../types'
export const reaperTheme: ThemeTokens = {
  "--bg": "#2b2b2b", "--surface": "#333333", "--surface-2": "#3c3c3c",
  "--rail-bg": "#262626", "--panel-bg": "#333333", "--arrange-bg": "#2f2f2f",
  "--strip-bg": "#272727", "--strip-mini-timeline": "#2e2e2e",
  "--menu-bg": "#2a2a2a", "--footer-bg": "#383838", "--meter-track-bg": "#3a3a3a",
  "--border": "#454545", "--border-strong": "#5c5c5c",
  "--text": "#d0d0d0", "--text-muted": "#909090", "--text-dim": "#6a6a6a",
  "--accent": "#e74c3c", "--accent-contrast": "#ffffff",
  "--accent-green": "#4caf50", "--accent-green-dim": "#2e5532",
  "--rail-indicator": "#d0d0d0", "--radius": "3px",
}
```

**`songwriter.ts`** — `songwriterTheme`:
```ts
import type { ThemeTokens } from '../types'
export const songwriterTheme: ThemeTokens = {
  "--bg": "#1a1410", "--surface": "#211c16", "--surface-2": "#2e2620",
  "--rail-bg": "#191510", "--panel-bg": "#201b15", "--arrange-bg": "#1d1812",
  "--strip-bg": "#161210", "--strip-mini-timeline": "#1a1510",
  "--menu-bg": "#181410", "--footer-bg": "#1c1812", "--meter-track-bg": "#242018",
  "--border": "#3a3020", "--border-strong": "#5a4a30",
  "--text": "#e8dfc8", "--text-muted": "#9a8a6a", "--text-dim": "#6a5a40",
  "--accent": "#d48c3a", "--accent-contrast": "#1a1410",
  "--accent-green": "#5a9e6a", "--accent-green-dim": "#2a3e2a",
  "--rail-indicator": "#d48c3a", "--radius": "4px",
}
```

**`techno.ts`** — `technoTheme`:
```ts
import type { ThemeTokens } from '../types'
export const technoTheme: ThemeTokens = {
  "--bg": "#000000", "--surface": "#050508", "--surface-2": "#0d0d14",
  "--rail-bg": "#03030a", "--panel-bg": "#050508", "--arrange-bg": "#070710",
  "--strip-bg": "#030308", "--strip-mini-timeline": "#08080f",
  "--menu-bg": "#020205", "--footer-bg": "#060610", "--meter-track-bg": "#0c0c18",
  "--border": "#1a1a2e", "--border-strong": "#3333ff44",
  "--text": "#c8c8ff", "--text-muted": "#5555aa", "--text-dim": "#333366",
  "--accent": "#6666ff", "--accent-contrast": "#fff",
  "--accent-green": "#00ff88", "--accent-green-dim": "#003322",
  "--rail-indicator": "#6666ff", "--radius": "2px",
}
```

**`tropicalia.ts`** — `tropicaliaTheme`:
```ts
import type { ThemeTokens } from '../types'
export const tropicaliaTheme: ThemeTokens = {
  "--bg": "#fdf6e3", "--surface": "#fffdf6", "--surface-2": "#fff3d6",
  "--rail-bg": "#ffe9b8", "--panel-bg": "#fffdf6", "--arrange-bg": "#fef7e6",
  "--strip-bg": "#fff0cf", "--strip-mini-timeline": "#ffe8c0",
  "--menu-bg": "#ffe3a8", "--footer-bg": "#fff0cf", "--meter-track-bg": "#ffe0b0",
  "--border": "#f0d49a", "--border-strong": "#e0a85a",
  "--text": "#2a1a0a", "--text-muted": "#7a5a30", "--text-dim": "#a07a45",
  "--accent": "#ff4d6d", "--accent-contrast": "#2a1a0a",
  "--accent-green": "#2bb673", "--accent-green-dim": "#a8e6c4",
  "--rail-indicator": "#ff4d6d", "--radius": "12px",
}
```

- [ ] **Step 4: Write `src/tokens/themes/index.ts`**

```ts
// src/tokens/themes/index.ts
import type { ThemeMeta } from '../types'
import { defaultTheme } from './default'
import { bowieTheme } from './bowie'
import { bubbleGumPopTheme } from './bubble-gum-pop'
import { buckleyTheme } from './buckley'
import { gilTheme } from './gil'
import { goldenHourTheme } from './golden-hour'
import { inkTheme } from './ink'
import { manuscriptTheme } from './manuscript'
import { nocturneTheme } from './nocturne'
import { pineTheme } from './pine'
import { reaperTheme } from './reaper'
import { songwriterTheme } from './songwriter'
import { technoTheme } from './techno'
import { tropicaliaTheme } from './tropicalia'

export {
  defaultTheme, bowieTheme, bubbleGumPopTheme, buckleyTheme, gilTheme,
  goldenHourTheme, inkTheme, manuscriptTheme, nocturneTheme, pineTheme,
  reaperTheme, songwriterTheme, technoTheme, tropicaliaTheme,
}

export const THEMES: ThemeMeta[] = [
  { id: 'default',        name: 'Default',        tokens: defaultTheme },
  { id: 'bowie',          name: 'Bowie',          tokens: bowieTheme },
  { id: 'bubble-gum-pop', name: 'Bubble Gum Pop', tokens: bubbleGumPopTheme },
  { id: 'buckley',        name: 'Buckley',        tokens: buckleyTheme },
  { id: 'gil',            name: 'Gil',            tokens: gilTheme },
  { id: 'golden-hour',    name: 'Golden Hour',    tokens: goldenHourTheme },
  { id: 'ink',            name: 'Ink',            tokens: inkTheme },
  { id: 'manuscript',     name: 'Manuscript',     tokens: manuscriptTheme },
  { id: 'nocturne',       name: 'Nocturne',       tokens: nocturneTheme },
  { id: 'pine',           name: 'Pine',           tokens: pineTheme },
  { id: 'reaper',         name: 'Reaper',         tokens: reaperTheme },
  { id: 'songwriter',     name: 'Songwriter',     tokens: songwriterTheme },
  { id: 'techno',         name: 'Techno',         tokens: technoTheme },
  { id: 'tropicalia',     name: 'Tropicália',     tokens: tropicaliaTheme },
]
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors. Any error here means a theme file is missing a required key from `ThemeTokens`.

- [ ] **Step 6: Commit**

```bash
git add src/tokens/
git commit -m "feat: add token types and all 14 theme maps"
```

---

### Task 3: CSS foundations — reset, global tokens, fonts

**Files:**
- Create: `src/tokens/reset.css`, `src/tokens/global.css`, `public/fonts/` (4 font files)

**Interfaces:**
- Produces: global CSS custom properties (structural tokens) available to all components; fonts loaded.
- Consumed by: every component CSS module via `var(--token-name)`.

- [ ] **Step 1: Download fonts**

Download and place in `public/fonts/`:
- **Cabinet Grotesk** (variable, woff2) from Fontshare — search "cabinet grotesk fontshare download". Save as `CabinetGrotesk-Variable.woff2`.
- **General Sans** (variable, woff2) from Fontshare — search "general sans fontshare download". Save as `GeneralSans-Variable.woff2`.
- **Space Mono Regular** (woff2) from Google Fonts — search "space mono google fonts download". Save as `SpaceMono-Regular.woff2`.
- **Space Mono Bold** (woff2) from same download. Save as `SpaceMono-Bold.woff2`.

```bash
ls public/fonts/
# Expected: CabinetGrotesk-Variable.woff2  GeneralSans-Variable.woff2  SpaceMono-Bold.woff2  SpaceMono-Regular.woff2
```

- [ ] **Step 2: Write `src/tokens/reset.css`**

```css
/* src/tokens/reset.css */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body { line-height: 1.5; }
img, svg { display: block; max-width: 100%; }
button { cursor: pointer; background: none; border: none; }
a { color: inherit; }
```

- [ ] **Step 3: Write `src/tokens/global.css`**

```css
/* src/tokens/global.css */

/* ─── Self-hosted fonts (variable fonts need axis range or font-weight tokens no-op) ─ */
@font-face {
  font-family: "Cabinet Grotesk";
  src: url("/fonts/CabinetGrotesk-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "General Sans";
  src: url("/fonts/GeneralSans-Variable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "Space Mono";
  src: url("/fonts/SpaceMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Space Mono";
  src: url("/fonts/SpaceMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}

:root {
  /* ─── Type roles ─── */
  --font-display: "Cabinet Grotesk", system-ui, sans-serif;
  --font-ui:      "General Sans", system-ui, sans-serif;
  --font-mono:    "Space Mono", ui-monospace, monospace;

  /* ─── Type scale ─── */
  --text-xs:      10px;
  --text-sm:      11px;
  --text-base:    13px;
  --text-md:      15px;
  --text-lg:      18px;
  --text-display: 24px;

  --leading-xs:      1.2;
  --leading-sm:      1.3;
  --leading-base:    1.5;
  --leading-md:      1.4;
  --leading-lg:      1.3;
  --leading-display: 1.1;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-bold:   600;

  /* ─── Spacing (4px grid) ─── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;

  /* ─── Motion (decorative layer — zeroed by prefers-reduced-motion) ─── */
  --dur-fast:    80ms;
  --dur-base:    120ms;
  --dur-slow:    200ms;
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ─── Elevation ─── */
  --shadow-sm: 0 1px 3px  hsl(0 0% 0% / 0.4);
  --shadow-md: 0 4px 12px hsl(0 0% 0% / 0.5);
  --shadow-lg: 0 8px 24px hsl(0 0% 0% / 0.6);

  /* ─── Track colour palette (cyclic spine assignment) ─── */
  --track-color-1: #e8a87c;
  --track-color-2: #7ec8a4;
  --track-color-3: #7eb8d4;
  --track-color-4: #c4a0e4;
  --track-color-5: #e4c84a;
  --track-color-6: #e47a7a;
}

/*
  Per-theme structural overrides — cascade escape hatch.
  RULE: data-theme overrides structural tokens ONLY (spacing, type, motion).
  Colour and radius belong in the theme's ThemeTokens object, never here.
  Inline style from ThemeProvider has highest specificity, so colour/radius
  overrides via [data-theme] selectors are silently ignored — change them
  in the theme object instead.

  Examples (not yet active):
    [data-theme="manuscript"] { --font-ui: "Lora", Georgia, serif; }
    [data-theme="ink"]        { --font-ui: var(--font-mono); }
*/

/* Functional motion (playhead, meters) is kept. Decorative durations are zeroed. */
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast:  0ms;
    --dur-base:  0ms;
    --dur-slow:  0ms;
  }
}
```

- [ ] **Step 4: Import both CSS files in `src/main.tsx`**

```tsx
// src/main.tsx
import './tokens/reset.css'
import './tokens/global.css'
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <p style={{ color: 'white', padding: '2rem', fontFamily: 'var(--font-display)' }}>
      Jackdaw UI Kit — fonts loading
    </p>
  </React.StrictMode>
)
```

- [ ] **Step 5: Verify fonts load in browser**

```bash
npm run dev
```

Open browser. The text "Jackdaw UI Kit — fonts loading" should render in Cabinet Grotesk (it will look noticeably different from system-ui). Open DevTools → Network → filter by "font" — all four `.woff2` files should return 200.

- [ ] **Step 6: Commit**

```bash
git add src/tokens/reset.css src/tokens/global.css src/main.tsx public/fonts/
git commit -m "feat: add CSS reset, structural token globals, and self-hosted fonts"
```

---

### Task 4: ThemeProvider + ThemeContext

**Files:**
- Create: `src/theme/ThemeProvider.tsx`, `src/theme/ThemeProvider.test.tsx`

**Interfaces:**
- Produces: `ThemeProvider({ theme, children })`, `ThemeContext`, `useTheme()` hook
- Consumed by: `App.tsx` (wraps sidebar + stage), `ThemeSwitcher.tsx`, `Tokens.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/theme/ThemeProvider.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { createContext, useContext } from 'react'

describe('ThemeProvider', () => {
  it('renders children', () => {
    const { getByText } = render(
      <ThemeProvider theme="default"><span>hello</span></ThemeProvider>
    )
    expect(getByText('hello')).toBeDefined()
  })

  it('sets data-theme attribute', () => {
    const { container } = render(
      <ThemeProvider theme="bowie"><span /></ThemeProvider>
    )
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe('bowie')
  })

  it('applies --bg as inline style for default theme', () => {
    const { container } = render(
      <ThemeProvider theme="default"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--bg')).toBe('#0a0a0a')
  })

  it('applies --accent for bowie theme', () => {
    const { container } = render(
      <ThemeProvider theme="bowie"><span /></ThemeProvider>
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.getPropertyValue('--accent')).toBe('#ef2b3d')
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test -- ThemeProvider
```

Expected: FAIL — `ThemeProvider` not found.

- [ ] **Step 3: Write `src/theme/ThemeProvider.tsx`**

```tsx
// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo, useState } from 'react'
import type { ThemeId } from '../tokens/types'
import { THEMES } from '../tokens/themes'
import { defaultTheme } from '../tokens/themes/default'

interface ThemeCtx {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

// ThemeContext is provided at App level (above both ThemeProvider wrappers).
// Sidebar reads setTheme for the switcher. Tokens page reads theme for value display.
export const ThemeContext = createContext<ThemeCtx>({
  theme: 'default',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface Props {
  theme: ThemeId
  children: React.ReactNode
}

export function ThemeProvider({ theme, children }: Props) {
  // Inline CSS vars = highest specificity source.
  // RULE: [data-theme] overrides in global.css affect structural tokens only.
  // Colour and radius are changed in the theme object — not via [data-theme] selectors.
  const tokens = THEMES.find(t => t.id === theme)?.tokens ?? defaultTheme
  return (
    <div data-theme={theme} style={tokens as React.CSSProperties}>
      {children}
    </div>
  )
}

// Convenience wrapper that owns the theme state and provides context.
// Use this at the App root. Use bare ThemeProvider for nested/compare usage.
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(
    () => (localStorage.getItem('jd-gallery-theme') as ThemeId | null) ?? 'default'
  )
  const ctx = useMemo<ThemeCtx>(() => ({
    theme,
    setTheme: (t) => {
      setTheme(t)
      localStorage.setItem('jd-gallery-theme', t)
    },
  }), [theme])
  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test -- ThemeProvider
```

Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/theme/
git commit -m "feat: add ThemeProvider with context and localStorage persistence"
```

---

### Task 5: Spring hook

**Files:**
- Create: `src/motion/spring.ts`, `src/motion/spring.test.ts`

**Interfaces:**
- Produces: `useSpring(target: number, config?: { stiffness?: number; damping?: number }): number`
- Consumed by: any component needing settle-with-weight animation (clip snap, knob detent, resize divider)

- [ ] **Step 1: Write the failing tests**

```ts
// src/motion/spring.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSpring } from './spring'

function mockMatchMedia(reducedMotion: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList))
}

describe('useSpring', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('initialises at the target value', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useSpring(200))
    expect(result.current).toBe(200)
  })

  it('snaps immediately to target under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useSpring(150))
    expect(result.current).toBe(150)
  })

  it('snaps when target changes under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { result, rerender } = renderHook(({ t }) => useSpring(t), {
      initialProps: { t: 0 },
    })
    rerender({ t: 300 })
    expect(result.current).toBe(300)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm run test -- spring
```

Expected: FAIL — `useSpring` not found.

- [ ] **Step 3: Write `src/motion/spring.ts`**

```ts
// src/motion/spring.ts
import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Config {
  stiffness?: number
  damping?: number
}

// Critically-damped spring using symplectic (semi-implicit) Euler integration.
// Default: stiffness 200, damping 30 → ζ ≈ 1.06 (just past critical: zero overshoot).
// Heavier settle (resize divider): { stiffness: 120, damping: 22 } → ζ ≈ 1.0.
//
// UNIT CONTRACT: target must be in PIXELS. The settle epsilon (0.01) is calibrated
// for pixel values and will cause ~1% early settle on a normalised 0–1 input.
// If you need to spring a normalised value, scale to pixels first, then convert back.
//
// Brand rule: weight ≠ bounce. Tune for firm, authoritative settle. Never increase
// stiffness to the point of overshoot — that's the tell of a toy.
export function useSpring(target: number, { stiffness = 200, damping = 30 }: Config = {}) {
  const [value, setValue] = useState(target)
  const state = useRef({ pos: target, vel: 0 })
  const rafId = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      cancelAnimationFrame(rafId.current)
      setValue(target)
      state.current = { pos: target, vel: 0 }
      return
    }

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30) // cap at 30fps minimum
      last = now

      // Symplectic Euler: update velocity first, then position with new velocity.
      // More stable than explicit Euler — no energy gain on large dt.
      const force = stiffness * (target - state.current.pos) - damping * state.current.vel
      state.current.vel += force * dt
      state.current.pos += state.current.vel * dt

      const settled =
        Math.abs(target - state.current.pos) < 0.01 &&
        Math.abs(state.current.vel) < 0.01

      if (settled) {
        setValue(target)
        state.current = { pos: target, vel: 0 }
        return // loop ends; no cancelAnimationFrame needed
      }

      setValue(state.current.pos)
      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [target, stiffness, damping])

  return value
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm run test -- spring
```

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/motion/
git commit -m "feat: add critically-damped spring hook with symplectic Euler"
```

---

### Task 6: Gallery scaffold — hash router, registry, App shell, ThemeSwitcher

**Files:**
- Create: `src/gallery/useHashRoute.ts`, `src/gallery/registry.ts`, `src/gallery/planned.ts`, `src/gallery/App.tsx`, `src/gallery/App.module.css`, `src/gallery/ui/ThemeSwitcher.tsx`, `src/gallery/ui/ThemeSwitcher.module.css`
- Modify: `src/main.tsx`
- Create: `src/gallery/useHashRoute.test.ts`

**Interfaces:**
- Produces: `useHashRoute(): string`, `DEMOS`, `DEMO_MAP`, `PLANNED`, `App` (root component), `ThemeSwitcher`
- Consumed by: `Sidebar`, `Stage`

- [ ] **Step 1: Write failing tests for `useHashRoute`**

```ts
// src/gallery/useHashRoute.test.ts
import { describe, it, expect, beforeEach, act } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHashRoute } from './useHashRoute'

describe('useHashRoute', () => {
  beforeEach(() => { window.location.hash = '' })

  it('returns /tokens when hash is empty', () => {
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('/tokens')
  })

  it('returns the path after #', () => {
    window.location.hash = '#/fader'
    const { result } = renderHook(() => useHashRoute())
    expect(result.current).toBe('/fader')
  })

  it('updates on hashchange', () => {
    const { result } = renderHook(() => useHashRoute())
    act(() => {
      window.location.hash = '#/pan-knob'
      window.dispatchEvent(new Event('hashchange'))
    })
    expect(result.current).toBe('/pan-knob')
  })
})
```

- [ ] **Step 2: Run — verify fail**

```bash
npm run test -- useHashRoute
```

- [ ] **Step 3: Write `src/gallery/useHashRoute.ts`**

```ts
// src/gallery/useHashRoute.ts
import { useEffect, useState } from 'react'

export function useHashRoute(): string {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/tokens')
  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/tokens')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return path
}
```

- [ ] **Step 4: Run — verify pass**

```bash
npm run test -- useHashRoute
```

Expected: 3 passing.

- [ ] **Step 5: Write `src/gallery/registry.ts`**

```ts
// src/gallery/registry.ts
import type { ComponentType } from 'react'

export interface DemoMeta {
  name: string
  group: 'Foundations' | 'Primitives' | 'Composites'
  route: string
  order: number
}

interface DemoModule {
  meta: DemoMeta
  default: ComponentType
}

// Auto-discovers all *.demo.tsx files under components/.
// Adding a demo file is all it takes for a component to appear in the gallery.
const modules = import.meta.glob('../components/**/*.demo.tsx', { eager: true })

export const DEMOS = Object.values(modules) as DemoModule[]

export const DEMO_MAP: Record<string, ComponentType> = Object.fromEntries(
  DEMOS.map(d => [d.meta.route, d.default])
)
```

- [ ] **Step 6: Write `src/gallery/planned.ts`**

```ts
// src/gallery/planned.ts
import type { DemoMeta } from './registry'

// Items planned but not yet built. Rendered as dimmed non-links in the sidebar.
// Remove an item here when its .demo.tsx file lands — it will auto-appear via glob.
export const PLANNED: Array<Pick<DemoMeta, 'name' | 'group' | 'route'>> = [
  { name: 'Fader',                    group: 'Primitives',  route: '/fader' },
  { name: 'PanKnob',                  group: 'Primitives',  route: '/pan-knob' },
  { name: 'Meter',                    group: 'Primitives',  route: '/meter' },
  { name: 'MuteSoloToggle',           group: 'Primitives',  route: '/mute-solo' },
  { name: 'ArmButton',                group: 'Primitives',  route: '/arm-button' },
  { name: 'TransportBar',             group: 'Primitives',  route: '/transport' },
  { name: 'Clip',                     group: 'Primitives',  route: '/clip' },
  { name: 'TimelineRuler',            group: 'Primitives',  route: '/timeline-ruler' },
  { name: 'InputSelect',              group: 'Primitives',  route: '/input-select' },
  { name: 'FXChip',                   group: 'Primitives',  route: '/fx-chip' },
  { name: 'ContextMenu',              group: 'Primitives',  route: '/context-menu' },
  { name: 'Dialog',                   group: 'Primitives',  route: '/dialog' },
  { name: 'Tooltip',                  group: 'Primitives',  route: '/tooltip' },
  { name: 'Toggle',                   group: 'Primitives',  route: '/toggle' },
  { name: 'Badge',                    group: 'Primitives',  route: '/badge' },
  { name: 'TrackHeader',              group: 'Composites',  route: '/track-header' },
  { name: 'FolderTrackHeader',        group: 'Composites',  route: '/folder-track-header' },
  { name: 'TrackLane',                group: 'Composites',  route: '/track-lane' },
  { name: 'FocusedTrackDetailPanel',  group: 'Composites',  route: '/focus-panel' },
  { name: 'ThemeSwitcher',            group: 'Composites',  route: '/theme-switcher' },
  { name: 'ProjectPicker',            group: 'Composites',  route: '/project-picker' },
]
```

- [ ] **Step 7: Write `src/gallery/ui/ThemeSwitcher.tsx`**

```tsx
// src/gallery/ui/ThemeSwitcher.tsx
// Phase 1: native <select>. Replaced by the bespoke Dropdown component in Phase 2.
import { THEMES } from '../../tokens/themes'
import { useTheme } from '../../theme/ThemeProvider'
import type { ThemeId } from '../../tokens/types'
import styles from './ThemeSwitcher.module.css'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <select
      className={styles.select}
      value={theme}
      onChange={e => setTheme(e.target.value as ThemeId)}
      aria-label="Switch theme"
    >
      {THEMES.map(t => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 8: Write `src/gallery/ui/ThemeSwitcher.module.css`**

```css
/* src/gallery/ui/ThemeSwitcher.module.css */
.select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  cursor: pointer;
  appearance: none;
}
.select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

- [ ] **Step 9: Write `src/gallery/App.tsx`**

```tsx
// src/gallery/App.tsx
import { ThemeRoot } from '../theme/ThemeProvider'
import { ThemeProvider } from '../theme/ThemeProvider'
import { useTheme } from '../theme/ThemeProvider'
import { Sidebar } from './Sidebar'
import { Stage } from './Stage'
import styles from './App.module.css'

function Layout() {
  const { theme } = useTheme()
  return (
    <div className={styles.layout}>
      {/* Sidebar: always pinned to default theme — stable neutral chrome */}
      <ThemeProvider theme="default">
        <Sidebar />
      </ThemeProvider>
      {/* Stage: switches with the active theme — the themed canvas */}
      <ThemeProvider theme={theme}>
        <Stage />
      </ThemeProvider>
    </div>
  )
}

export function App() {
  return (
    <ThemeRoot>
      <Layout />
    </ThemeRoot>
  )
}
```

- [ ] **Step 10: Write `src/gallery/App.module.css`**

```css
/* src/gallery/App.module.css */
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  height: 100vh;
  overflow: hidden;
}

/* ThemeProvider divs are the grid items. If height/overflow don't flow through,
   add display: contents to the ThemeProvider wrapper div. */
.layout > div {
  height: 100%;
  overflow: hidden;
}
```

- [ ] **Step 11: Update `src/main.tsx`**

```tsx
// src/main.tsx
import './tokens/reset.css'
import './tokens/global.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './gallery/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

Note: `Sidebar` and `Stage` don't exist yet — the app will fail to compile until Tasks 7–8. Add temporary stubs in step 12.

- [ ] **Step 12: Add temporary stubs for Sidebar and Stage**

```tsx
// src/gallery/Sidebar.tsx (temporary stub)
export function Sidebar() {
  return <aside style={{ background: 'var(--rail-bg)', height: '100%', color: 'var(--text)', padding: '16px', fontFamily: 'var(--font-ui)' }}>Sidebar</aside>
}
```

```tsx
// src/gallery/Stage.tsx (temporary stub)
export function Stage() {
  return <main style={{ background: 'var(--arrange-bg)', height: '100%', color: 'var(--text)', padding: '16px', fontFamily: 'var(--font-ui)' }}>Stage</main>
}
```

- [ ] **Step 13: Verify in browser**

```bash
npm run dev
```

Open browser. Should see a two-column layout: dark left sidebar, slightly lighter stage. ThemeSwitcher in sidebar changes the stage colour. Theme should persist after page reload.

- [ ] **Step 14: Commit**

```bash
git add src/gallery/ src/main.tsx
git commit -m "feat: add gallery scaffold — hash routing, App shell, ThemeSwitcher"
```

---

### Task 7: Sidebar

**Files:**
- Create: `src/gallery/Sidebar.tsx`, `src/gallery/Sidebar.module.css`

**Interfaces:**
- Consumes: `useHashRoute()`, `DEMOS`, `PLANNED`, `ThemeSwitcher`, `useTheme`
- Produces: nav with Foundations (hardcoded) + Primitives/Composites (from glob + planned)

- [ ] **Step 1: Write `src/gallery/Sidebar.tsx`**

```tsx
// src/gallery/Sidebar.tsx
import { useMemo } from 'react'
import { DEMOS, type DemoMeta } from './registry'
import { PLANNED } from './planned'
import { ThemeSwitcher } from './ui/ThemeSwitcher'
import { useHashRoute } from './useHashRoute'
import styles from './Sidebar.module.css'

type Group = 'Foundations' | 'Primitives' | 'Composites'
const GROUPS: Group[] = ['Foundations', 'Primitives', 'Composites']

const FOUNDATION_LINKS = [
  { name: 'Tokens',          route: '/tokens' },
  { name: 'Design Language', route: '/design-language' },
]

export function Sidebar() {
  const route = useHashRoute()

  const liveByGroup = useMemo(() => {
    const map: Record<Group, DemoMeta[]> = { Foundations: [], Primitives: [], Composites: [] }
    for (const d of DEMOS) map[d.meta.group].push(d.meta)
    return map
  }, [])

  const plannedByGroup = useMemo(() => {
    const map: Record<Group, typeof PLANNED> = { Foundations: [], Primitives: [], Composites: [] }
    for (const p of PLANNED) map[p.group].push(p)
    return map
  }, [])

  return (
    <nav className={styles.sidebar} aria-label="Component navigation">
      <div className={styles.header}>
        <span className={styles.wordmark}>JACKDAW</span>
        <ThemeSwitcher />
      </div>
      <div className={styles.nav}>
        {GROUPS.map(group => {
          const foundations = group === 'Foundations' ? FOUNDATION_LINKS : []
          const live = liveByGroup[group]
            .slice()
            .sort((a, b) => a.order - b.order)
          const planned = plannedByGroup[group]
          if (foundations.length + live.length + planned.length === 0) return null

          return (
            <div key={group} className={styles.group}>
              <div className={styles.groupLabel}>{group}</div>
              {[...foundations, ...live].map(item => (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  className={route === item.route ? styles.navLinkActive : styles.navLink}
                >
                  {item.name}
                </a>
              ))}
              {planned.map(p => (
                <span key={p.route} className={styles.navPlanned} aria-disabled="true">
                  {p.name}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Write `src/gallery/Sidebar.module.css`**

```css
/* src/gallery/Sidebar.module.css */
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--rail-bg);
  border-right: 1px solid var(--border);
}

.header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.wordmark {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
  letter-spacing: 0.06em;
  color: var(--text);
}

.nav {
  flex: 1;
  padding: var(--space-2) 0;
  overflow-y: auto;
}

.group {
  margin-bottom: var(--space-4);
}

.groupLabel {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.navLink {
  display: block;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color var(--dur-fast) var(--ease-out);
}

.navLink:hover {
  color: var(--text);
}

.navLinkActive {
  composes: navLink;
  color: var(--text);
  border-left-color: var(--accent);
}

.navPlanned {
  display: block;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  opacity: 0.35;
  border-left: 2px solid transparent;
  pointer-events: none;
  user-select: none;
}
```

- [ ] **Step 3: Replace stub Sidebar in `src/gallery/Sidebar.tsx`** — the file above IS the replacement (no stub remains).

- [ ] **Step 4: Verify in browser**

`npm run dev` → sidebar shows "JACKDAW" wordmark, ThemeSwitcher, Foundations section with "Tokens" and "Design Language" links, and long lists of dimmed planned items under Primitives and Composites. Clicking a Foundations link changes the URL hash.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/Sidebar.tsx src/gallery/Sidebar.module.css
git commit -m "feat: add gallery sidebar with nav groups and planned item dimming"
```

---

### Task 8: Stage + compare mode

**Files:**
- Create: `src/gallery/Stage.tsx`, `src/gallery/Stage.module.css`

**Interfaces:**
- Consumes: `useHashRoute()`, `DEMO_MAP`, `ThemeProvider`, `useTheme()`
- Produces: route-to-page rendering; compare mode tiling 5 themes

- [ ] **Step 1: Write `src/gallery/Stage.tsx`**

```tsx
// src/gallery/Stage.tsx
import type { ComponentType } from 'react'
import { useState } from 'react'
import { DEMO_MAP } from './registry'
import { useHashRoute } from './useHashRoute'
import { ThemeProvider } from '../theme/ThemeProvider'
import { useTheme } from '../theme/ThemeProvider'
import type { ThemeId } from '../tokens/types'
import styles from './Stage.module.css'

// Lazy imports to avoid circular dependency — pages import useTheme from ThemeProvider,
// not from App. Tokens and DesignLanguage are imported after their tasks are done.
// Stubs used until Tasks 10–11 complete.
function TokensStub() {
  return <div className={styles.stub}>Tokens page — Task 10</div>
}
function DesignLanguageStub() {
  return <div className={styles.stub}>Design Language page — Task 11</div>
}

const COMPARE_THEMES: ThemeId[] = ['default', 'bowie', 'tropicalia', 'manuscript', 'ink']

export function Stage() {
  const route = useHashRoute()
  const { theme } = useTheme()
  const [compareMode, setCompareMode] = useState(false)

  const PAGE_MAP: Record<string, ComponentType> = {
    '/tokens': TokensStub,
    '/design-language': DesignLanguageStub,
    ...DEMO_MAP,
  }

  const Page = PAGE_MAP[route] ?? (() => (
    <div className={styles.stub}>No page for route: {route}</div>
  ))

  return (
    <div className={styles.stage}>
      <header className={styles.header}>
        <button
          className={styles.compareBtn}
          onClick={() => setCompareMode(m => !m)}
        >
          {compareMode ? 'Exit compare' : 'Compare themes'}
        </button>
        {compareMode && (
          <span className={styles.compareHint}>
            {COMPARE_THEMES.join(' · ')}
          </span>
        )}
      </header>

      {compareMode ? (
        <div className={styles.compareGrid}>
          {COMPARE_THEMES.map(t => (
            <div key={t} className={styles.compareCell}>
              <ThemeProvider theme={t}>
                <div className={styles.compareCellInner}>
                  <div className={styles.compareLabel}>{t}</div>
                  <Page />
                </div>
              </ThemeProvider>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.content}>
          <Page />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/gallery/Stage.module.css`**

```css
/* src/gallery/Stage.module.css */
.stage {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--arrange-bg);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.compareBtn {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  transition: color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}

.compareBtn:hover {
  color: var(--text);
  border-color: var(--border-strong);
}

.compareHint {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
}

.content {
  flex: 1;
  overflow-y: auto;
}

.compareGrid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  overflow: hidden;
}

.compareCell {
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.compareCell:last-child {
  border-right: none;
}

.compareCellInner {
  min-height: 100%;
}

.compareLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.stub {
  padding: var(--space-6);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text-muted);
}
```

- [ ] **Step 3: Replace stub Stage — the file above IS the replacement.**

- [ ] **Step 4: Verify in browser**

`npm run dev` → stage renders "Tokens page — Task 10" stub. "Compare themes" button tiles the stub across 5 themes. Tropicália cell should be noticeably light; others dark.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/Stage.tsx src/gallery/Stage.module.css
git commit -m "feat: add gallery stage with hash routing and 5-theme compare mode"
```

---

### Task 9: Gallery utilities — DemoShell, StatesGrid, Playground

**Files:**
- Create: `src/gallery/ui/DemoShell.tsx`, `src/gallery/ui/DemoShell.module.css`, `src/gallery/ui/StatesGrid.tsx`, `src/gallery/ui/StatesGrid.module.css`, `src/gallery/ui/Playground.tsx`, `src/gallery/ui/Playground.module.css`

**Interfaces:**
- Produces: `DemoShell({ meta, children })`, `StatesGrid({ children })`, `State({ label, children })`, `Playground({ children })`
- Consumed by: every `.demo.tsx` file in `components/`

- [ ] **Step 1: Write `src/gallery/ui/DemoShell.tsx`**

```tsx
// src/gallery/ui/DemoShell.tsx
import type { DemoMeta } from '../registry'
import styles from './DemoShell.module.css'

interface Props {
  meta: DemoMeta
  children: React.ReactNode
}

export function DemoShell({ meta, children }: Props) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{meta.name}</h1>
          <span className={styles.group}>{meta.group}</span>
        </div>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/gallery/ui/DemoShell.module.css`**

```css
/* src/gallery/ui/DemoShell.module.css */
.shell {
  min-height: 100%;
  background: var(--arrange-bg);
}

.header {
  padding: var(--space-6) var(--space-8) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.titleRow {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

.title {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--text);
  line-height: var(--leading-display);
}

.group {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.body {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}
```

- [ ] **Step 3: Write `src/gallery/ui/StatesGrid.tsx`**

```tsx
// src/gallery/ui/StatesGrid.tsx
import styles from './StatesGrid.module.css'

// The 9 required states for every component. All must be present for DoD.
export const REQUIRED_STATES = [
  'default', 'hover', 'focus', 'active', 'disabled',
  'selected', 'error', 'empty', 'loading',
] as const

export type StateLabel = typeof REQUIRED_STATES[number]

export function State({ label, children }: { label: StateLabel; children: React.ReactNode }) {
  return (
    <div className={styles.stateCell}>
      <span className={styles.stateLabel}>{label}</span>
      <div className={styles.stateContent}>{children}</div>
    </div>
  )
}

export function StatesGrid({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>States</h2>
      <div className={styles.grid}>{children}</div>
    </section>
  )
}
```

- [ ] **Step 4: Write `src/gallery/ui/StatesGrid.module.css`**

```css
/* src/gallery/ui/StatesGrid.module.css */
.section {}

.heading {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-4);
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.stateCell {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 100px;
}

.stateLabel {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  letter-spacing: 0.05em;
}

.stateContent {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  min-height: 60px;
}
```

- [ ] **Step 5: Write `src/gallery/ui/Playground.tsx`**

```tsx
// src/gallery/ui/Playground.tsx
import styles from './Playground.module.css'

export function Playground({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Playground</h2>
      <div className={styles.controls}>{children}</div>
    </section>
  )
}
```

- [ ] **Step 6: Write `src/gallery/ui/Playground.module.css`**

```css
/* src/gallery/ui/Playground.module.css */
.section {}

.heading {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-4);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/gallery/ui/
git commit -m "feat: add DemoShell, StatesGrid, and Playground gallery utilities"
```

---

### Task 10: Tokens page

**Files:**
- Create: `src/gallery/pages/Tokens.tsx`, `src/gallery/pages/Tokens.module.css`
- Modify: `src/gallery/Stage.tsx` (replace stub import with real page)

**Interfaces:**
- Consumes: `useTheme()`, `THEMES`, `ThemeTokens`
- Produces: `Tokens` component — 7-section visual reference, live on theme switch

- [ ] **Step 1: Write `src/gallery/pages/Tokens.tsx`**

```tsx
// src/gallery/pages/Tokens.tsx
import { useState } from 'react'
import { useTheme } from '../../theme/ThemeProvider'
import { THEMES } from '../../tokens/themes'
import type { ThemeTokens } from '../../tokens/types'
import styles from './Tokens.module.css'

const COLOR_TOKENS: Array<{ key: keyof ThemeTokens; label: string }> = [
  { key: '--bg',                label: 'Page background' },
  { key: '--surface',           label: 'Elevated surface' },
  { key: '--surface-2',         label: 'Doubly elevated' },
  { key: '--rail-bg',           label: 'Rail' },
  { key: '--panel-bg',          label: 'Panel' },
  { key: '--arrange-bg',        label: 'Arrange area' },
  { key: '--strip-bg',          label: 'Recording strip' },
  { key: '--strip-mini-timeline', label: 'Strip mini-timeline' },
  { key: '--menu-bg',           label: 'Menu bar' },
  { key: '--footer-bg',         label: 'Footer bar' },
  { key: '--meter-track-bg',    label: 'Meter track' },
  { key: '--border',            label: 'Border' },
  { key: '--border-strong',     label: 'Border strong' },
  { key: '--text',              label: 'Primary text' },
  { key: '--text-muted',        label: 'Muted text' },
  { key: '--text-dim',          label: 'Dim text' },
  { key: '--accent',            label: 'Accent' },
  { key: '--accent-contrast',   label: 'On accent' },
  { key: '--accent-green',      label: 'Accent green' },
  { key: '--accent-green-dim',  label: 'Accent green dim' },
  { key: '--rail-indicator',    label: 'Rail indicator' },
]

const TEXT_SIZES: Array<{ token: string; label: string }> = [
  { token: '--text-xs',      label: 'xs — 10px — meter labels' },
  { token: '--text-sm',      label: 'sm — 11px — secondary' },
  { token: '--text-base',    label: 'base — 13px — body' },
  { token: '--text-md',      label: 'md — 15px' },
  { token: '--text-lg',      label: 'lg — 18px — headings' },
  { token: '--text-display', label: 'display — 24px — title' },
]

const SPACE_TOKENS = [
  '--space-1', '--space-2', '--space-3', '--space-4',
  '--space-5', '--space-6', '--space-8', '--space-10', '--space-12',
]

const TRACK_COLORS = [
  '--track-color-1', '--track-color-2', '--track-color-3',
  '--track-color-4', '--track-color-5', '--track-color-6',
]

const MOTION_TOKENS: Array<{ token: string; label: string }> = [
  { token: '--dur-fast',    label: 'fast — 80ms' },
  { token: '--dur-base',    label: 'base — 120ms' },
  { token: '--dur-slow',    label: 'slow — 200ms' },
]

const EASING_TOKENS: Array<{ token: string; label: string }> = [
  { token: '--ease-out',    label: 'ease-out' },
  { token: '--ease-in-out', label: 'ease-in-out' },
]

export function Tokens() {
  const { theme } = useTheme()
  const themeObj = THEMES.find(t => t.id === theme)?.tokens
  const [activeMotion, setActiveMotion] = useState<string | null>(null)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const toggle = (token: string) =>
    setActiveMotion(prev => prev === token ? null : token)

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Tokens</h1>

      {/* 1 — Colour */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Colour</h2>
        <div className={styles.swatchGrid}>
          {COLOR_TOKENS.map(({ key, label }) => (
            <div key={key} className={styles.swatch}>
              <div
                className={styles.swatchChip}
                style={{ background: `var(${key})`, borderRadius: 'var(--radius)' }}
              />
              <div className={styles.swatchInfo}>
                <span className={styles.swatchToken}>{key}</span>
                <span className={styles.swatchLabel}>{label}</span>
                <span className={styles.swatchValue}>
                  {themeObj?.[key as keyof ThemeTokens] ?? ''}
                </span>
              </div>
            </div>
          ))}
        </div>

        <h3 className={styles.subTitle}>Readability</h3>
        <div className={styles.readabilityRow}>
          <div className={styles.readabilitySample} style={{ background: 'var(--bg)' }}>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --text on --bg
            </span>
          </div>
          <div className={styles.readabilitySample} style={{ background: 'var(--surface)' }}>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --text on --surface
            </span>
          </div>
          <div className={styles.readabilitySample} style={{ background: 'var(--accent)' }}>
            <span style={{ color: 'var(--accent-contrast)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)' }}>
              --accent-contrast on --accent
            </span>
          </div>
        </div>
      </section>

      {/* 2 — Type scale */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Type scale</h2>
        {TEXT_SIZES.map(({ token, label }) => (
          <div key={token} className={styles.typeRow}>
            <span className={styles.typeLabel}>{label}</span>
            <div className={styles.typeSamples}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: `var(${token})`, fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                Cabinet Grotesk
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: `var(${token})`, fontWeight: 'var(--weight-normal)', color: 'var(--text)' }}>
                General Sans
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: `var(${token})`, fontWeight: 'var(--weight-normal)', color: 'var(--text)' }}>
                1234 –6.0 dB
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* 3 — Spacing */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Spacing</h2>
        <div className={styles.spacingScale}>
          {SPACE_TOKENS.map(token => (
            <div key={token} className={styles.spacingRow}>
              <span className={styles.spacingToken}>{token}</span>
              <div
                className={styles.spacingBar}
                style={{ width: `var(${token})` }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Radius */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Radius</h2>
        <p className={styles.meta}>
          Current: <code className={styles.code}>{themeObj?.['--radius'] ?? ''}</code>
        </p>
        <div className={styles.radiusRow}>
          {['--surface', '--surface-2', '--accent'].map(bg => (
            <div
              key={bg}
              className={styles.radiusBox}
              style={{ background: `var(${bg})`, borderRadius: 'var(--radius)' }}
            />
          ))}
        </div>
      </section>

      {/* 5 — Elevation */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Elevation</h2>
        <div className={styles.elevationRow}>
          {(['--shadow-sm', '--shadow-md', '--shadow-lg'] as const).map(token => (
            <div
              key={token}
              className={styles.elevationBox}
              style={{ boxShadow: `var(${token})` }}
            >
              <span>{token}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6 — Motion */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Motion</h2>
        {reducedMotion && (
          <div className={styles.reducedBadge}>
            prefers-reduced-motion: active — decorative durations zeroed
          </div>
        )}
        <h3 className={styles.subTitle}>Durations (click to animate)</h3>
        <div className={styles.motionList}>
          {MOTION_TOKENS.map(({ token, label }) => (
            <div key={token} className={styles.motionRow}>
              <span className={styles.motionLabel}>{label}</span>
              <button
                className={styles.motionDemo}
                data-active={activeMotion === token}
                style={{ transitionDuration: `var(${token})`, transitionTimingFunction: 'var(--ease-out)' }}
                onClick={() => toggle(token)}
                aria-label={`Demo ${label}`}
              />
            </div>
          ))}
        </div>
        <h3 className={styles.subTitle}>Easings (click to animate)</h3>
        <div className={styles.motionList}>
          {EASING_TOKENS.map(({ token, label }) => (
            <div key={token} className={styles.motionRow}>
              <span className={styles.motionLabel}>{label}</span>
              <button
                className={styles.motionDemo}
                data-active={activeMotion === token}
                style={{ transitionTimingFunction: `var(${token})`, transitionDuration: 'var(--dur-slow)' }}
                onClick={() => toggle(token)}
                aria-label={`Demo ${label}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 7 — Track palette */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Track palette</h2>
        <div className={styles.trackRow}>
          {TRACK_COLORS.map(token => (
            <div
              key={token}
              className={styles.trackSwatch}
              style={{ background: `var(${token})` }}
              title={token}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/gallery/pages/Tokens.module.css`**

```css
/* src/gallery/pages/Tokens.module.css */
.page {
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  min-height: 100%;
}

.pageTitle {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--text);
}

.section { display: flex; flex-direction: column; gap: var(--space-4); }

.sectionTitle {
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-bottom: 1px solid var(--border);
  padding-bottom: var(--space-2);
}

.subTitle {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: var(--space-2);
}

/* Colour */
.swatchGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-3);
}

.swatch { display: flex; gap: var(--space-3); align-items: flex-start; }

.swatchChip { width: 40px; height: 40px; flex-shrink: 0; border: 1px solid var(--border); }

.swatchInfo { display: flex; flex-direction: column; gap: 2px; }

.swatchToken { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text); }

.swatchLabel { font-family: var(--font-ui); font-size: var(--text-xs); color: var(--text-muted); }

.swatchValue { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-dim); }

.readabilityRow { display: flex; gap: var(--space-4); flex-wrap: wrap; }

.readabilitySample {
  padding: var(--space-4) var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  flex: 1;
  min-width: 200px;
}

/* Type scale */
.typeRow { display: flex; gap: var(--space-6); align-items: baseline; padding: var(--space-2) 0; border-bottom: 1px solid var(--border); }

.typeLabel { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-dim); min-width: 160px; flex-shrink: 0; }

.typeSamples { display: flex; gap: var(--space-8); flex-wrap: wrap; }

/* Spacing */
.spacingScale { display: flex; flex-direction: column; gap: var(--space-2); }

.spacingRow { display: flex; align-items: center; gap: var(--space-4); }

.spacingToken { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-dim); min-width: 80px; }

.spacingBar { height: var(--space-4); background: var(--accent); border-radius: 2px; }

/* Radius */
.meta { font-family: var(--font-ui); font-size: var(--text-sm); color: var(--text-muted); }

.code { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text); background: var(--surface-2); padding: 2px 6px; border-radius: 3px; }

.radiusRow { display: flex; gap: var(--space-6); }

.radiusBox { width: 80px; height: 80px; border: 1px solid var(--border); }

/* Elevation */
.elevationRow { display: flex; gap: var(--space-8); flex-wrap: wrap; }

.elevationBox {
  background: var(--surface);
  padding: var(--space-6) var(--space-8);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Motion */
.reducedBadge {
  display: inline-flex;
  padding: var(--space-2) var(--space-4);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--accent);
}

.motionList { display: flex; flex-direction: column; gap: var(--space-3); }

.motionRow { display: flex; align-items: center; gap: var(--space-6); }

.motionLabel { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-dim); min-width: 140px; }

.motionDemo {
  width: 48px;
  height: 48px;
  background: var(--accent);
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition-property: transform;
  transition-timing-function: var(--ease-out);
  transition-duration: var(--dur-base);
}

.motionDemo[data-active="true"] {
  transform: translateX(80px);
}

/* Track palette */
.trackRow { display: flex; gap: var(--space-4); }

.trackSwatch { width: 48px; height: 48px; border-radius: var(--radius); border: 1px solid var(--border); }
```

- [ ] **Step 3: Wire up the real Tokens page in Stage**

Replace the stub imports in `src/gallery/Stage.tsx`:

```tsx
// At the top of Stage.tsx, replace the stub functions with real imports:
import { Tokens } from './pages/Tokens'

// And in PAGE_MAP, replace TokensStub with Tokens:
const PAGE_MAP: Record<string, ComponentType> = {
  '/tokens': Tokens,
  '/design-language': DesignLanguageStub,
  ...DEMO_MAP,
}
```

(Keep `DesignLanguageStub` until Task 11.)

- [ ] **Step 4: Verify the Tokens page**

```bash
npm run dev
```

Navigate to `#/tokens`. Verify:
- All 21 colour swatches render (including --radius swatch row)
- Three readability samples are readable (text legible on background)
- Type scale rows show all three fonts at each size; mono row shows "1234 –6.0 dB"
- Spacing bars increase in width left to right
- Radius boxes match the current theme's radius value
- Motion demos animate when clicked
- Switching theme via the sidebar switcher updates everything instantly

Switch to Tropicália — page should flip to cream/warm tones entirely. Switch to Ink — dark greyscale. Both should look correct.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/pages/Tokens.tsx src/gallery/pages/Tokens.module.css src/gallery/Stage.tsx
git commit -m "feat: add Tokens page — visual token reference with live theme switching"
```

---

### Task 11: Design Language page

**Files:**
- Create: `src/gallery/pages/DesignLanguage.tsx`, `src/gallery/pages/DesignLanguage.module.css`
- Modify: `src/gallery/Stage.tsx` (replace stub)

**Interfaces:**
- Produces: `DesignLanguage` component — the 7 design rules rendered as a living reference doc

- [ ] **Step 1: Write `src/gallery/pages/DesignLanguage.tsx`**

```tsx
// src/gallery/pages/DesignLanguage.tsx
import styles from './DesignLanguage.module.css'

const RULES = [
  {
    number: 1,
    title: 'No default browser inputs',
    body: 'Every control is bespoke. A <input type="range"> is never a fader. If the browser drew it, we didn\'t build it.',
    demo: (
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <input type="range" defaultValue={70} style={{ width: '80px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>❌ browser</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '12px', height: '80px', background: 'var(--surface-2)',
            borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            boxShadow: 'inset 0 2px 4px hsl(0 0% 0% / 0.4)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '20px', height: '8px', background: 'var(--text-muted)',
              borderRadius: '2px', boxShadow: '0 1px 0 hsl(0 0% 100% / 0.15)',
            }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>✓ bespoke</span>
        </div>
      </div>
    ),
  },
  {
    number: 2,
    title: 'Tokens only — no hardcoded values',
    body: 'No colour, radius, duration, or font is a literal in a component stylesheet. Every value is var(--token-name). Swap a theme, every component re-skins.',
    demo: (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--accent-green)', lineHeight: 1.6 }}>
        <div>{'background: var(--surface);    /* ✓ */'}</div>
        <div style={{ color: 'var(--text-dim)' }}>{'background: #101014;          /* ❌ */'}</div>
        <div style={{ marginTop: '8px' }}>{'border-radius: var(--radius); /* ✓ */'}</div>
        <div style={{ color: 'var(--text-dim)' }}>{'border-radius: 6px;           /* ❌ */'}</div>
      </div>
    ),
  },
  {
    number: 3,
    title: 'Hairline top-highlight',
    body: 'Every raised surface has a single soft light source above it — a 1px highlight on the top edge, slightly lighter than the surface. The tell of a crafted control.',
    demo: (
      <div style={{
        width: '120px', height: '60px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
          top highlight
        </span>
      </div>
    ),
  },
  {
    number: 4,
    title: 'Recessed groove for readouts',
    body: 'Meters, dB displays, clock, BPM — all sit in an inset that reads as recessed into the surface. Depth without bevels, fake screws, or 90s-console cosplay.',
    demo: (
      <div style={{
        padding: '8px 12px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        boxShadow: 'inset 0 2px 6px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 0% / 0.3)',
        display: 'inline-block',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--accent-green)', letterSpacing: '0.05em' }}>
          –6.0 dB
        </span>
      </div>
    ),
  },
  {
    number: 5,
    title: 'Weight ≠ bounce',
    body: 'Motion settles with authority. Critically damped, zero overshoot. A bouncy spring is the tell of a toy — an instrument settles once and stops. Tune for firm, never springy.',
    demo: (
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
        <div>stiffness: 200, damping: 30 → ζ ≈ 1.06</div>
        <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>Just past critical — firm settle, zero overshoot.</div>
      </div>
    ),
  },
  {
    number: 6,
    title: 'The "why isn\'t this a webpage?" check',
    body: 'Before shipping any control, ask the question. If you can\'t answer it — if the control could appear in a SaaS dashboard without looking wrong — it needs more craft.',
    demo: null,
  },
  {
    number: 7,
    title: 'Every control acknowledges input',
    body: 'Hover, active, and focus states are non-negotiable. Tiny, fast, purposeful — the control is alive under your hand. A control that doesn\'t respond to touch is a static screenshot.',
    demo: (
      <div style={{ display: 'flex', gap: '12px' }}>
        {(['default', 'hover', 'active', 'focus'] as const).map(state => (
          <div key={state} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '40px', height: '40px',
              background: state === 'active' ? 'var(--accent)' : 'var(--surface)',
              border: state === 'focus' ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              opacity: state === 'hover' ? 0.8 : 1,
              boxShadow: state === 'hover' ? '0 0 0 1px var(--border-strong)' : undefined,
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
              {state}
            </span>
          </div>
        ))}
      </div>
    ),
  },
]

export function DesignLanguage() {
  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Design Language</h1>
        <p className={styles.subtitle}>
          What makes a Jackdaw control a Jackdaw control. A first-time viewer's reaction should be
          "this is a beautiful instrument," never "nice webpage."
        </p>
      </div>

      <div className={styles.rules}>
        {RULES.map(rule => (
          <div key={rule.number} className={styles.rule}>
            <div className={styles.ruleHeader}>
              <span className={styles.ruleNumber}>{rule.number}</span>
              <h2 className={styles.ruleTitle}>{rule.title}</h2>
            </div>
            <div className={styles.ruleBody}>
              <p className={styles.ruleText}>{rule.body}</p>
              {rule.demo && (
                <div className={styles.ruleDemo}>{rule.demo}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/gallery/pages/DesignLanguage.module.css`**

```css
/* src/gallery/pages/DesignLanguage.module.css */
.page {
  padding: var(--space-8);
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.intro { display: flex; flex-direction: column; gap: var(--space-4); }

.title {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--text);
}

.subtitle {
  font-family: var(--font-ui);
  font-size: var(--text-md);
  color: var(--text-muted);
  line-height: var(--leading-md);
}

.rules { display: flex; flex-direction: column; gap: var(--space-8); }

.rule {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--border);
}

.rule:last-child { border-bottom: none; }

.ruleHeader { display: flex; align-items: baseline; gap: var(--space-4); }

.ruleNumber {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-dim);
  min-width: 16px;
}

.ruleTitle {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--text);
  line-height: var(--leading-lg);
}

.ruleBody { display: flex; flex-direction: column; gap: var(--space-4); padding-left: calc(16px + var(--space-4)); }

.ruleText {
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text-muted);
  line-height: var(--leading-base);
}

.ruleDemo {
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
```

- [ ] **Step 3: Wire up in Stage**

Replace the `DesignLanguageStub` in `src/gallery/Stage.tsx`:

```tsx
import { DesignLanguage } from './pages/DesignLanguage'

// In PAGE_MAP:
'/design-language': DesignLanguage,
```

Also remove the `DesignLanguageStub` function.

- [ ] **Step 4: Verify in browser**

Navigate to `#/design-language`. Verify all 7 rules render with their demos. Switch to Tropicália — the page should look correct on the cream background. Verify the code demo in rule 2 is legible.

- [ ] **Step 5: Commit**

```bash
git add src/gallery/pages/DesignLanguage.tsx src/gallery/pages/DesignLanguage.module.css src/gallery/Stage.tsx
git commit -m "feat: add Design Language page — 7 rules with visual demos"
```

---

### Task 12: DoD audit + final polish

**Files:**
- Modify: nothing new — verification only, then a final commit

- [ ] **Step 1: Run the full test suite**

```bash
npm run test
```

Expected: All tests pass (ThemeProvider × 4, useHashRoute × 3, useSpring × 3 = 10 tests).

- [ ] **Step 2: Run TypeScript strict check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: clean build, no errors or warnings in the Vite output.

- [ ] **Step 4: Run through the spec DoD checklist**

Open the gallery at `npm run dev` and verify each item:

- [ ] `npm run dev` starts with no console errors
- [ ] `npm run build` succeeds (TypeScript strict, no errors)
- [ ] All 14 theme maps present — open DevTools, switch to each theme, verify `data-theme` updates
- [ ] Tokens page renders all 7 sections; live theme switch updates every swatch instantly
- [ ] `prefers-reduced-motion` indicator shows correct state (check OS setting or emulate in DevTools)
- [ ] Colour section shows readable/unreadable pairs — all 14 themes have legible text samples (switch through every theme)
- [ ] Sidebar: Foundations shows "Tokens" and "Design Language" as live links; Primitives/Composites shows dimmed planned items
- [ ] Compare mode: "Compare themes" button tiles the active page under default / bowie / tropicalia / manuscript / ink simultaneously
- [ ] Theme persists across page reload (localStorage) — switch to Bowie, reload, still Bowie
- [ ] `useSpring` snaps to target under `prefers-reduced-motion: reduce` — verified by test
- [ ] Design Language page renders all 7 rules with demos
- [ ] `src/components/.gitkeep` exists
- [ ] Self-hosted fonts load correctly — DevTools Network → no 404s on font requests
- [ ] Zero external runtime dependencies beyond react, react-dom: `npm list --depth=0 --omit=dev`

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 DoD audit — all 14 checklist items verified"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by task |
|---|---|
| §2 Project structure | T1 scaffold + all tasks |
| §3 Styling method decision | documented in T6 App, T7 Sidebar CSS |
| §4 Per-component folder convention | T1 creates `components/.gitkeep`; convention in File Map |
| §5a ThemeTokens interface | T2 |
| §5b 14 theme maps | T2 |
| §5c global.css | T3 |
| §5d reset.css | T3 |
| §6 ThemeProvider + inline var rule | T4 |
| §7 Three-layer motion | T5 (spring); rAF pattern documented in spec, no component yet |
| §8a Chrome/stage split + localStorage | T6 App + T4 ThemeRoot |
| §8b Hash routing | T6 useHashRoute |
| §8c Auto-discovery registry | T6 registry.ts + planned.ts |
| §8d Demo contract | T9 DemoShell + StatesGrid + Playground |
| §8e Stage compare mode | T8 |
| §9 Tokens page (7 sections) | T10 |
| §10 Design Language page (7 rules) | T11 |
| §11 DoD checklist | T12 |
| §12 Explicit non-scope | Nothing in plan implements components, bridge, or bespoke ThemeSwitcher |

All sections covered. No gaps found.

**Placeholder scan:** No TBDs, TODOs, or "similar to task N" shortcuts. All code blocks are complete.

**Type consistency:** `ThemeId`, `ThemeTokens`, `ThemeMeta`, `THEMES`, `DemoMeta`, `useTheme()`, `useHashRoute()`, `useSpring()` — names are consistent across all tasks. `ThemeRoot` (owns state) vs `ThemeProvider` (bare wrapper) distinction is explicit in T4 and used correctly in T6.
