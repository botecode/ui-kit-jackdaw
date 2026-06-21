# CommentsPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `CommentsPanel` composite component — a scrollable collaboration thread panel with text + audio comments, reply, resolve, and a text/voice composer.

**Architecture:** Single-component file (`CommentsPanel.tsx`) containing the full component plus private sub-components (`CommentCard`, `ReplyCard`, `PlayChip`, `Avatar`, `Composer`). State is lifted to the root — callbacks fire up. All visual states expressed via `data-*` attributes; CSS Modules with tokens only.

**Tech Stack:** React 18, TypeScript, CSS Modules, @phosphor-icons/react, Vitest + @testing-library/react (fireEvent only), existing kit components (Toggle, ScrollArea, Panel).

## Global Constraints

- Tokens only — no hardcoded colors ever; verify in Compare light + dark
- CSS Modules; `data-*` attributes for state (never class-juggling)
- Tests use `fireEvent`, NOT `userEvent`
- Sizes `sm`/`md` (default `md`); `:focus-visible` only (never `:focus`)
- `@phosphor-icons/react` for icons, one weight via global `IconContext`
- No animation library; CSS transitions using `--dur-*` / `--ease-*` tokens
- `tsc --noEmit` + `vitest run` + lint green before done
- Gallery auto-registers via `import.meta.glob` — no manual registry edits
- Dogfood: playground controls use kit `Toggle`; composer uses kit `ScrollArea`
- No dead code, no premature abstractions

---

### Task 1: Types, fixtures, failing tests

**Files:**
- Create: `src/components/CommentsPanel/CommentsPanel.tsx` (types + stub export only)
- Create: `src/components/CommentsPanel/CommentsPanel.test.tsx`
- Create: `src/components/CommentsPanel/index.ts`

**Interfaces:**
- Produces: `CommentAuthor`, `AudioRef`, `CommentReply`, `Comment`, `CommentsPanelProps` (exported from CommentsPanel.tsx)

- [ ] **Step 1: Create the types stub and index**

Create `src/components/CommentsPanel/CommentsPanel.tsx`:

```tsx
// src/components/CommentsPanel/CommentsPanel.tsx

export interface CommentAuthor {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  color?: string
}

export interface AudioRef {
  url: string
  durationMs: number
}

export interface CommentReply {
  id: string
  author: CommentAuthor
  time: number  // unix timestamp ms
  text?: string
  audio?: AudioRef
}

export interface Comment {
  id: string
  author: CommentAuthor
  time: number  // unix timestamp ms
  text?: string
  audio?: AudioRef
  resolved?: boolean
  timelineAt?: number  // seconds; enables "jump to"
  replies?: CommentReply[]
}

export interface CommentsPanelProps {
  comments: Comment[]
  onPost: (content: string | AudioRef) => void
  onReply: (commentId: string, content: string | AudioRef) => void
  onResolve: (commentId: string, resolved: boolean) => void
  onJumpTo?: (timelineAt: number) => void
  onRecord?: () => Promise<AudioRef>
}

export function CommentsPanel(_props: CommentsPanelProps) {
  return <div data-testid="comments-panel" />
}
```

Create `src/components/CommentsPanel/index.ts`:

```ts
export { CommentsPanel } from './CommentsPanel'
export type {
  CommentAuthor,
  AudioRef,
  CommentReply,
  Comment,
  CommentsPanelProps,
} from './CommentsPanel'
```

- [ ] **Step 2: Write all failing tests**

Create `src/components/CommentsPanel/CommentsPanel.test.tsx`:

```tsx
// src/components/CommentsPanel/CommentsPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommentsPanel } from './CommentsPanel'
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
  it('shows a jump-to button for anchored comments', () => {
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
    // Bob appears once as reply author
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

  it('shows recording state while capturing', async () => {
    let resolveRecord!: (v: { url: string; durationMs: number }) => void
    const onRecord = vi.fn(() => new Promise<{ url: string; durationMs: number }>(r => { resolveRecord = r }))
    render(<CommentsPanel {...makeProps({ onRecord })} />)
    fireEvent.click(screen.getByRole('button', { name: /record audio/i }))
    const btn = screen.getByRole('button', { name: /record audio/i })
    expect(btn).toHaveAttribute('data-recording')
    resolveRecord({ url: 'blob:x', durationMs: 1000 })
    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: /record audio/i })).not.toHaveAttribute('data-recording')
    })
  })

  it('calls onPost with AudioRef after recording and posting', async () => {
    const audioRef = { url: 'blob:x', durationMs: 2500 }
    const onRecord = vi.fn().mockResolvedValue(audioRef)
    const onPost = vi.fn()
    render(<CommentsPanel {...makeProps({ onRecord, onPost })} />)
    fireEvent.click(screen.getByRole('button', { name: /record audio/i }))
    await vi.waitFor(() => {
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
    await vi.waitFor(() => {
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
```

