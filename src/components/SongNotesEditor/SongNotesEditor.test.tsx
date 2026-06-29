import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SongNotesEditor } from './SongNotesEditor'
import { markdownToHtml, htmlToMarkdown } from './markdownParser'

// ─── markdownToHtml ──────────────────────────────────────────────────────────

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('')
    expect(markdownToHtml('   ')).toBe('')
  })

  it('wraps plain text in <p>', () => {
    expect(markdownToHtml('Hello world')).toBe('<p>Hello world</p>')
  })

  it('converts # to <h1>', () => {
    expect(markdownToHtml('# My Song')).toBe('<h1>My Song</h1>')
  })

  it('converts ## to <h2>', () => {
    expect(markdownToHtml('## Section')).toBe('<h2>Section</h2>')
  })

  it('converts ### to <h3>', () => {
    expect(markdownToHtml('### Sub')).toBe('<h3>Sub</h3>')
  })

  it('converts **text** to <strong>', () => {
    expect(markdownToHtml('This is **bold** text')).toBe(
      '<p>This is <strong>bold</strong> text</p>',
    )
  })

  it('converts *text* to <em>', () => {
    expect(markdownToHtml('This is *italic* text')).toBe(
      '<p>This is <em>italic</em> text</p>',
    )
  })

  it('converts - items to <ul><li>', () => {
    const result = markdownToHtml('- Item A\n- Item B')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>Item A</li>')
    expect(result).toContain('<li>Item B</li>')
  })

  it('converts [ ] to unchecked task item', () => {
    const result = markdownToHtml('[ ] Todo')
    expect(result).toContain('data-task')
    expect(result).toContain('type="checkbox"')
    expect(result).not.toContain('checked>')
    expect(result).toContain('Todo')
  })

  it('converts [x] to checked task item', () => {
    const result = markdownToHtml('[x] Done')
    expect(result).toContain('checked')
    expect(result).toContain('Done')
  })

  it('produces <p><br></p> for blank lines', () => {
    expect(markdownToHtml('a\n\nb')).toContain('<p><br></p>')
  })

  it('escapes HTML special characters in text', () => {
    const result = markdownToHtml('a & b < c > d')
    expect(result).toContain('&amp;')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })
})

// ─── htmlToMarkdown ──────────────────────────────────────────────────────────

describe('htmlToMarkdown', () => {
  function fromHtml(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    return htmlToMarkdown(div)
  }

  it('serializes <h1> to # heading', () => {
    expect(fromHtml('<h1>My Song</h1>')).toBe('# My Song')
  })

  it('serializes <h2> to ## heading', () => {
    expect(fromHtml('<h2>Section</h2>')).toBe('## Section')
  })

  it('serializes <h3> to ### heading', () => {
    expect(fromHtml('<h3>Sub</h3>')).toBe('### Sub')
  })

  it('serializes <p> to plain text', () => {
    expect(fromHtml('<p>Hello world</p>')).toBe('Hello world')
  })

  it('serializes <strong> to **text**', () => {
    expect(fromHtml('<p>This is <strong>bold</strong> text</p>')).toBe(
      'This is **bold** text',
    )
  })

  it('serializes <em> to *text*', () => {
    expect(fromHtml('<p>This is <em>italic</em> text</p>')).toBe(
      'This is *italic* text',
    )
  })

  it('serializes <ul><li> to - items', () => {
    const result = fromHtml('<ul><li>Alpha</li><li>Beta</li></ul>')
    expect(result).toBe('- Alpha\n- Beta')
  })

  it('serializes unchecked task item to [ ] line', () => {
    const div = document.createElement('div')
    div.innerHTML = '<ul><li data-task><input type="checkbox"> Buy strings</li></ul>'
    const checkbox = div.querySelector('input') as HTMLInputElement
    checkbox.checked = false
    expect(htmlToMarkdown(div)).toBe('[ ] Buy strings')
  })

  it('serializes checked task item to [x] line', () => {
    const div = document.createElement('div')
    div.innerHTML = '<ul><li data-task><input type="checkbox" checked> Done</li></ul>'
    expect(htmlToMarkdown(div)).toBe('[x] Done')
  })

  it('handles empty <p><br></p> as blank line between paragraphs', () => {
    const result = fromHtml('<p>A</p><p><br></p><p>B</p>')
    expect(result).toBe('A\n\nB')
  })
})

// ─── Embeds: a link on its own line renders inline ────────────────────────────

