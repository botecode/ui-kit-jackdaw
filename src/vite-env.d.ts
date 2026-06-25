/// <reference types="vite/client" />

// Allow side-effect CSS imports (reset.css, global.css, *.module.css, etc.)
declare module '*.css' {}

// Minimal node:fs surface for tests that assert against authored source files.
// (This kit ships no @types/node; tests only ever read a file as text.)
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string
}
