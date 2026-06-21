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