- [ ] **Step 3: Run tests — expect all to fail**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx vitest run src/components/CommentsPanel/CommentsPanel.test.tsx 2>&1 | tail -20
```

Expected: many failures (stub returns `<div />`).

- [ ] **Step 4: Commit types + tests**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
git add src/components/CommentsPanel/
git commit -m "test(CommentsPanel): failing tests for all states + callbacks

Types: CommentAuthor, AudioRef, CommentReply, Comment, CommentsPanelProps.
Covers: empty, text comment, audio comment, resolved, anchored, thread,
resolve/unresolve callbacks, jump-to, composer post, reply composer,
record button, audio formatting, play chip toggle.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Component implementation

**Files:**
- Modify: `src/components/CommentsPanel/CommentsPanel.tsx` (full implementation)
- Create: `src/components/CommentsPanel/CommentsPanel.module.css`

**Interfaces:**
- Consumes: all types from Task 1
- Produces: fully rendered CommentsPanel that passes all tests

- [ ] **Step 1: Create the CSS module**

Create `src/components/CommentsPanel/CommentsPanel.module.css`:

```css
/* src/components/CommentsPanel/CommentsPanel.module.css */

/* ─── Panel shell ────────────────────────────────────────────────────────── */

.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  background-image: var(--texture-paper);
  background-blend-mode: multiply;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 1px 3px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: var(--font-ui);
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

.header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 80%, var(--stage) 20%);
  flex-shrink: 0;
}

.headerTitle {
  flex: 1;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  line-height: 1;
}

/* Unread count badge */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 var(--space-1);
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  line-height: 1;
}

/* ─── Thread list (scrollable) ───────────────────────────────────────────── */

.threadList {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
}

/* Scrollbar — recessed groove, same recipe as ScrollArea */
.threadList::-webkit-scrollbar { width: 6px; }
.threadList::-webkit-scrollbar-track {
  background: var(--stage);
  border-radius: 999px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}
.threadList::-webkit-scrollbar-thumb {
  background-color: var(--surface-2);
  border-radius: 999px;
  border: 1px solid transparent;
  background-clip: padding-box;
}
.threadList::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-dim);
}

/* ─── Empty state ────────────────────────────────────────────────────────── */

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--space-2);
  padding: var(--space-8);
  text-align: center;
  color: var(--text-dim);
  font-size: var(--text-sm);
  line-height: var(--leading-base);
}

.emptyIcon {
  opacity: 0.4;
}

/* ─── Comment card ───────────────────────────────────────────────────────── */

.commentCard {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: color-mix(in srgb, var(--surface) 60%, var(--stage) 40%);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition:
    opacity var(--dur-slow) var(--ease-out),
    background var(--dur-slow) var(--ease-out);
}

/* Resolved: dim + slightly recessed */
.commentCard[data-resolved] {
  opacity: 0.55;
  background: color-mix(in srgb, var(--surface) 30%, var(--stage) 70%);
}

/* ─── Comment header (avatar + meta) ────────────────────────────────────── */

.commentHeader {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ─── Avatar (initials circle) ───────────────────────────────────────────── */

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--stage);
  border: 1px solid var(--border);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 0 0 2px var(--_avatar-color, var(--border));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatarInitials {
  font-size: 9px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.03em;
  color: var(--text-muted);
  text-transform: uppercase;
  line-height: 1;
  user-select: none;
}

.avatarImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ─── Author meta (name + time) ──────────────────────────────────────────── */

.authorMeta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.authorName {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.commentTime {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-dim);
  letter-spacing: 0.02em;
  line-height: 1;
}

/* ─── Comment body (text or audio chip) ──────────────────────────────────── */

.commentBody {
  font-size: var(--text-base);
  color: var(--text);
  line-height: var(--leading-base);
  word-break: break-word;
}

/* ─── Audio play chip ────────────────────────────────────────────────────── */

.playChip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: color-mix(in srgb, var(--accent) 10%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: calc(var(--radius) * 2);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  transition:
    box-shadow var(--dur-led-off) var(--ease-out),
    color var(--dur-led-off) var(--ease-out),
    background var(--dur-led-off) var(--ease-out);
}

/* Playing: accent bloom */
.playChip[data-playing] {
  background: color-mix(in srgb, var(--accent) 18%, var(--stage));
  color: var(--accent);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.35),
    0 0 8px 2px color-mix(in srgb, var(--accent) 30%, transparent);
  transition:
    box-shadow var(--dur-led-on) var(--ease-out),
    color var(--dur-led-on) var(--ease-out),
    background var(--dur-led-on) var(--ease-out);
}

.playChip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.playIcon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Simple waveform bars */
.waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 14px;
}

