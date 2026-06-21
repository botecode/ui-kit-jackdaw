# Consuming `@jackdaw/kit` in the DAW

The kit is the design-system source of truth. It builds **two** ways:

- `npm run build` — the **gallery** (the shelf, an app) — unchanged.
- `npm run build:lib` — the **library** the DAW imports. Emits to `dist/`:
  - `dist/jackdaw-kit.js` — ESM, every component + the theme system
  - `dist/jackdaw-kit.css` — one stylesheet (reset + tokens + fonts + every component's CSS)
  - `dist/types/` — `.d.ts` declarations

React and `@phosphor-icons/react` are **externalized** (peer dependencies) — the DAW provides them, so there's a single React instance.

---

## 1. Build the library

```bash
cd ui-jackdaw
npm run build:lib
```

## 2. Depend on it from the DAW (dev: live, no publish)

In `jackdaw/ui/package.json` add a local path dependency (adjust the relative path to where the repos sit):

```jsonc
"dependencies": {
  "@jackdaw/kit": "file:../../ui-jackdaw"
}
```

Then `npm install` in `jackdaw/ui`. After you change a kit component, re-run `npm run build:lib` and the DAW picks it up. Make sure the DAW has the peers installed at the **same** versions the kit expects:

```bash
npm install react react-dom @phosphor-icons/react
```

## 3. Use it

At the DAW UI root, once:

```ts
import '@jackdaw/kit/styles.css'
import { ThemeProvider } from '@jackdaw/kit'

// wrap the app so tokens + portal overlays resolve:
// <ThemeProvider theme="chroma"> … </ThemeProvider>
```

Then anywhere:

```ts
import { TransportBar, Fader, Arrangement } from '@jackdaw/kit'
```

## 4. Fonts (one-time)

The kit's CSS references fonts at the absolute path `/fonts/*.woff2`, so the DAW must **serve the kit's fonts at its site root**. Copy them into the DAW UI's `public/`:

```bash
cp -r node_modules/@jackdaw/kit/public/fonts <daw-ui>/public/fonts
```

(They ship with the package — `public/fonts` is in `files`.) A `postinstall` script that does this copy keeps it automatic.

## 5. Types — the `@bridge` / `@tokens` aliases

The component `.d.ts` reference the kit's internal aliases. Map them in the DAW UI's `tsconfig.json` so TypeScript resolves them:

```jsonc
"paths": {
  // Point @bridge at the DAW's OWN bridge types so component intents line up with the engine.
  // (The clean version of this is a shared @jackdaw/contract package — see below.)
  "@bridge": ["./src/bridge/types.ts"],
  "@tokens/*": ["./node_modules/@jackdaw/kit/dist/types/src/tokens/*"]
}
```

Mapping `@bridge` to the DAW's own contract is what makes a `Fader`'s `onChange` the real engine intent rather than a lookalike.

## 6. Releases (reproducible)

For DAW releases (CI builds on macOS **and** Windows), don't track the kit's `main` — pin a version. Bump `@jackdaw/kit` version, publish to a private registry (or tag a commit and use a git dependency), and swap the `file:` link for the pinned version. The `file:` link is for local dev velocity; a pin is for reproducible builds.

---

## Next step (recommended): a shared contract package

The cleanest long-term shape is to factor the bridge schema in `/shared` into `@jackdaw/contract`, which **both** the kit and the DAW depend on. Then `@bridge` resolves to one package on both sides and component props are guaranteed to match engine intents — no path-alias mapping, no drift.
