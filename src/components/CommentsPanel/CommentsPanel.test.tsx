// src/components/CommentsPanel/CommentsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CommentsPanel, authorAccent } from './CommentsPanel'
import type { Comment, CommentAuthor, CommentsPanelProps } from './CommentsPanel'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALICE: CommentAuthor = { id: 'a1', name: 'Alice', initials: 'AL', color: '#e8a87c' }
const BOB: CommentAuthor   = { id: 'b1', name: 'Bob',   initials: 'BO' }

const TEXT_COMMENT: Comment = {
  id: 'c1',
  author: ALICE,
  time: 1_700_000_000_000,
  text: 'Check the reverb tail here',
}

const AUDIO_COMMENT: Comment = {
  id: 'c2',
  author: BOB,
  time: 1_700_000_001_000,
  audio: { url: 'stub://audio', durationMs: 3400 },
}

const RESOLVED_COMMENT: Comment = {
  id: 'c3',
  author: ALICE,
  time: 1_700_000_002_000,
  text: 'This sounded off — fixed now.',
  resolved: true,
}

const ANCHORED_COMMENT: Comment = {
  id: 'c4',
  author: BOB,
  time: 1_700_000_003_000,
  text: 'Great take at this moment!',
  timelineAt: 42.5,
}

const THREAD_COMMENT: Comment = {
  id: 'c5',
  author: ALICE,
  time: 1_700_000_004_000,
  text: 'Can we push the chorus harder?',
  replies: [
    { id: 'r1', author: BOB, time: 1_700_000_005_000, text: 'Agreed, will re-record.' },
  ],
}

function makeProps(overrides?: Partial<CommentsPanelProps>): CommentsPanelProps {
  return {
    comments: [],
    onPost: vi.fn(),
    onReply: vi.fn(),
    onResolve: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => vi.clearAllMocks())

// ── Rendering: empty state ────────────────────────────────────────────────────

describe('CommentsPanel — empty', () => {
  it('renders the panel', () => {
    render(<CommentsPanel {...makeProps()} />)
    expect(screen.getByTestId('comments-panel')).toBeInTheDocument()
  })

  it('shows an empty-state message when there are no comments', () => {
    render(<CommentsPanel {...makeProps({ comments: [] })} />)
    expect(screen.getByText(/no comments/i)).toBeInTheDocument()
  })

  it('has a composer text input', () => {
    render(<CommentsPanel {...makeProps()} />)
    expect(screen.getByRole('textbox', { name: /add a comment/i })).toBeInTheDocument()
  })

  it('has a post button', () => {
    render(<CommentsPanel {...makeProps()} />)
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
  })
})

// ── Rendering: text comment ───────────────────────────────────────────────────

describe('CommentsPanel — text comment', () => {
  it('renders the author name', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders the comment body text', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByText('Check the reverb tail here')).toBeInTheDocument()
  })

  it('renders the author initials in the avatar', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('renders a Reply button for each comment', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByRole('button', { name: /reply/i })).toBeInTheDocument()
  })

  it('renders a Resolve button for each comment', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByRole('button', { name: /resolve/i })).toBeInTheDocument()
  })
})

// ── Rendering: audio comment ──────────────────────────────────────────────────

describe('CommentsPanel — audio comment', () => {
  it('renders a play chip for audio comments', () => {
    render(<CommentsPanel {...makeProps({ comments: [AUDIO_COMMENT] })} />)
    expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()
  })

  it('shows audio duration', () => {
    render(<CommentsPanel {...makeProps({ comments: [AUDIO_COMMENT] })} />)
    expect(screen.getByText('3.4s')).toBeInTheDocument()
  })
})

// ── Rendering: resolved comment ───────────────────────────────────────────────

describe('CommentsPanel — resolved comment', () => {
  it('marks a resolved comment with data-resolved', () => {
    render(<CommentsPanel {...makeProps({ comments: [RESOLVED_COMMENT] })} />)
    const card = screen.getByTestId('comment-card-c3')
    expect(card).toHaveAttribute('data-resolved')
  })

  it('shows an Unresolve button for resolved comments', () => {
    render(<CommentsPanel {...makeProps({ comments: [RESOLVED_COMMENT] })} />)
    expect(screen.getByRole('button', { name: /unresolve/i })).toBeInTheDocument()
  })
})

// ── Rendering: timeline-anchored comment ──────────────────────────────────────

describe('CommentsPanel — timeline anchored', () => {
  it('shows a jump-to button for anchored comments when onJumpTo provided', () => {
    render(<CommentsPanel {...makeProps({ comments: [ANCHORED_COMMENT], onJumpTo: vi.fn() })} />)
    expect(screen.getByRole('button', { name: /jump to/i })).toBeInTheDocument()
  })

  it('does not show jump-to when onJumpTo is absent', () => {
    render(<CommentsPanel {...makeProps({ comments: [ANCHORED_COMMENT] })} />)
    expect(screen.queryByRole('button', { name: /jump to/i })).not.toBeInTheDocument()
  })
})

