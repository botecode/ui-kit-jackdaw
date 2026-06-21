// src/components/CommentsPanel/CommentsPanel.tsx
//
// Collaboration comments side panel. Distinct from the timeline-pinned
// AnnotationEditor — this is the persistent project thread panel mounted
// in the shell. No overlay/portal needed.
//
// Design decisions recorded here (not relitigated in future):
// - Avatar: initials circle with --_avatar-color ring derived from the
//   same accent as the comment spine — always in sync.
// - Author accent: derived deterministically from a 6-slot track-color
//   palette keyed by author.id; respects author.color if already set.
//   Current user's comments use --accent so "mine" reads at a glance.
// - Waveform: 12-bar static decorative SVG; real playback is app-level.
// - Thread depth: 1 level of indented replies (no recursive threading).
// - Composer: raw <textarea> — TextField is single-line; multi-line is
//   the correct affordance here.
// - Badge: inline unresolved-count chip (Badge not yet built in kit).
// - Play chip: accent bloom on data-playing; accent color (not green LED)
//   because this is playback not transport-arm state.

import { useState } from 'react'
import {
  ChatCircle,
  CheckCircle,
  ArrowBendUpLeft,
  Play,
  Pause,
  Microphone,
  PaperPlaneTilt,
  X,
  Clock,
} from '@phosphor-icons/react'
import styles from './CommentsPanel.module.css'

// ── Author accent palette ─────────────────────────────────────────────────────

// 6-slot palette using track-color tokens — same family as clip/track spines.
// Ordered to maximise perceptual distance between adjacent indices.
const AUTHOR_PALETTE = [
  'var(--track-color-1)', // warm orange
  'var(--track-color-3)', // sky blue
  'var(--track-color-4)', // violet
  'var(--track-color-2)', // sage green
  'var(--track-color-5)', // amber
  'var(--track-color-6)', // rose red
]

function hashAuthorId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function authorAccent(author: CommentAuthor): string {
  if (author.color) return author.color
  return AUTHOR_PALETTE[hashAuthorId(author.id) % AUTHOR_PALETTE.length]
}

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
  currentUserId?: string
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
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatTimeline(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Static bar heights — decorative waveform, not data-driven
const WAVE_BARS = [4, 8, 12, 10, 14, 9, 6, 11, 13, 7, 5, 10]

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ author, accent }: { author: CommentAuthor; accent: string }) {
  return (
    <div
      className={styles.avatar}
      style={{ '--_avatar-color': accent } as React.CSSProperties}
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
}

function ReplyComposer({ commentId, onReply, onCancel }: ReplyComposerProps) {
  const [draft, setDraft] = useState('')

  function handleSend() {
    if (!draft.trim()) return
    onReply(commentId, draft.trim())
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
          disabled={!draft.trim()}
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
  currentUserId?: string
}

function CommentCard({ comment, onReply, onResolve, onJumpTo, currentUserId }: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)

  const isMe = !!currentUserId && comment.author.id === currentUserId
  // Current user's comments use --accent so "mine" is immediately distinct.
  const accent = isMe ? 'var(--accent)' : authorAccent(comment.author)

  function handleReplySubmit(id: string, content: string | AudioRef) {
    onReply(id, content)
    setReplyOpen(false)
  }

  return (
    <div
      className={styles.commentCard}
      data-resolved={comment.resolved || undefined}
      data-own={isMe || undefined}
      data-testid={`comment-card-${comment.id}`}
      style={{ '--_author-accent': accent } as React.CSSProperties}
    >
      {/* Header: avatar + author + time */}
      <div className={styles.commentHeader}>
        <Avatar author={comment.author} accent={accent} />
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

      {/* Timeline anchor — only when onJumpTo handler is wired */}
      {comment.timelineAt !== undefined && onJumpTo && (
        <button
          className={styles.jumpTo}
          onClick={() => onJumpTo(comment.timelineAt!)}
          type="button"
          aria-label={`Jump to ${formatTimeline(comment.timelineAt)}`}
        >
          <Clock weight="bold" size={10} aria-hidden="true" />
          {formatTimeline(comment.timelineAt)}
        </button>
      )}

      {/* Actions */}
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
          <CheckCircle
            weight={comment.resolved ? 'fill' : 'regular'}
            size={11}
            aria-hidden="true"
          />
          {comment.resolved ? 'Unresolve' : 'Resolve'}
        </button>
      </div>

      {/* Replies — thread connector uses parent accent; each reply gets its own spine */}
      {comment.replies && comment.replies.length > 0 && (
        <div
          className={styles.replies}
          data-testid={`replies-${comment.id}`}
          style={{ '--_reply-accent': accent } as React.CSSProperties}
        >
          {comment.replies.map(reply => {
            const replyIsMe = !!currentUserId && reply.author.id === currentUserId
            const replyAccent = replyIsMe ? 'var(--accent)' : authorAccent(reply.author)
            return (
              <div
                key={reply.id}
                className={styles.replyCard}
                data-testid={`reply-card-${reply.id}`}
                data-own={replyIsMe || undefined}
                style={{ '--_author-accent': replyAccent } as React.CSSProperties}
              >
                <div className={styles.replyHeader}>
                  <Avatar author={reply.author} accent={replyAccent} />
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
            )
          })}
        </div>
      )}

      {/* Inline reply composer */}
      {replyOpen && (
        <ReplyComposer
          commentId={comment.id}
          onReply={handleReplySubmit}
          onCancel={() => setReplyOpen(false)}
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
  }

  function handlePostAudio() {
    if (!audioDraft) return
    onPost(audioDraft)
    setAudioDraft(null)
  }

  function handleDiscard() {
    setAudioDraft(null)
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
  currentUserId,
  onPost,
  onReply,
  onResolve,
  onJumpTo,
  onRecord,
}: CommentsPanelProps) {
  const unresolvedCount = comments.filter(c => !c.resolved).length

  return (
    <div className={styles.root} data-testid="comments-panel">
      {/* Header */}
      <div className={styles.header}>
        <ChatCircle className={styles.headerIcon} weight="bold" size={14} aria-hidden="true" />
        <span className={styles.headerTitle}>Comments</span>
        {unresolvedCount > 0 && (
          <span className={styles.badge} aria-label={`${unresolvedCount} unresolved`}>
            {unresolvedCount}
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
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      {/* Bottom composer */}
      <Composer onPost={onPost} onRecord={onRecord} />
    </div>
  )
}