.waveBar {
  width: 3px;
  border-radius: 2px;
  background: currentColor;
  opacity: 0.7;
  transition: height var(--dur-base) var(--ease-out);
}

.playDuration {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: inherit;
  letter-spacing: 0.02em;
}

/* ─── Timeline jump-to link ──────────────────────────────────────────────── */

.jumpTo {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent);
  cursor: pointer;
  transition: box-shadow var(--dur-base) var(--ease-out);
  align-self: flex-start;
}

.jumpTo:hover {
  background: color-mix(in srgb, var(--accent) 10%, transparent);
}

.jumpTo:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* ─── Comment actions (Reply + Resolve) ──────────────────────────────────── */

.commentActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-1);
}

.actionBtn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--text-dim);
  cursor: pointer;
  transition:
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.actionBtn:hover {
  color: var(--text-muted);
  border-color: var(--border);
}

.actionBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Resolve button: accent-tint on resolved state */
.resolveBtn[data-resolved] {
  color: var(--accent);
}

/* ─── Replies ─────────────────────────────────────────────────────────────── */

.replies {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-left: calc(28px + var(--space-2));  /* indent under avatar */
  padding-left: var(--space-3);
  border-left: 2px solid var(--border);
}

.replyCard {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.replyHeader {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ─── Inline reply composer ───────────────────────────────────────────────── */

.replyComposer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-left: calc(28px + var(--space-2));
  padding: var(--space-2);
  background: var(--stage);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.replyInput {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--stage) 70%, var(--surface) 30%);
  border: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 0 0 1px var(--border);
  padding: var(--space-1) var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text);
  caret-color: var(--accent);
  resize: none;
  min-height: 48px;
  line-height: var(--leading-base);
  outline: none;
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.replyInput:focus-visible {
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.4),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

.replyInput::placeholder {
  color: var(--text-dim);
  opacity: 1;
}

.replyActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

/* ─── Bottom composer ────────────────────────────────────────────────────── */

.composer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 80%, var(--stage) 20%);
}

.composerInput {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: var(--stage);
  border: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--border);
  padding: var(--space-2);
  font-family: var(--font-ui);
  font-size: var(--text-base);
  color: var(--text);
  caret-color: var(--accent);
  resize: none;
  min-height: 60px;
  line-height: var(--leading-base);
  outline: none;
  transition: box-shadow var(--dur-base) var(--ease-out);
}

.composerInput:focus-visible {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 2px var(--accent);
  transition: box-shadow var(--dur-led-on) var(--ease-out);
}

.composerInput::placeholder {
  color: var(--text-dim);
  opacity: 1;
}

/* Audio draft in composer (after recording) */
.composerAudioDraft {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: color-mix(in srgb, var(--accent) 10%, var(--stage));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: var(--radius);
}

.composerAudioLabel {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent);
}

.composerActions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* ─── Shared button styles ───────────────────────────────────────────────── */

/* Ghost button (cancel, secondary) */
.ghostBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  cursor: pointer;
  min-height: 28px;
  transition: color var(--dur-base) var(--ease-out);
}

.ghostBtn:hover {
  color: var(--text);
}

.ghostBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ghostBtn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Accent filled button (post, send) */
.accentBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--accent);
  border: none;
  border-radius: var(--radius);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--accent-contrast);
  cursor: pointer;
  min-height: 28px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.25);
  transition: filter var(--dur-base) var(--ease-out);
}

.accentBtn:hover {
  filter: brightness(1.08);
}

.accentBtn:active {
  filter: brightness(0.95);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.accentBtn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.accentBtn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Record button — recessed idle, red LED bloom when recording */
.recordBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--stage);
  border: none;
  border-radius: var(--radius);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--border);
  font-family: var(--font-ui);
  font-size: var(--text-sm);
  color: var(--text-muted);
  cursor: pointer;
  min-height: 28px;
  transition:
    box-shadow var(--dur-led-off) var(--ease-out),
    color var(--dur-led-off) var(--ease-out);
}

.recordBtn:focus-visible {
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 2px var(--accent);
}

.recordBtn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.recordBtn[data-recording] {
  color: var(--led-red);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2),
    0 0 0 1px var(--border),
    0 0 8px 2px color-mix(in srgb, var(--led-red) 40%, transparent);
  transition:
    box-shadow var(--dur-led-on) var(--ease-out),
    color var(--dur-led-on) var(--ease-out);
}

.recordDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
  flex-shrink: 0;
  transition:
    background var(--dur-led-off) var(--ease-out),
    box-shadow var(--dur-led-off) var(--ease-out);
}

.recordBtn[data-recording] .recordDot {
  background: var(--led-red);
  box-shadow: 0 0 4px 1px color-mix(in srgb, var(--led-red) 60%, transparent);
  transition:
    background var(--dur-led-on) var(--ease-out),
    box-shadow var(--dur-led-on) var(--ease-out);
}