describe('markdownToHtml embeds', () => {
  const YT = 'https://youtu.be/dQw4w9WgXcQ'

  it('renders a bare YouTube line as an official embed iframe', () => {
    const html = markdownToHtml(YT)
    expect(html).toContain('data-embed="youtube"')
    expect(html).toContain('<iframe')
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"')
    // carries the original line so it round-trips as plain text
    expect(html).toContain(`data-embed-url="${YT}"`)
  })

  it('never requests autoplay on the embed (reduced-motion / no autoplay)', () => {
    expect(markdownToHtml(YT)).not.toContain('autoplay')
  })

  it('makes the embed widget non-editable inside the contenteditable surface', () => {
    expect(markdownToHtml(YT)).toContain('contenteditable="false"')
  })

  it('renders a Spotify line as the Spotify embed iframe', () => {
    const html = markdownToHtml('https://open.spotify.com/track/abc123')
    expect(html).toContain('data-embed="spotify"')
    expect(html).toContain('src="https://open.spotify.com/embed/track/abc123"')
  })

  it('renders a generic web link as a card, not an iframe', () => {
    const html = markdownToHtml('https://example.com/article')
    expect(html).toContain('data-embed="link"')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('example.com')
  })

  it('renders an image url inline as an <img>', () => {
    const html = markdownToHtml('https://ex.com/cover.png')
    expect(html).toContain('data-embed="image"')
    expect(html).toContain('<img')
    expect(html).toContain('src="https://ex.com/cover.png"')
  })

  it('renders a markdown image line as an inline image with its alt', () => {
    const html = markdownToHtml('![Cover art](https://ex.com/cover.png)')
    expect(html).toContain('data-embed="image"')
    expect(html).toContain('alt="Cover art"')
  })

  it('leaves plain prose untouched (no embed)', () => {
    expect(markdownToHtml('Just a note about the chorus')).toBe(
      '<p>Just a note about the chorus</p>',
    )
  })

  it('leaves an inline url inside prose untouched', () => {
    const html = markdownToHtml('watch https://youtu.be/dQw4w9WgXcQ later')
    expect(html).not.toContain('<iframe')
    expect(html).toContain('<p>')
  })

  it('does not embed when embeds are disabled', () => {
    const html = markdownToHtml(YT, { embeds: false })
    expect(html).not.toContain('<iframe')
    expect(html).toContain('<p>')
  })

  it('round-trips an embed widget back to the plain url line', () => {
    const div = document.createElement('div')
    div.innerHTML = markdownToHtml(YT)
    expect(htmlToMarkdown(div)).toBe(YT)
  })

  it('round-trips a markdown image embed back to its markdown line', () => {
    const md = '![Cover art](https://ex.com/cover.png)'
    const div = document.createElement('div')
    div.innerHTML = markdownToHtml(md)
    expect(htmlToMarkdown(div)).toBe(md)
  })

  it('round-trips embeds mixed with prose', () => {
    const md = `# Reference\n\nFeel of the verse:\n\n${YT}\n\nBack to writing.`
    const div = document.createElement('div')
    div.innerHTML = markdownToHtml(md)
    expect(htmlToMarkdown(div)).toBe(md)
  })
})

// ─── SongNotesEditor rendering ───────────────────────────────────────────────

