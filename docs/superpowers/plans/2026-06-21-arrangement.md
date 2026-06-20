# Arrangement — Implementation Plan
_2026-06-21 · headless_

## Files to create

```
src/components/Arrangement/
  Arrangement.tsx        component
  Arrangement.module.css styles
  Arrangement.test.tsx   tests
  Arrangement.demo.tsx   gallery demo
  index.ts               exports
```

## Steps

1. Create `index.ts` (barrel)
2. Create `Arrangement.tsx` — types + component
3. Create `Arrangement.module.css` — layout + state tokens
4. Create `Arrangement.test.tsx` — vitest + fireEvent tests
5. Create `Arrangement.demo.tsx` — gallery demo (all states)
6. Run `tsc --noEmit` + `vitest run` + lint; fix any issues
7. Commit

## Test plan

- `renders empty state (data-empty)` when tracks=[]
- `renders N track headers` for N tracks
- `renders N track lanes` for N tracks
- `focused track sets data-selected on header and lane` when focusedTrackId matches
- `onSelectTrack fires on header click`
- `Playhead renders` (data-testid="playhead-root" present)
- `EditCursor renders` (data-testid="edit-cursor-root" present)
- `TimeSelection renders with selection` (data-testid="time-selection-root" present)
- `detailPanel renders in slot`