/* ─── Reduced-motion ─────────────────────────────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  .commentCard,
  .playChip,
  .actionBtn,
  .ghostBtn,
  .accentBtn,
  .recordBtn,
  .recordDot,
  .composerInput,
  .replyInput {
    transition: none;
  }
}
```

- [ ] **Step 2: Implement CommentsPanel.tsx**

Replace `src/components/CommentsPanel/CommentsPanel.tsx` with the full implementation:

```tsx
// src/components/CommentsPanel/CommentsPanel.tsx
//
// Collaboration comments side panel. Distinct from timeline-pinned
// AnnotationEditor — this is the persistent project thread panel.
// No overlay/portal needed; it's always mounted in the shell.

import { useState } from 'react'
import { ChatCircle, CheckCircle, ArrowBendUpLeft, Play, Pause, Microphone, PaperPlaneTilt, X, Clock } from '@phosphor-icons/react'
import styles from './CommentsPanel.module.css'

// ── Types (exported for app contract) ────────────────────────────────────────

export interface CommentAuthor {
  id: string
  name: string
  initials: string
  avatarUrl?: string
  color?: string
}

export interface AudioRef {
  url: string
  durationMs: number
}

export interface CommentReply {
  id: string
  author: CommentAuthor
  time: number
  text?: string
  audio?: AudioRef
}

export interface Comment {
  id: string
  author: CommentAuthor
  time: number
  text?: string
  audio?: AudioRef
  resolved?: boolean
  timelineAt?: number
  replies?: CommentReply[]
}

export interface CommentsPanelProps {
  comments: Comment[]
  onPost: (content: string | AudioRef) => void
  onReply: (commentId: string, content: string | AudioRef) => void
  onResolve: (commentId: string, resolved: boolean) => void
  onJumpTo?: (timelineAt: number) => void
  onRecord?: () => Promise<AudioRef>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const tenths = Math.floor((ms % 1000) / 100)
  return `${s}.${tenths}s`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatTimeline(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Static waveform bar heights — decorative, not data-driven
const WAVE_BARS = [4, 8, 12, 10, 14, 9, 6, 11, 13, 7, 5, 10]

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ author }: { author: CommentAuthor }) {
  return (
    <div
      className={styles.avatar}
      style={author.color ? { '--_avatar-color': author.color } as React.CSSProperties : undefined}
      aria-hidden="true"
    >
      {author.avatarUrl ? (
        <img src={author.avatarUrl} alt={author.name} className={styles.avatarImg} />
      ) : (
        <span className={styles.avatarInitials}>{author.initials}</span>
      )}
    </div>
  )
}

// ── Play chip (audio comment) ─────────────────────────────────────────────────

function PlayChip({ audio }: { audio: AudioRef }) {
  const [playing, setPlaying] = useState(false)

  return (
    <button
      className={styles.playChip}
      data-playing={playing || undefined}
      onClick={() => setPlaying(p => !p)}
      aria-label="Play audio comment"
      type="button"
    >
      <span className={styles.playIcon} aria-hidden="true">
        {playing
          ? <Pause weight="fill" size={12} />
          : <Play weight="fill" size={12} />
        }
      </span>
      <span className={styles.waveform} aria-hidden="true">
        {WAVE_BARS.map((h, i) => (
          <span key={i} className={styles.waveBar} style={{ height: h }} />
        ))}
      </span>
      <span className={styles.playDuration}>{formatDuration(audio.durationMs)}</span>
    </button>
  )
}

// ── Reply composer ────────────────────────────────────────────────────────────

interface ReplyComposerProps {
  commentId: string
  onReply: (commentId: string, content: string | AudioRef) => void
  onCancel: () => void
  onRecord?: () => Promise<AudioRef>
}

function ReplyComposer({ commentId, onReply, onCancel, onRecord }: ReplyComposerProps) {
  const [draft, setDraft] = useState('')
  const [audioDraft, setAudioDraft] = useState<AudioRef | null>(null)
  const [recording, setRecording] = useState(false)

  function handleSend() {
    if (audioDraft) {
      onReply(commentId, audioDraft)
    } else if (draft.trim()) {
      onReply(commentId, draft.trim())
    }
  }

  async function handleRecord() {
    if (!onRecord || recording) return
    setRecording(true)
    try {
      const ref = await onRecord()
      setAudioDraft(ref)
    } finally {
      setRecording(false)
    }
  }

  return (
    <div className={styles.replyComposer}>
      <textarea
        className={styles.replyInput}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Write a reply…"
        aria-label="Reply"
        rows={2}
      />
      <div className={styles.replyActions}>
        <button
          className={styles.ghostBtn}
          onClick={onCancel}
          type="button"
          aria-label="Cancel reply"
        >
          Cancel
        </button>
        <button
          className={styles.accentBtn}
          onClick={handleSend}
          disabled={!draft.trim() && !audioDraft}
          type="button"
          aria-label="Send reply"
        >
          <PaperPlaneTilt weight="bold" size={12} aria-hidden="true" />
          Send
        </button>
      </div>
    </div>
  )
}

// ── Comment card ──────────────────────────────────────────────────────────────

interface CommentCardProps {
  comment: Comment
  onReply: (commentId: string, content: string | AudioRef) => void
  onResolve: (commentId: string, resolved: boolean) => void
  onJumpTo?: (timelineAt: number) => void
  onRecord?: () => Promise<AudioRef>
}

function CommentCard({ comment, onReply, onResolve, onJumpTo, onRecord }: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)

  function handleReplySubmit(id: string, content: string | AudioRef) {
    onReply(id, content)
    setReplyOpen(false)
  }

  return (
    <div
      className={styles.commentCard}
      data-resolved={comment.resolved || undefined}
      data-testid={`comment-card-${comment.id}`}
    >
      {/* Header: avatar + author + time */}
      <div className={styles.commentHeader}>
        <Avatar author={comment.author} />
        <div className={styles.authorMeta}>
          <span className={styles.authorName}>{comment.author.name}</span>
          <span className={styles.commentTime}>{formatTime(comment.time)}</span>
        </div>
      </div>

      {/* Body: text or audio chip */}
      {comment.text && (
        <p className={styles.commentBody}>{comment.text}</p>
      )}
      {comment.audio && !comment.text && (
        <PlayChip audio={comment.audio} />
      )}

      {/* Timeline anchor jump */}
      {comment.timelineAt !== undefined && onJumpTo && (
        <button
          className={styles.jumpTo}
          onClick={() => onJumpTo!(comment.timelineAt!)}
          type="button"
          aria-label={`Jump to ${formatTimeline(comment.timelineAt)}`}
        >
          <Clock weight="bold" size={10} aria-hidden="true" />
          {formatTimeline(comment.timelineAt)}
        </button>
      )}

      {/* Actions: reply + resolve */}
      <div className={styles.commentActions}>
        <button
          className={styles.actionBtn}
          onClick={() => setReplyOpen(r => !r)}
          type="button"
          aria-label={`Reply to ${comment.author.name}`}
        >
          <ArrowBendUpLeft weight="bold" size={11} aria-hidden="true" />
          Reply
        </button>
        <button
          className={`${styles.actionBtn} ${styles.resolveBtn}`}
          data-resolved={comment.resolved || undefined}
          onClick={() => onResolve(comment.id, !comment.resolved)}
          type="button"
          aria-label={comment.resolved ? 'Unresolve comment' : 'Resolve comment'}
        >
          <CheckCircle weight={comment.resolved ? 'fill' : 'regular'} size={11} aria-hidden="true" />
          {comment.resolved ? 'Unresolve' : 'Resolve'}
        </button>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map(reply => (
            <div key={reply.id} className={styles.replyCard}>
              <div className={styles.replyHeader}>
                <Avatar author={reply.author} />
                <div className={styles.authorMeta}>
                  <span className={styles.authorName}>{reply.author.name}</span>
                  <span className={styles.commentTime}>{formatTime(reply.time)}</span>
                </div>
              </div>
              {reply.text && (
                <p className={styles.commentBody}>{reply.text}</p>
              )}
              {reply.audio && !reply.text && (
                <PlayChip audio={reply.audio} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline reply composer */}
      {replyOpen && (
        <ReplyComposer
          commentId={comment.id}
          onReply={handleReplySubmit}
          onCancel={() => setReplyOpen(false)}
          onRecord={onRecord}
        />
      )}
    </div>
  )
}

// ── Composer (bottom) ─────────────────────────────────────────────────────────

interface ComposerProps {
  onPost: (content: string | AudioRef) => void
  onRecord?: () => Promise<AudioRef>
}

function Composer({ onPost, onRecord }: ComposerProps) {
  const [draft, setDraft] = useState('')
  const [audioDraft, setAudioDraft] = useState<AudioRef | null>(null)
  const [recording, setRecording] = useState(false)

  function handlePost() {
    if (!draft.trim()) return
    onPost(draft.trim())
    setDraft('')
    setAudioDraft(null)
  }

  function handlePostAudio() {
    if (!audioDraft) return
    onPost(audioDraft)
    setAudioDraft(null)
    setDraft('')
  }

  async function handleRecord() {
    if (!onRecord || recording) return
    setRecording(true)
    try {
      const ref = await onRecord()
      setAudioDraft(ref)
    } finally {
      setRecording(false)
    }
  }

  function handleDiscard() {
    setAudioDraft(null)
  }

  return (
    <div className={styles.composer}>
      {audioDraft ? (
        <div className={styles.composerAudioDraft}>
          <span className={styles.composerAudioLabel}>
            {formatDuration(audioDraft.durationMs)} · voice note
          </span>
          <button
            className={styles.ghostBtn}
            onClick={handleDiscard}
            type="button"
            aria-label="Discard recording"
          >
            <X weight="bold" size={11} aria-hidden="true" />
          </button>
          <button
            className={styles.accentBtn}
            onClick={handlePostAudio}
            type="button"
            aria-label="Post audio"
          >
            <PaperPlaneTilt weight="bold" size={12} aria-hidden="true" />
            Post
          </button>
        </div>
      ) : (
        <textarea
          className={styles.composerInput}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          rows={2}
        />
      )}

      <div className={styles.composerActions}>
        {onRecord && !audioDraft && (
          <button
            className={styles.recordBtn}
            onClick={handleRecord}
            disabled={recording}
            data-recording={recording || undefined}
            type="button"
            aria-label="Record audio comment"
          >
            <span className={styles.recordDot} aria-hidden="true" />
            <Microphone weight={recording ? 'fill' : 'regular'} size={12} aria-hidden="true" />
            {recording ? 'Recording…' : 'Record'}
          </button>
        )}
        {!audioDraft && (
          <button
            className={styles.accentBtn}
            onClick={handlePost}
            disabled={!draft.trim()}
            type="button"
            aria-label="Post comment"
          >
            <PaperPlaneTilt weight="bold" size={12} aria-hidden="true" />
            Post
          </button>
        )}
      </div>
    </div>
  )
}

// ── CommentsPanel (root) ──────────────────────────────────────────────────────

export function CommentsPanel({
  comments,
  onPost,
  onReply,
  onResolve,
  onJumpTo,
  onRecord,
}: CommentsPanelProps) {
  const unresolved = comments.filter(c => !c.resolved).length

  return (
    <div className={styles.root} data-testid="comments-panel">
      {/* Header */}
      <div className={styles.header}>
        <ChatCircle weight="bold" size={14} aria-hidden="true" />
        <span className={styles.headerTitle}>Comments</span>
        {unresolved > 0 && (
          <span className={styles.badge} aria-label={`${unresolved} unresolved`}>
            {unresolved}
          </span>
        )}
      </div>

      {/* Thread list */}
      <div className={styles.threadList}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
            <ChatCircle className={styles.emptyIcon} size={32} aria-hidden="true" />
            <span>No comments yet</span>
          </div>
        ) : (
          comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onReply={onReply}
              onResolve={onResolve}
              onJumpTo={onJumpTo}
              onRecord={onRecord}
            />
          ))
        )}
      </div>

      {/* Bottom composer */}
      <Composer onPost={onPost} onRecord={onRecord} />
    </div>
  )
}
```

- [ ] **Step 3: Run tests — expect all to pass**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx vitest run src/components/CommentsPanel/CommentsPanel.test.tsx 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 4: Run tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 5: Commit implementation**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
git add src/components/CommentsPanel/
git commit -m "feat(CommentsPanel): implement component + CSS

Architecture: single-file component with private sub-components
(CommentCard, ReplyCard, PlayChip, Avatar, Composer, ReplyComposer).
State is local; callbacks fire up per the app contract.

Design decisions:
- Avatar: initials circle with optional --_avatar-color ring (track-color 
  family). No dedicated Avatar component — inlined (YAGNI: 1 consumer).
- Waveform: 12-bar static decorative SVG; real audio playback is app-level.
- Thread depth: 1 level of indented replies. DAW collaboration doesn't
  need recursive threading.
- Resolved: data-resolved dims card to 0.55 opacity + darker bg; Resolve
  button toggles onResolve(id, !resolved).
- Composer: raw <textarea> (not TextField) — TextField is single-line;
  multi-line composition is the correct affordance here.
- Record flow: capture → audio draft shown in composer → Post audio or
  Discard, matching AnnotationEditor's play chip pattern.
- Jump-to: shown only when timelineAt is set AND onJumpTo prop provided.
- Badge: inline unresolved-count chip in panel header (Badge component
  not yet built; inline is the right scope — 1 consumer).
- All tokens only; no hardcoded colors.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Gallery demo

**Files:**
- Create: `src/components/CommentsPanel/CommentsPanel.demo.tsx`

**Interfaces:**
- Consumes: `CommentsPanel`, `Comment`, `CommentAuthor`, `AudioRef` from CommentsPanel.tsx

- [ ] **Step 1: Create the demo**

Create `src/components/CommentsPanel/CommentsPanel.demo.tsx`:

```tsx
// src/components/CommentsPanel/CommentsPanel.demo.tsx
import { useState } from 'react'
import type { DemoMeta } from '../../gallery/registry'
import { DemoShell } from '../../gallery/ui/DemoShell'
import { StatesGrid, State } from '../../gallery/ui/StatesGrid'
import { Playground } from '../../gallery/ui/Playground'
import { Toggle } from '../Toggle'
import { CommentsPanel } from './CommentsPanel'
import type { Comment, CommentAuthor, AudioRef } from './CommentsPanel'