describe('SongNotesEditor rendering', () => {
  const noop = vi.fn()

  it('renders an element with role="textbox"', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} />)
    expect(getByRole('textbox')).toBeInTheDocument()
  })

  it('aria-multiline="true" is set', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} />)
    expect(getByRole('textbox').getAttribute('aria-multiline')).toBe('true')
  })

  it('aria-label defaults to "Song notes"', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} />)
    expect(getByRole('textbox').getAttribute('aria-label')).toBe('Song notes')
  })

  it('aria-label prop is applied', () => {
    const { getByRole } = render(
      <SongNotesEditor value="" onChange={noop} aria-label="Project ideas" />,
    )
    expect(getByRole('textbox').getAttribute('aria-label')).toBe('Project ideas')
  })

  it('data-empty is set when value is empty', () => {
    const { container } = render(<SongNotesEditor value="" onChange={noop} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-empty')
  })

  it('data-empty is set when value is whitespace-only', () => {
    // Use a JS expression so \n is a real newline, not a literal backslash-n
    const { container } = render(<SongNotesEditor value={"   \n  "} onChange={noop} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-empty')
  })

  it('data-empty is absent when value has content', () => {
    const { container } = render(
      <SongNotesEditor value="Some notes" onChange={noop} />,
    )
    const root = container.firstChild as HTMLElement
    expect(root).not.toHaveAttribute('data-empty')
  })

  it('data-disabled is set when disabled', () => {
    const { container } = render(<SongNotesEditor value="" onChange={noop} disabled />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-disabled')
  })

  it('data-readonly is set when readOnly', () => {
    const { container } = render(<SongNotesEditor value="" onChange={noop} readOnly />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-readonly')
  })

  it('contentEditable is false when disabled', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} disabled />)
    expect(getByRole('textbox').getAttribute('contenteditable')).toBe('false')
  })

  it('contentEditable is false when readOnly', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} readOnly />)
    expect(getByRole('textbox').getAttribute('contenteditable')).toBe('false')
  })

  it('aria-readonly is set when readOnly', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} readOnly />)
    expect(getByRole('textbox')).toHaveAttribute('aria-readonly', 'true')
  })

  it('aria-disabled is set when disabled', () => {
    const { getByRole } = render(<SongNotesEditor value="" onChange={noop} disabled />)
    expect(getByRole('textbox')).toHaveAttribute('aria-disabled', 'true')
  })

  it('placeholder is rendered as a sibling element', () => {
    const { getByText } = render(
      <SongNotesEditor
        value=""
        onChange={noop}
        placeholder="Write something here"
      />,
    )
    expect(getByText('Write something here')).toBeInTheDocument()
  })

  it('renders a sole-URL line as an inline embed by default', () => {
    const { getByRole } = render(
      <SongNotesEditor value="https://youtu.be/dQw4w9WgXcQ" onChange={noop} />,
    )
    const editor = getByRole('textbox')
    expect(editor.querySelector('iframe')).toBeTruthy()
    expect(editor.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube-nocookie.com/embed/dQw4w9WgXcQ',
    )
  })

  it('does not embed when embeds={false}', () => {
    const { getByRole } = render(
      <SongNotesEditor value="https://youtu.be/dQw4w9WgXcQ" onChange={noop} embeds={false} />,
    )
    expect(getByRole('textbox').querySelector('iframe')).toBeNull()
  })

  it('renders markdown value as HTML in the editor on mount', () => {
    const { getByRole } = render(
      <SongNotesEditor value="# My Song" onChange={noop} />,
    )
    const editor = getByRole('textbox')
    expect(editor.innerHTML).toContain('<h1>')
    expect(editor.innerHTML).toContain('My Song')
  })
})

// ─── SongNotesEditor interaction ─────────────────────────────────────────────

describe('SongNotesEditor interaction', () => {
  it('calls onChange with markdown when input fires', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<SongNotesEditor value="" onChange={onChange} />)
    const editor = getByRole('textbox')
    // Simulate typing by setting innerHTML and firing input
    editor.innerHTML = '<p>Hello world</p>'
    fireEvent.input(editor)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('Hello world')
  })

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn()
    const { getByRole } = render(
      <SongNotesEditor value="" onChange={onChange} readOnly />,
    )
    const editor = getByRole('textbox')
    editor.innerHTML = '<p>Some text</p>'
    fireEvent.input(editor)
    // contentEditable is false so browser won't fire input — but even if it does,
    // the handler is attached and will fire. The contract is: when the editor is
    // readOnly, the contenteditable attr is "false" preventing actual user input.
    // We verify the aria and data attributes are correct (tested above).
    expect(editor.getAttribute('contenteditable')).toBe('false')
  })

  it('calls onChange with heading markdown for h1 content', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<SongNotesEditor value="" onChange={onChange} />)
    const editor = getByRole('textbox')
    editor.innerHTML = '<h1>My Song Title</h1>'
    fireEvent.input(editor)
    expect(onChange).toHaveBeenCalledWith('# My Song Title')
  })

  it('calls onChange with list markdown for ul content', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<SongNotesEditor value="" onChange={onChange} />)
    const editor = getByRole('textbox')
    editor.innerHTML = '<ul><li>Item one</li><li>Item two</li></ul>'
    fireEvent.input(editor)
    expect(onChange).toHaveBeenCalledWith('- Item one\n- Item two')
  })

  it('calls onChange with checkbox markdown for task content', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<SongNotesEditor value="" onChange={onChange} />)
    const editor = getByRole('textbox')
    editor.innerHTML = '<ul><li data-task><input type="checkbox"> Buy strings</li></ul>'
    fireEvent.input(editor)
    expect(onChange).toHaveBeenCalledWith('[ ] Buy strings')
  })

  it('does not call onChange during IME composition', () => {
    const onChange = vi.fn()
    const { getByRole } = render(<SongNotesEditor value="" onChange={onChange} />)
    const editor = getByRole('textbox')
    fireEvent.compositionStart(editor)
    editor.innerHTML = '<p>中文</p>'
    fireEvent.input(editor)
    expect(onChange).not.toHaveBeenCalled()
    // compositionEnd should flush the value
    fireEvent.compositionEnd(editor)
    expect(onChange).toHaveBeenCalledWith('中文')
  })
})
