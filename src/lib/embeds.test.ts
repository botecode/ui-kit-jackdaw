import { describe, it, expect } from 'vitest'
import {
  youtubeId,
  spotifyPath,
  classifyEmbed,
  embedForLine,
  EMBED_FRAME_DOMAINS,
} from './embeds'

// ─── URL extraction ────────────────────────────────────────────────────────────

describe('youtubeId', () => {
  it('pulls the id from every common YouTube shape', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for non-YouTube urls', () => {
    expect(youtubeId('https://example.com/watch')).toBeNull()
  })
})

describe('spotifyPath', () => {
  it('extracts the {type}/{id} path', () => {
    expect(spotifyPath('https://open.spotify.com/track/abc123')).toBe('track/abc123')
    expect(spotifyPath('https://open.spotify.com/intl-pt/album/xyz')).toBe('album/xyz')
  })

  it('returns null for non-Spotify urls', () => {
    expect(spotifyPath('https://example.com/track/abc')).toBeNull()
  })
})

// ─── Classification + official embed src ─────────────────────────────────────────

describe('classifyEmbed', () => {
  it('builds the privacy-enhanced YouTube embed src', () => {
    const c = classifyEmbed('https://youtu.be/dQw4w9WgXcQ')
    expect(c.kind).toBe('youtube')
    expect(c.embedUrl).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(c.thumbnail).toContain('dQw4w9WgXcQ')
  })

  it('builds the official Spotify embed src', () => {
    const c = classifyEmbed('https://open.spotify.com/track/abc123')
    expect(c.kind).toBe('spotify')
    expect(c.embedUrl).toBe('https://open.spotify.com/embed/track/abc123')
  })

  it('detects images by extension', () => {
    expect(classifyEmbed('https://ex.com/cover.png').kind).toBe('image')
    expect(classifyEmbed('https://ex.com/a.JPEG?v=2').kind).toBe('image')
  })

  it('detects local/asset files', () => {
    expect(classifyEmbed('takes/vocal-comp.wav').kind).toBe('file')
    expect(classifyEmbed('asset://stems/bass.flac').kind).toBe('file')
  })

  it('falls back to a generic web link', () => {
    const c = classifyEmbed('https://example.com/article')
    expect(c.kind).toBe('link')
    expect(c.embedUrl).toBeUndefined()
  })
})

// ─── Line-level detection (a link on its own line) ───────────────────────────────

describe('embedForLine', () => {
  it('detects a bare YouTube url on its own line', () => {
    const e = embedForLine('https://youtu.be/dQw4w9WgXcQ')
    expect(e).toMatchObject({ kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' })
    expect(e?.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('detects a markdown image line and uses its alt', () => {
    const e = embedForLine('![Cover art](https://ex.com/cover.png)')
    expect(e).toMatchObject({ kind: 'image', url: 'https://ex.com/cover.png', label: 'Cover art' })
  })

  it('detects a markdown link line and classifies the target', () => {
    const e = embedForLine('[Reference mix](https://open.spotify.com/track/abc123)')
    expect(e).toMatchObject({ kind: 'spotify', label: 'Reference mix' })
  })

  it('ignores prose with an inline url (not on its own line)', () => {
    expect(embedForLine('see https://youtu.be/dQw4w9WgXcQ for the take')).toBeNull()
  })

  it('ignores plain prose', () => {
    expect(embedForLine('Just a regular note about the chorus')).toBeNull()
  })

  it('trims surrounding whitespace before matching', () => {
    expect(embedForLine('   https://youtu.be/dQw4w9WgXcQ   ')?.kind).toBe('youtube')
  })
})

// ─── CSP config flag for the shell ──────────────────────────────────────────────

describe('EMBED_FRAME_DOMAINS', () => {
  it('lists the official embed domains the webview CSP must allow', () => {
    expect(EMBED_FRAME_DOMAINS).toContain('https://www.youtube-nocookie.com')
    expect(EMBED_FRAME_DOMAINS).toContain('https://open.spotify.com')
  })
})
