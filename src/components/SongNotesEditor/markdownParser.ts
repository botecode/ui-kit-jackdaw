// src/components/SongNotesEditor/markdownParser.ts

// Escapes HTML special characters in raw text content.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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
export function markdownToHtml(md: string): string {
  if (!md.trim()) return ''

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
