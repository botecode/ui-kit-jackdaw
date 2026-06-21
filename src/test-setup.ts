import '@testing-library/jest-dom'

// jsdom does not implement pointer capture — polyfill for components that use setPointerCapture.
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture    = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
}

// JSDOM does not implement window.matchMedia — stub it for all tests.
// useSpring reads prefers-reduced-motion; without this every component
// that imports useSpring crashes with "window.matchMedia is not a function".
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
