// src/components/SongNotesEditor/markdownParser.ts

import { embedForLine, type LineEmbed } from '../../lib/embeds'

export interface MarkdownToHtmlOptions {
  /** Render a sole-URL line as an inline embed (player / card / image). Default true. */
  embeds?: boolean
}

// Escapes HTML special characters in raw text content.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Escapes a value for use inside a double-quoted HTML attribute.
function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/"/g, '&quot;')
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^[a-z]+:\/\//i, '').split('/')[0] || url
  }
}

// Builds the inline embed widget for a sole-URL line. The widget is a single
// contenteditable="false" island so the cursor can't land inside it, and it carries
// `data-embed-url` = the original markdown line so it round-trips losslessly as text.
// Element generation only — no loading. Players are the two OFFICIAL embed iframes
// (YouTube-nocookie / Spotify); everything else is a calm link card or an image.
function embedWidget(e: LineEmbed, line: string): string {
  const dataUrl = escapeAttr(line.trim())
  const open = (kind: string) =>
    `<figure data-embed="${kind}" data-embed-url="${dataUrl}" contenteditable="false">`

  if ((e.kind === 'youtube' || e.kind === 'spotify') && e.embedUrl) {
    const title = e.kind === 'youtube' ? 'YouTube video player' : 'Spotify player'
    // No `autoplay` in `allow` → honours reduced-motion / never autoplays.
    return (
      open(e.kind) +
      `<iframe src="${escapeAttr(e.embedUrl)}" title="${escapeAttr(e.label || title)}" ` +
      `loading="lazy" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" ` +
      `allow="encrypted-media; clipboard-write; picture-in-picture" allowfullscreen></iframe>` +
      `</figure>`
    )
  }

  if (e.kind === 'image') {
    const alt = e.label || hostOf(e.url)
    return (
      open('image') +
      `<img src="${escapeAttr(e.url)}" alt="${escapeAttr(alt)}" loading="lazy">` +
      `</figure>`
    )
  }

  // Generic web link (and offline/unembeddable fallback): a tidy link card. No
  // scraping here — best-effort host + the bare url, opened in the browser.
  const host = hostOf(e.url)
  const title = e.label || host
  // A calm, bespoke link glyph (inline SVG — markdownToHtml is string-based, so it
  // can't import the Phosphor React set). Single-weight, currentColor, on brand.
  const glyph =
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ` +
    `stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"/>` +
    `<path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"/></svg>`
  return (
    open('link') +
    `<a href="${escapeAttr(e.url)}" target="_blank" rel="noopener noreferrer">` +
    `<span data-embed-glyph aria-hidden="true">${glyph}</span>` +
    `<span data-embed-text><span data-embed-title>${escapeHtml(title)}</span>` +
    `<span data-embed-host>${escapeHtml(host)}</span></span>` +
    `</a>` +
    `</figure>`
  )
}

// Parses inline markdown within a line of text (bold, italic).
function parseInline(text: string): string {
  const escaped = escapeHtml(text)
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+?)_/g, '<em>$1</em>')
}