export const meta: DemoMeta = {
  name:  'CommentsPanel',
  group: 'Composites',
  route: '/comments-panel',
  order: 80,
}

// ── Fixture authors ───────────────────────────────────────────────────────────

const ALICE: CommentAuthor = {
  id: 'a1', name: 'Alice Chen', initials: 'AC',
  color: 'var(--track-color-1)',
}
const BOB: CommentAuthor = {
  id: 'b1', name: 'Bob Markov', initials: 'BM',
  color: 'var(--track-color-3)',
}
const CARA: CommentAuthor = {
  id: 'c1', name: 'Cara Osei', initials: 'CO',
  color: 'var(--track-color-4)',
}

// ── Stub audio fixture ────────────────────────────────────────────────────────

const STUB_AUDIO: AudioRef = { url: 'stub://voice', durationMs: 4200 }

function stubRecord(): Promise<AudioRef> {
  return new Promise(resolve => setTimeout(() => resolve({ url: 'stub://voice', durationMs: 2800 }), 1500))
}

// ── Fixture comment sets ──────────────────────────────────────────────────────

const EMPTY_COMMENTS: Comment[] = []

const TEXT_THREAD: Comment[] = [
  {
    id: 'c1', author: ALICE, time: Date.now() - 600_000,
    text: 'Can we push the chorus a little harder? The reverb tail is washing it out.',
    replies: [
      { id: 'r1', author: BOB, time: Date.now() - 540_000, text: 'Agreed — I\'ll tighten the pre-delay.' },
      { id: 'r2', author: CARA, time: Date.now() - 480_000, text: 'Also try pulling the high-shelf down 2dB.' },
    ],
  },
  {
    id: 'c2', author: BOB, time: Date.now() - 300_000,
    text: 'The verse vocal is a touch flat around bar 12.',
  },
]

