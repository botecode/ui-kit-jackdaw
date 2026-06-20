// src/components/FolderTrackHeader/FolderTrackHeader.tsx
import type { FxPlugin } from '../FxChip'
import styles from './FolderTrackHeader.module.css'

export type { FxPlugin }

export interface FolderTrack {
  id:           string
  name:         string
  color:        string
  parentId:     string | null
  childCount:   number
  muted:        boolean
  soloed:       boolean
  volumeDb:     number
  pan:          number
  plugins:      FxPlugin[]
  chainEnabled: boolean
  selected:     boolean
}

export interface FolderTrackHeaderProps {
  track:             FolderTrack
  onRename:          (name: string) => void
  onMute:            () => void
  onSolo:            () => void
  onVolume:          (db: number) => void
  onPan:             (pan: number) => void
  onToggleChain:     (next: boolean) => void
  onTogglePlugin:    (id: string, next: boolean) => void
  onReorder:         (from: number, to: number) => void
  onRemovePlugin:    (id: string) => void
  onAddPlugin:       () => void
  onOpenPlugin:      (id: string) => void
  onSelect:          () => void
  onToggleCollapse?: (collapsed: boolean) => void
  meterLevel?:       number
  meterLevelL?:      number
  meterLevelR?:      number
  anySoloActive?:    boolean
  disabled?:         boolean
  clipping?:         boolean
  showAllMeters?:    boolean
}

export function FolderTrackHeader(_props: FolderTrackHeaderProps) {
  return <div className={styles.root} />
}