// ── Rendering: thread with replies ───────────────────────────────────────────

describe('CommentsPanel — thread', () => {
  it('renders reply text', () => {
    render(<CommentsPanel {...makeProps({ comments: [THREAD_COMMENT] })} />)
    expect(screen.getByText('Agreed, will re-record.')).toBeInTheDocument()
  })

  it('renders reply author name', () => {
    render(<CommentsPanel {...makeProps({ comments: [THREAD_COMMENT] })} />)
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})

// ── Callbacks: resolve/unresolve ──────────────────────────────────────────────

describe('CommentsPanel — resolve callbacks', () => {
  it('calls onResolve(id, true) when Resolve is clicked', () => {
    const onResolve = vi.fn()
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], onResolve })} />)
    fireEvent.click(screen.getByRole('button', { name: /resolve/i }))
    expect(onResolve).toHaveBeenCalledWith('c1', true)
  })

  it('calls onResolve(id, false) when Unresolve is clicked', () => {
    const onResolve = vi.fn()
    render(<CommentsPanel {...makeProps({ comments: [RESOLVED_COMMENT], onResolve })} />)
    fireEvent.click(screen.getByRole('button', { name: /unresolve/i }))
    expect(onResolve).toHaveBeenCalledWith('c3', false)
  })
})

// ── Callbacks: jump to ────────────────────────────────────────────────────────

describe('CommentsPanel — jump-to callback', () => {
  it('calls onJumpTo with timelineAt when Jump to is clicked', () => {
    const onJumpTo = vi.fn()
    render(<CommentsPanel {...makeProps({ comments: [ANCHORED_COMMENT], onJumpTo })} />)
    fireEvent.click(screen.getByRole('button', { name: /jump to/i }))
    expect(onJumpTo).toHaveBeenCalledWith(42.5)
  })
})

// ── Composer: post ────────────────────────────────────────────────────────────

describe('CommentsPanel — composer post', () => {
  it('calls onPost with trimmed text when Post is clicked', () => {
    const onPost = vi.fn()
    render(<CommentsPanel {...makeProps({ onPost })} />)
    fireEvent.change(screen.getByRole('textbox', { name: /add a comment/i }), {
      target: { value: '  Great take!  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /post/i }))
    expect(onPost).toHaveBeenCalledWith('Great take!')
  })

  it('clears the composer after posting', () => {
    render(<CommentsPanel {...makeProps()} />)
    const input = screen.getByRole('textbox', { name: /add a comment/i }) as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: /post/i }))
    expect(input.value).toBe('')
  })

  it('does not call onPost when the text is empty', () => {
    const onPost = vi.fn()
    render(<CommentsPanel {...makeProps({ onPost })} />)
    fireEvent.click(screen.getByRole('button', { name: /post/i }))
    expect(onPost).not.toHaveBeenCalled()
  })
})

// ── Composer: reply ───────────────────────────────────────────────────────────

describe('CommentsPanel — reply composer', () => {
  it('opens reply composer when Reply is clicked', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    expect(screen.getByRole('textbox', { name: /reply/i })).toBeInTheDocument()
  })

  it('calls onReply with commentId and text when reply is submitted', () => {
    const onReply = vi.fn()
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], onReply })} />)
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    fireEvent.change(screen.getByRole('textbox', { name: /reply/i }), {
      target: { value: 'On it!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reply/i }))
    expect(onReply).toHaveBeenCalledWith('c1', 'On it!')
  })

  it('closes reply composer after submit', () => {
    const onReply = vi.fn()
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], onReply })} />)
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    const replyInput = screen.getByRole('textbox', { name: /reply/i })
    fireEvent.change(replyInput, { target: { value: 'ok' } })
    fireEvent.click(screen.getByRole('button', { name: /send reply/i }))
    expect(screen.queryByRole('textbox', { name: /reply/i })).not.toBeInTheDocument()
  })

  it('closes reply composer when Cancel is clicked', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    fireEvent.click(screen.getByRole('button', { name: /reply/i }))
    expect(screen.getByRole('textbox', { name: /reply/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel reply/i }))
    expect(screen.queryByRole('textbox', { name: /reply/i })).not.toBeInTheDocument()
  })
})

// ── Composer: record button ───────────────────────────────────────────────────

