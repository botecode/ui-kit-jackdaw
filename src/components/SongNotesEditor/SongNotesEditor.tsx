// src/components/SongNotesEditor/SongNotesEditor.tsx
//
// Approach: contenteditable WYSIWYG with a minimal markdown parser + serializer.
// The source of truth is always markdown (value / onChange). The contenteditable
// renders the HTML equivalent; on each input event the DOM is walked back to
// markdown and onChange is called.
//
// Keyboard shortcuts apply block-level formatting on Space (Typora-style):
//   # → <h1>, ## → <h2>, ### → <h3>, - → <ul><li>, [ ] → task item
// Enter inside a list item continues the list; Enter on an empty item exits it.
// Ctrl/Cmd+B and Ctrl/Cmd+I apply inline bold/italic via execCommand.
//
// External value changes re-render innerHTML only when the editor is not focused,
// avoiding cursor disruption during active editing.
//
// Why this isn't a webpage: a pasted link doesn't become a blue underline — it
// becomes the thing itself, inline on the calm paper page. A YouTube/Spotify line
// blooms into the official player, an image lands as a framed plate, a web link
// settles into a tidy host-stamped tile. Yet the page is still just markdown
// underneath: the url is STORED as plain text and round-trips losslessly (the embed
// is a render enhancement, never a schema). This is the SHARED capability behind
// every markdown surface (Notes, Lyrics, Chords/Tabs, References, Collection notes),
// so the embed logic lives in one place: src/lib/embeds.ts (ReferenceList shares it).
//
// Design calls recorded here (headless, resolved against KIT-LEAD.md):
// - Render = element generation, not loading. markdownToHtml emits the official embed
//   iframe / link card / <img>; it never fetches. This keeps the feature fully
//   unit-testable (tsc + vitest) without a network or a live iframe — the re-queue
//   blocker. Playback needs the webview CSP to allow EMBED_FRAME_DOMAINS (a runtime
//   shell flag), but that is NOT a build dependency; the markup is correct regardless.
// - Embeds render as contenteditable="false" islands carrying data-embed-url, so the
//   caret treats each as one atomic block and htmlToMarkdown emits the stored url —
//   lossless round-trip. They appear on mount / external change (while blurred); a
//   freshly typed url settles into an embed on the next blur, never mid-keystroke.
// - YouTube uses youtube-nocookie.com (privacy-enhanced official embed). No `autoplay`
//   in the iframe allow-list → honours reduced-motion / never autoplays.
// - No scraping/oEmbed (out of scope): a web link is a best-effort host + url card;
//   offline / unembeddable degrades to that same card. Favicon fetch deliberately
//   omitted (a 3rd-party request fighting "calm paper" + CSP) — host stamp is enough.
// - embeds defaults on; the editor API is otherwise unchanged, so every consumer gets
//   embeds for free.

import { useRef, useCallback, useEffect } from 'react'
import { markdownToHtml, htmlToMarkdown } from './markdownParser'
import styles from './SongNotesEditor.module.css'

export interface SongNotesEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  /**
   * Render a link on its own line as an inline embed — a YouTube/Spotify player,
   * an image, or a tidy link card. The markdown still stores the plain url, so the
   * value round-trips as text. Default on; set false for a plain-text editor.
   */
  embeds?: boolean
  'aria-label'?: string
}

