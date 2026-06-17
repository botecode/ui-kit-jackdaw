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