const AUDIO_COMMENT: Comment[] = [
  {
    id: 'c3', author: CARA, time: Date.now() - 900_000,
    audio: STUB_AUDIO,
  },
  {
    id: 'c4', author: ALICE, time: Date.now() - 200_000,
    text: 'Left you a voice note about the bridge arrangement.',
    audio: { url: 'stub://voice2', durationMs: 7100 },
  },
]

const RESOLVED_COMMENT: Comment[] = [
  {
    id: 'c5', author: BOB, time: Date.now() - 1_200_000,
    text: 'The kick and bass are fighting in the low end.',
    resolved: true,
  },
  {
    id: 'c6', author: ALICE, time: Date.now() - 600_000,
    text: 'Fixed! Added a sidechain and it sits much better now.',
  },
]

const ANCHORED_COMMENT: Comment[] = [
  {
    id: 'c7', author: CARA, time: Date.now() - 400_000,
    text: 'That guitar fill at this point is perfect.',
    timelineAt: 47.2,
  },
  {
    id: 'c8', author: BOB, time: Date.now() - 200_000,
    text: 'Transition here feels abrupt — needs a fill.',
    timelineAt: 92.0,
  },
]

// ── State cards ───────────────────────────────────────────────────────────────

interface StatePanelProps {
  label: string
  comments: Comment[]
  showJumpTo?: boolean
  showRecord?: boolean
  replyOpen?: string  // commentId to pre-open reply on
}