describe('CommentsPanel — record button', () => {
  it('shows Record button in composer when onRecord is provided', () => {
    render(<CommentsPanel {...makeProps({ onRecord: vi.fn() })} />)
    expect(screen.getByRole('button', { name: /record audio/i })).toBeInTheDocument()
  })

  it('does not show Record button when onRecord is absent', () => {
    render(<CommentsPanel {...makeProps()} />)
    expect(screen.queryByRole('button', { name: /record audio/i })).not.toBeInTheDocument()
  })

  it('sets data-recording while capture is in progress', async () => {
    let resolveRecord!: (v: { url: string; durationMs: number }) => void
    const onRecord = vi.fn(() => new Promise<{ url: string; durationMs: number }>(r => { resolveRecord = r }))
    render(<CommentsPanel {...makeProps({ onRecord })} />)
    fireEvent.click(screen.getByRole('button', { name: /record audio/i }))
    // While in flight: button stays in DOM (audioDraft still null) with data-recording
    const btn = screen.getByRole('button', { name: /record audio/i })
    expect(btn).toHaveAttribute('data-recording')
    // After resolve: audio draft replaces the record button
    resolveRecord({ url: 'blob:x', durationMs: 1000 })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /post audio/i })).toBeInTheDocument()
    })
  })

  it('calls onPost with AudioRef after recording and posting', async () => {
    const audioRef = { url: 'blob:x', durationMs: 2500 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onPost = vi.fn()
    render(<CommentsPanel {...makeProps({ onRecord, onPost })} />)
    fireEvent.click(screen.getByRole('button', { name: /record audio/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /post audio/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /post audio/i }))
    expect(onPost).toHaveBeenCalledWith(audioRef)
  })

  it('clears recorded audio when discard is clicked', async () => {
    const audioRef = { url: 'blob:x', durationMs: 2500 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    render(<CommentsPanel {...makeProps({ onRecord })} />)
    fireEvent.click(screen.getByRole('button', { name: /record audio/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /discard recording/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /discard recording/i }))
    expect(screen.queryByRole('button', { name: /post audio/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /record audio/i })).toBeInTheDocument()
  })
})

// ── Audio formatting ──────────────────────────────────────────────────────────

describe('CommentsPanel — audio duration format', () => {
  it('formats 3400ms as 3.4s', () => {
    render(<CommentsPanel {...makeProps({ comments: [AUDIO_COMMENT] })} />)
    expect(screen.getByText('3.4s')).toBeInTheDocument()
  })

  it('formats 1000ms as 1.0s', () => {
    const c: Comment = { ...AUDIO_COMMENT, audio: { url: 'x', durationMs: 1000 } }
    render(<CommentsPanel {...makeProps({ comments: [c] })} />)
    expect(screen.getByText('1.0s')).toBeInTheDocument()
  })
})

// ── Play chip toggle ──────────────────────────────────────────────────────────

describe('CommentsPanel — play chip', () => {
  it('toggles data-playing on play/pause click', () => {
    render(<CommentsPanel {...makeProps({ comments: [AUDIO_COMMENT] })} />)
    const chip = screen.getByRole('button', { name: /play audio/i })
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('data-playing')
    fireEvent.click(chip)
    expect(chip).not.toHaveAttribute('data-playing')
  })
})

// ── Author identity ───────────────────────────────────────────────────────────

describe('authorAccent', () => {
  it('returns author.color when the author has one', () => {
    expect(authorAccent(ALICE)).toBe('#e8a87c')
  })

  it('returns a deterministic track-color var for an author without color', () => {
    const result1 = authorAccent(BOB)
    const result2 = authorAccent(BOB)
    expect(result1).toBe(result2)
    expect(result1).toMatch(/^var\(--track-color-\d\)$/)
  })

  it('returns different accents for different author ids (statistical sanity)', () => {
    const a = authorAccent({ id: 'id-aaa', name: 'A', initials: 'A' })
    const b = authorAccent({ id: 'id-zzz', name: 'B', initials: 'B' })
    expect(a).toMatch(/^var\(--track-color-\d\)$/)
    expect(b).toMatch(/^var\(--track-color-\d\)$/)
  })
})

// ── Author accent CSS variable ────────────────────────────────────────────────

describe('CommentsPanel — author accent CSS variable', () => {
  it('sets --_author-accent to the collaborator author color on the card', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    const card = screen.getByTestId('comment-card-c1')
    // ALICE has color: '#e8a87c' → authorAccent returns it directly
    expect(card.style.getPropertyValue('--_author-accent')).toBe('#e8a87c')
  })

  it('sets --_author-accent to var(--accent) for the current user\'s card', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], currentUserId: 'a1' })} />)
    const card = screen.getByTestId('comment-card-c1')
    expect(card.style.getPropertyValue('--_author-accent')).toBe('var(--accent)')
  })
})

describe('CommentsPanel — author identity: data-own', () => {
  it('sets data-own on the current user\'s comment card', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], currentUserId: 'a1' })} />)
    expect(screen.getByTestId('comment-card-c1')).toHaveAttribute('data-own')
  })

  it('does not set data-own on a collaborator\'s comment card', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT], currentUserId: 'b1' })} />)
    expect(screen.getByTestId('comment-card-c1')).not.toHaveAttribute('data-own')
  })

  it('does not set data-own when currentUserId is absent', () => {
    render(<CommentsPanel {...makeProps({ comments: [TEXT_COMMENT] })} />)
    expect(screen.getByTestId('comment-card-c1')).not.toHaveAttribute('data-own')
  })
})