export function SongNotesEditor({
  value,
  onChange,
  placeholder = 'Ideas, reminders, what you\'re going for…',
  readOnly = false,
  disabled = false,
  embeds = true,
  'aria-label': ariaLabel = 'Song notes',
}: SongNotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastMarkdownRef = useRef(value)
  const lastEmbedsRef = useRef(embeds)
  const isFirstRender = useRef(true)
  const isComposingRef = useRef(false)
  // Stable ref so keyboard handlers don't re-create on every onChange change
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Initialize and re-render when value changes externally
  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      el.innerHTML = markdownToHtml(value, { embeds })
      lastMarkdownRef.current = value
      return
    }

    // Re-render for external changes (not our own onChange) or an embeds toggle,
    // and only when blurred so we never disrupt the cursor mid-edit.
    if (
      (value !== lastMarkdownRef.current || embeds !== lastEmbedsRef.current) &&
      el !== document.activeElement
    ) {
      lastMarkdownRef.current = value
      lastEmbedsRef.current = embeds
      el.innerHTML = markdownToHtml(value, { embeds })
    }
  }, [value, embeds])

  const emitMarkdown = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    const md = htmlToMarkdown(el)
    lastMarkdownRef.current = md
    onChangeRef.current(md)
  }, [])

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return
    emitMarkdown()
  }, [emitMarkdown])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = editorRef.current
    if (!el) return

    // ── Inline formatting: Ctrl/Cmd+B, Ctrl/Cmd+I ────────────────────────────
    const mod = e.metaKey || e.ctrlKey
    if (mod && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault()
      document.execCommand('bold')
      emitMarkdown()
      return
    }
    if (mod && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault()
      document.execCommand('italic')
      emitMarkdown()
      return
    }

    // ── Block shortcuts on Space ──────────────────────────────────────────────
    if (e.key === ' ') {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return

      const range = sel.getRangeAt(0)
      const block = getBlockAncestor(range.startContainer, el)
      if (!block) return

      // Get the text content of the entire block up to the cursor
      const preRange = document.createRange()
      preRange.setStart(block, 0)
      preRange.setEnd(range.startContainer, range.startOffset)
      const textBefore = preRange.toString()

      let handled = false

      if (textBefore === '#') {
        e.preventDefault()
        replaceBlockWith(block, 'h1')
        handled = true
      } else if (textBefore === '##') {
        e.preventDefault()
        replaceBlockWith(block, 'h2')
        handled = true
      } else if (textBefore === '###') {
        e.preventDefault()
        replaceBlockWith(block, 'h3')
        handled = true
      } else if (textBefore === '-' || textBefore === '*') {
        e.preventDefault()
        const li = makeListItem(false)
        const ul = document.createElement('ul')
        ul.appendChild(li)
        block.replaceWith(ul)
        setCursor(li, 0)
        handled = true
      } else if (textBefore === '[ ]' || textBefore === '[]') {
        e.preventDefault()
        const li = makeTaskItem(false)
        const ul = document.createElement('ul')
        ul.appendChild(li)
        block.replaceWith(ul)
        setCursorAfterCheckbox(li)
        handled = true
      } else if (textBefore === '[x]') {
        e.preventDefault()
        const li = makeTaskItem(true)
        const ul = document.createElement('ul')
        ul.appendChild(li)
        block.replaceWith(ul)
        setCursorAfterCheckbox(li)
        handled = true
      }

      if (handled) {
        emitMarkdown()
      }
    }

    // ── Enter: list continuation ──────────────────────────────────────────────
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return

      const range = sel.getRangeAt(0)
      const li = getLiAncestor(range.startContainer, el)
      if (!li) return

      e.preventDefault()
      const ul = li.parentElement!
      const isTask = li.hasAttribute('data-task')

      // Check if this li is empty (just the checkbox and maybe whitespace for tasks)
      const liText = li.textContent?.trim() ?? ''
      const isEmpty = isTask ? liText === '' : liText === ''

      if (isEmpty) {
        // Exit the list — create a <p> and remove the empty item
        const p = document.createElement('p')
        p.appendChild(document.createElement('br'))
        ul.after(p)
        li.remove()
        if (!ul.querySelector('li')) ul.remove()
        setCursor(p, 0)
      } else {
        const newLi = isTask ? makeTaskItem(false) : makeListItem(false)
        li.after(newLi)
        if (isTask) setCursorAfterCheckbox(newLi)
        else setCursor(newLi, 0)
      }

      emitMarkdown()
    }
  }, [emitMarkdown])

  // ── Checkbox click inside contenteditable ────────────────────────────────────

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      // Defer so the checkbox has toggled before we serialize
      Promise.resolve().then(() => emitMarkdown())
    }
  }, [emitMarkdown])

  const isEmpty = !value.trim()
  const editable = !readOnly && !disabled

  return (
    <div
      className={styles.root}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-empty={isEmpty || undefined}
    >
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable={editable}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onCompositionStart={() => { isComposingRef.current = true }}
        onCompositionEnd={() => { isComposingRef.current = false; handleInput() }}
        spellCheck
      />
      {/* Placeholder: shown via CSS when data-empty is set */}
      <div className={styles.placeholder} aria-hidden>
        {placeholder}
      </div>
    </div>
  )
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

function getBlockAncestor(node: Node, stopAt: HTMLElement): HTMLElement | null {
  const BLOCK = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE'])
  let cur: Node | null = node
  while (cur && cur !== stopAt) {
    if (cur.nodeType === Node.ELEMENT_NODE && BLOCK.has((cur as HTMLElement).tagName)) {
      return cur as HTMLElement
    }
    cur = cur.parentNode
  }
  return null
}

function getLiAncestor(node: Node, stopAt: HTMLElement): HTMLElement | null {
  let cur: Node | null = node
  while (cur && cur !== stopAt) {
    if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).tagName === 'LI') {
      return cur as HTMLElement
    }
    cur = cur.parentNode
  }
  return null
}

function replaceBlockWith(old: HTMLElement, tag: string): void {
  const el = document.createElement(tag)
  el.appendChild(document.createElement('br'))
  old.replaceWith(el)
  setCursor(el, 0)
}

function makeListItem(checked: boolean): HTMLElement {
  void checked
  const li = document.createElement('li')
  li.appendChild(document.createElement('br'))
  return li
}

function makeTaskItem(checked: boolean): HTMLElement {
  const li = document.createElement('li')
  li.setAttribute('data-task', '')
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('contenteditable', 'false')
  if (checked) input.checked = true
  li.appendChild(input)
  li.appendChild(document.createTextNode(' ')) // non-breaking space for cursor target
  return li
}

function setCursor(el: HTMLElement, childIndex: number): void {
  const sel = window.getSelection()
  if (!sel) return
  try {
    const range = document.createRange()
    range.setStart(el, childIndex)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } catch {
    // Ignore — selection may be out of range in tests
  }
}

function setCursorAfterCheckbox(li: HTMLElement): void {
  const sel = window.getSelection()
  if (!sel) return
  try {
    const range = document.createRange()
    const last = li.lastChild
    if (last?.nodeType === Node.TEXT_NODE) {
      range.setStart(last, last.textContent?.length ?? 0)
    } else {
      range.setStart(li, li.childNodes.length)
    }
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  } catch {
    // Ignore in test environments
  }
}