function StatePanel({ label, comments, showJumpTo, showRecord }: StatePanelProps) {
  const [localComments, setLocalComments] = useState(comments)
  const [log, setLog] = useState<string | null>(null)

  function handleResolve(id: string, resolved: boolean) {
    setLocalComments(cs => cs.map(c => c.id === id ? { ...c, resolved } : c))
    setLog(resolved ? `Resolved ${id}` : `Unresolved ${id}`)
  }

  return (
    <State label={label}>
      <div style={{ width: 300, height: 420, display: 'flex', flexDirection: 'column' }}>
        <CommentsPanel
          comments={localComments}
          onPost={text => setLog(`Posted: ${typeof text === 'string' ? text : '[audio]'}`)}
          onReply={(id, text) => setLog(`Reply to ${id}: ${typeof text === 'string' ? text : '[audio]'}`)}
          onResolve={handleResolve}
          onJumpTo={showJumpTo ? secs => setLog(`Jump to ${secs}s`) : undefined}
          onRecord={showRecord ? stubRecord : undefined}
        />
      </div>
      {log && (
        <div style={{
          marginTop: 'var(--space-1)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-dim)',
        }}>
          {log}
        </div>
      )}
    </State>
  )
}

// ── States grid ───────────────────────────────────────────────────────────────

