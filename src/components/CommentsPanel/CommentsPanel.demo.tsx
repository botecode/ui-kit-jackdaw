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

// ── Stub audio fixtures ───────────────────────────────────────────────────────

const STUB_AUDIO: AudioRef = { url: 'stub://voice', durationMs: 4200 }
const SHORT_AUDIO: AudioRef = { url: 'stub://short', durationMs: 1500 }

function stubRecord(): Promise<AudioRef> {
  return new Promise(resolve =>
    setTimeout(() => resolve({ url: 'stub://voice', durationMs: 2800 }), 1500)
  )
}

// ── Fixture comment sets ──────────────────────────────────────────────────────

const TEXT_THREAD: Comment[] = [
  {
    id: 'c1', author: ALICE, time: Date.now() - 600_000,
    text: 'Can we push the chorus a little harder? The reverb tail is washing it out.',
    replies: [
      { id: 'r1', author: BOB, time: Date.now() - 540_000, text: "Agreed — I'll tighten the pre-delay." },
      { id: 'r2', author: CARA, time: Date.now() - 480_000, text: 'Also try pulling the high-shelf down 2dB.' },
    ],
  },
  {
    id: 'c2', author: BOB, time: Date.now() - 300_000,
    text: 'The verse vocal is a touch flat around bar 12.',
  },
]

const AUDIO_COMMENTS: Comment[] = [
  {
    id: 'c3', author: CARA, time: Date.now() - 900_000,
    audio: STUB_AUDIO,
  },
  {
    id: 'c4', author: ALICE, time: Date.now() - 200_000,
    text: 'Left a voice note about the bridge arrangement.',
    audio: SHORT_AUDIO,
  },
]

const RESOLVED_COMMENTS: Comment[] = [
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

const ANCHORED_COMMENTS: Comment[] = [
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

// ── State card helper ─────────────────────────────────────────────────────────

interface StatePanelProps {
  label: string
  comments: Comment[]
  showJumpTo?: boolean
  showRecord?: boolean
}

function StatePanel({ label, comments, showJumpTo, showRecord }: StatePanelProps) {
  const [localComments, setLocalComments] = useState(comments)
  const [log, setLog] = useState<string | null>(null)

  function handlePost(content: string | AudioRef) {
    const id = `new-${Date.now()}`
    const isAudio = typeof content === 'object'
    setLocalComments(cs => [
      ...cs,
      {
        id,
        author: ALICE,
        time: Date.now(),
        text: isAudio ? undefined : (content as string),
        audio: isAudio ? (content as AudioRef) : undefined,
      },
    ])
    setLog(`Posted: ${isAudio ? '[voice note]' : (content as string)}`)
  }

  function handleReply(cid: string, content: string | AudioRef) {
    setLog(`Reply to ${cid}: ${typeof content === 'string' ? content : '[voice note]'}`)
  }

  function handleResolve(cid: string, resolved: boolean) {
    setLocalComments(cs => cs.map(c => c.id === cid ? { ...c, resolved } : c))
    setLog(resolved ? `Resolved ${cid}` : `Unresolved ${cid}`)
  }

  return (
    <State label={label}>
      <div style={{ width: 300, height: 420, display: 'flex', flexDirection: 'column' }}>
        <CommentsPanel
          comments={localComments}
          onPost={handlePost}
          onReply={handleReply}
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
      <StatePanel label="empty — no comments" comments={[]} />
      <StatePanel label="text thread with replies" comments={TEXT_THREAD} />
      <StatePanel label="audio comments (play chip)" comments={AUDIO_COMMENTS} />
      <StatePanel label="resolved comment" comments={RESOLVED_COMMENTS} />
      <StatePanel label="timeline-anchored (jump to)" comments={ANCHORED_COMMENTS} showJumpTo />
      <StatePanel label="composing with voice record" comments={[]} showRecord />
      <StatePanel
        label="full panel — all features"
        comments={[...TEXT_THREAD, ...AUDIO_COMMENTS.slice(0, 1), ...ANCHORED_COMMENTS.slice(0, 1), ...RESOLVED_COMMENTS.slice(0, 1)]}
        showJumpTo
        showRecord
      />
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
      audio: STUB_AUDIO,
    },
    {
      id: 'p3', author: CARA, time: Date.now() - 60_000,
      text: 'Snare feels a bit thin in the bridge.',
      replies: [
        { id: 'p3-r1', author: ALICE, time: Date.now() - 30_000, text: 'Agreed — layering a rim shot should help.' },
      ],
    },
  ])

  const [showRecord, setShowRecord] = useState(true)
  const [showJumpTo, setShowJumpTo] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const displayComments: Comment[] = showJumpTo
    ? comments.map((c, i) => ({ ...c, timelineAt: i * 30 + 12 }))
    : comments

  function handlePost(content: string | AudioRef) {
    const isAudio = typeof content === 'object'
    const id = `pg-${Date.now()}`
    setComments(cs => [
      ...cs,
      {
        id,
        author: CARA,
        time: Date.now(),
        text: isAudio ? undefined : (content as string),
        audio: isAudio ? (content as AudioRef) : undefined,
      },
    ])
    setLastAction(`Posted: ${isAudio ? '[voice note]' : (content as string)}`)
  }

  function handleReply(commentId: string, content: string | AudioRef) {
    const isAudio = typeof content === 'object'
    setComments(cs => cs.map(c => {
      if (c.id !== commentId) return c
      return {
        ...c,
        replies: [
          ...(c.replies ?? []),
          {
            id: `r${Date.now()}`,
            author: BOB,
            time: Date.now(),
            text: isAudio ? undefined : (content as string),
            audio: isAudio ? (content as AudioRef) : undefined,
          },
        ],
      }
    }))
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
            label="Timeline anchors (jump to)"
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
