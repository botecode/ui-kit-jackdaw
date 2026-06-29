// src/lib/embeds.ts
//
// The SHARED embed render layer behind every markdown surface (Notes, Lyrics,
// Chords/Tabs, References, Collection notes). A URL is just text in the markdown —
// this module is the single source of truth for turning that text into the right
// *element*: a YouTube/Spotify player, an inline image, or a tidy link card.
//
// Render = element generation, NOT loading. Given a url we emit the correct official
// embed src (an <iframe> the host renders) or classify it as image/link/file. We
// never fetch, never scrape, never inject arbitrary html — only the two official
// embed iframes (YouTube / Spotify) plus link cards. Offline / unembeddable always
// degrades to a plain link card. This keeps the whole feature unit-testable without
// a network or a live iframe load.
//
// RUNTIME CSP NOTE (flag to the engine/shell — NOT a build dependency): the webview's
// Content-Security-Policy must allow the domains in `EMBED_FRAME_DOMAINS` in its
// `frame-src` (and `img-src` for thumbnails) or the players stay blank. The markup is
// produced regardless; only the on-screen playback needs the allowance.

export type EmbedKind = 'youtube' | 'spotify' | 'image' | 'link' | 'file'

export interface EmbedInfo {
  kind: EmbedKind
  /** Official player embed src for youtube/spotify; undefined for other kinds. */
  embedUrl?: string
  /** A preview image derivable offline (YouTube thumb / the image itself). */
  thumbnail?: string
}

/** A sole-URL markdown line resolved into the element it should render as. */
export interface LineEmbed extends EmbedInfo {
  /** The href / src exactly as written, so the line round-trips as text. */
  url: string
  /** Display label/alt when the line used markdown link/image syntax; else ''. */
  label: string
}

/** The official embed domains the webview CSP must allow for playback. */
export const EMBED_FRAME_DOMAINS = [
  'https://www.youtube-nocookie.com',
  'https://open.spotify.com',
] as const

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?.*)?$/i
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
const LOCAL_SCHEME = /^(file|asset|blob):/i

/** Pull a YouTube video id out of the common url shapes. */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i,
  )
  return m ? m[1] : null
}

/** Pull a Spotify `{type}/{id}` path out of an open.spotify.com url. */
export function spotifyPath(url: string): string | null {
  const m = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\/([\w-]+)/i,
  )
  return m ? `${m[1]}/${m[2]}` : null
}

/** The privacy-enhanced official YouTube embed src for a video id. */
export function youtubeEmbedSrc(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/** The official Spotify embed src for a `{type}/{id}` path. */
export function spotifyEmbedSrc(path: string): string {
  return `https://open.spotify.com/embed/${path}`
}

/** Classify a url into an embed kind + any offline-derivable embed/thumbnail src. */
export function classifyEmbed(url: string): EmbedInfo {
  const yt = youtubeId(url)
  if (yt) {
    return {
      kind: 'youtube',
      embedUrl: youtubeEmbedSrc(yt),
      thumbnail: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    }
  }

  const sp = spotifyPath(url)
  if (sp) {
    return { kind: 'spotify', embedUrl: spotifyEmbedSrc(sp) }
  }

  if (IMAGE_EXT.test(url)) {
    return { kind: 'image', thumbnail: url }
  }

  // No web scheme (or a local/asset/blob scheme) that looks like a path → a file.
  if ((!HAS_SCHEME.test(url) || LOCAL_SCHEME.test(url)) && /[^/]\.[a-z0-9]{1,8}(\?.*)?$/i.test(url)) {
    return { kind: 'file' }
  }

  return { kind: 'link' }
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/
const LINK_LINE = /^\[([^\]]*)\]\(([^)]+)\)$/

/** Does a trimmed string look like a single bare url (no whitespace inside)? */
function isBareUrl(text: string): boolean {
  if (!text || /\s/.test(text)) return false
  return HAS_SCHEME.test(text) || /^[\w-]+(\.[\w-]+)+(\/|$|\?|#)/.test(text)
}

/**
 * Resolve ONE markdown line (a link "on its own line") into the element it should
 * render as, or null if the line is prose / not a sole url. Supports a bare url,
 * a markdown image `![alt](url)`, or a markdown link `[label](url)`.
 */
export function embedForLine(line: string): LineEmbed | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const img = trimmed.match(IMAGE_LINE)
  if (img) {
    const url = img[2].trim()
    return { kind: 'image', url, label: img[1], thumbnail: url }
  }

  const link = trimmed.match(LINK_LINE)
  if (link) {
    const url = link[2].trim()
    return { url, label: link[1], ...classifyEmbed(url) }
  }

  if (isBareUrl(trimmed)) {
    return { url: trimmed, label: '', ...classifyEmbed(trimmed) }
  }

  return null
}