function StatesDemo() {
  return (
    <StatesGrid>
      <StatePanel label="empty — no comments" comments={EMPTY_COMMENTS} />
      <StatePanel label="text thread with replies" comments={TEXT_THREAD} />
      <StatePanel label="audio comments" comments={AUDIO_COMMENT} showRecord />
      <StatePanel label="resolved comment" comments={RESOLVED_COMMENT} />
      <StatePanel label="timeline-anchored (jump to)" comments={ANCHORED_COMMENT} showJumpTo />
      <StatePanel label="composing with record" comments={[]} showRecord />
    </StatesGrid>
  )
}

// ── Playground ────────────────────────────────────────────────────────────────

function PlaygroundDemo() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'p1', author: ALICE, time: Date.now() - 300_000,
      text: 'Love the opening riff — very strong.',
    },
    {
      id: 'p2', author: BOB, time: Date.now() - 120_000,
      text: 'Snare feels a bit thin in the bridge.',
      audio: STUB_AUDIO,
    },
  ])

  const [showRecord, setShowRecord] = useState(true)
  const [showJumpTo, setShowJumpTo] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const displayComments: Comment[] = showJumpTo
    ? comments.map((c, i) => ({ ...c, timelineAt: i * 30 + 12 }))
    : comments

  function handlePost(content: string | AudioRef) {
    const id = `p${Date.now()}`
    const text = typeof content === 'string' ? content : undefined
    const audio = typeof content === 'object' ? content : undefined
    setComments(cs => [
      ...cs,
      { id, author: CARA, time: Date.now(), text, audio },
    ])
    setLastAction(`Posted: ${typeof content === 'string' ? content : '[audio]'}`)
  }

  function handleReply(commentId: string, content: string | AudioRef) {
    setComments(cs => cs.map(c =>
      c.id === commentId
        ? {
            ...c,
            replies: [
              ...(c.replies ?? []),
              {
                id: `r${Date.now()}`,
                author: CARA,
                time: Date.now(),
                text: typeof content === 'string' ? content : undefined,
                audio: typeof content === 'object' ? content : undefined,
              },
            ],
          }
        : c
    ))
    setLastAction(`Reply to ${commentId}`)
  }

  function handleResolve(commentId: string, resolved: boolean) {
    setComments(cs => cs.map(c => c.id === commentId ? { ...c, resolved } : c))
    setLastAction(resolved ? `Resolved ${commentId}` : `Unresolved ${commentId}`)
  }

  return (
    <Playground>
      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Panel */}
        <div style={{ width: 300, height: 520, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <CommentsPanel
            comments={displayComments}
            onPost={handlePost}
            onReply={handleReply}
            onResolve={handleResolve}
            onJumpTo={showJumpTo ? secs => setLastAction(`Jump to ${secs}s`) : undefined}
            onRecord={showRecord ? stubRecord : undefined}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Toggle
            checked={showRecord}
            onChange={setShowRecord}
            size="sm"
            label="Voice recording"
          />
          <Toggle
            checked={showJumpTo}
            onChange={setShowJumpTo}
            size="sm"
            label="Timeline anchors"
          />
          {lastAction && (
            <div style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              paddingTop: 'var(--space-1)',
              borderTop: '1px solid var(--border)',
              maxWidth: 200,
            }}>
              {lastAction}
            </div>
          )}
        </div>
      </div>
    </Playground>
  )
}

// ── Default export ────────────────────────────────────────────────────────────

export default function CommentsPanelDemo() {
  return (
    <DemoShell meta={meta}>
      <StatesDemo />
      <PlaygroundDemo />
    </DemoShell>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx vitest run 2>&1 | tail -20
```

Expected: all pass, no regressions.

- [ ] **Step 3: Run tsc**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 4: Commit demo**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
git add src/components/CommentsPanel/CommentsPanel.demo.tsx
git commit -m "feat(CommentsPanel): gallery demo — all states

States: empty, text thread, audio comments, resolved comment,
timeline-anchored jump-to, composing with recording.
Playground: live post/reply/resolve with Toggle controls for
voice recording and timeline anchors. Fixtures: Alice/Bob/Cara
with track-color-1/3/4 avatar rings.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Final gate

**Files:** No new files.

- [ ] **Step 1: Full vitest run**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx vitest run 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 2: tsc --noEmit**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx tsc --noEmit 2>&1
```

Expected: clean.

- [ ] **Step 3: ESLint**

```bash
cd /Users/fernandofeitosa/dev/ui-jackdaw/.worktrees/comments-panel
npx eslint src/components/CommentsPanel/ 2>&1 | head -40
```

Expected: no errors.