// Converts markdown string to an HTML string suitable for contenteditable innerHTML.
// Handles: headings (h1–h3), bold, italic, unordered lists, task lists, paragraphs.
export function markdownToHtml(md: string, options: MarkdownToHtmlOptions = {}): string {
  if (!md.trim()) return ''
  const embeds = options.embeds ?? true

  const lines = md.split('\n')
  const output: string[] = []
  let inList = false
  let inTaskList = false

  const closeLists = () => {
    if (inList || inTaskList) {
      output.push('</ul>')
      inList = false
      inTaskList = false
    }
  }

  for (const line of lines) {
    // A link on its own line becomes an inline embed (render enhancement; the
    // line still STORES the plain url — see htmlToMarkdown round-trip).
    const embed = embeds ? embedForLine(line) : null
    if (embed) {
      closeLists()
      output.push(embedWidget(embed, line))
      continue
    }

    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    const task = line.match(/^\[([ x])\] (.*)/)
    const bullet = line.match(/^[-*] (.*)/)

    if (h3) {
      closeLists()
      output.push(`<h3>${parseInline(h3[1])}</h3>`)
    } else if (h2) {
      closeLists()
      output.push(`<h2>${parseInline(h2[1])}</h2>`)
    } else if (h1) {
      closeLists()
      output.push(`<h1>${parseInline(h1[1])}</h1>`)
    } else if (task) {
      const checked = task[1] === 'x'
      const text = task[2]
      if (!inTaskList) {
        closeLists()
        output.push('<ul>')
        inTaskList = true
      }
      output.push(
        `<li data-task><input type="checkbox" contenteditable="false"${checked ? ' checked' : ''}>${parseInline(text)}</li>`,
      )
    } else if (bullet) {
      if (!inList) {
        closeLists()
        output.push('<ul>')
        inList = true
      }
      output.push(`<li>${parseInline(bullet[1])}</li>`)
    } else if (line.trim() === '') {
      closeLists()
      output.push('<p><br></p>')
    } else {
      closeLists()
      output.push(`<p>${parseInline(line)}</p>`)
    }
  }

  closeLists()
  return output.join('')
}

// Serializes the contenteditable DOM back to markdown.
export function htmlToMarkdown(root: HTMLElement): string {
  const lines: string[] = []
  walkBlock(root, lines)
  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function walkBlock(el: HTMLElement, lines: string[]): void {
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = (child.textContent ?? '').trim()
      if (text) lines.push(text)
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      serializeBlockElement(child as HTMLElement, lines)
    }
  }
}

function serializeBlockElement(el: HTMLElement, lines: string[]): void {
  const tag = el.tagName

  // Embed widgets store their original markdown line in data-embed-url — emit that
  // verbatim so the embed round-trips as plain text (the markdown never sees the
  // generated iframe/card markup).
  const embedUrl = el.getAttribute('data-embed-url')
  if (embedUrl != null) {
    lines.push(embedUrl)
    return
  }

  if (tag === 'H1') {
    lines.push(`# ${serializeInline(el)}`)
  } else if (tag === 'H2') {
    lines.push(`## ${serializeInline(el)}`)
  } else if (tag === 'H3') {
    lines.push(`### ${serializeInline(el)}`)
  } else if (tag === 'P' || tag === 'DIV') {
    const content = serializeInline(el)
    lines.push(content.trim() ? content : '')
  } else if (tag === 'BR') {
    lines.push('')
  } else if (tag === 'UL') {
    for (const child of el.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'LI') {
        serializeListItem(child as HTMLElement, lines)
      }
    }
  } else {
    walkBlock(el, lines)
  }
}

function serializeListItem(li: HTMLElement, lines: string[]): void {
  if (li.hasAttribute('data-task')) {
    const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null
    const checked = checkbox?.checked ?? false
    const text = serializeInline(li, /* skipInput */ true)
    lines.push(`${checked ? '[x]' : '[ ]'} ${text.trim()}`)
  } else {
    lines.push(`- ${serializeInline(li).trim()}`)
  }
}

function serializeInline(el: HTMLElement, skipInput = false): string {
  const parts: string[] = []
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      parts.push(child.textContent ?? '')
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const ch = child as HTMLElement
      const tag = ch.tagName
      if (skipInput && tag === 'INPUT') continue
      if (tag === 'STRONG' || tag === 'B') {
        parts.push(`**${serializeInline(ch)}**`)
      } else if (tag === 'EM' || tag === 'I') {
        parts.push(`*${serializeInline(ch)}*`)
      } else if (tag === 'BR') {
        parts.push('\n')
      } else if (tag === 'INPUT') {
        // skip — handled by li parent
      } else {
        parts.push(serializeInline(ch, skipInput))
      }
    }
  }
  return parts.join('')
}
