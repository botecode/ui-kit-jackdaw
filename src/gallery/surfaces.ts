// src/gallery/surfaces.ts
//
// The surface axis — where in the product a component is used.
// The kit now serves three surfaces: the marketing website (`web`), the mobile
// companion app (`app`), and the desktop DAW (`daw`). A component can live on
// more than one; most shared primitives live on all three.
//
// This is the central, auditable home for surface tagging — gallery metadata
// only, it never touches component code or APIs. New components default to all
// three surfaces (see `surfacesFor`), so the gallery never hides a fresh demo;
// narrow a component by adding an explicit entry below.

export type Surface = 'web' | 'app' | 'daw'

/** All surfaces, in display order. The "All" filter is the absence of a surface. */
export const SURFACES: readonly Surface[] = ['web', 'app', 'daw']

/** Human labels for the nav filter. */
export const SURFACE_LABELS: Record<Surface, string> = {
  web: 'Web',
  app: 'App',
  daw: 'DAW',
}

const ALL: Surface[] = ['web', 'app', 'daw']

// Tagging methodology (recorded so a reviewer can audit a call in one place):
//   • Generic UI primitives (Button-likes, fields, overlays, feedback) → all three.
//   • Audio instrument controls that a mobile mixer could also show
//     (Fader, PanKnob, Meter, MuteSoloToggle, Clock, DotMatrix) → app + daw.
//   • DAW-workspace surfaces (arrangement, mixer, transport, track internals,
//     timeline, FX/automation/phase) → daw.
//   • In-product chrome that isn't on the marketing site (shells, settings,
//     project/idea management, collaboration) → app + daw.
//   • Mobile companion surfaces (mobile chrome, on-the-go idea capture, the
//     pocket radio) → app only.
//   • Auth / onboarding / support, shown on the site and in the app → web + app.
//   • Marketing/landing building blocks → web.
// When unsure, prefer the broader tag — the filter is a convenience, not a wall.
export const SURFACE_TAGS: Record<string, Surface[]> = {
  // ── Marketing website ──────────────────────────────────────────────────────
  CTABanner: ['web'],
  DemoPlayer: ['web'],
  Faq: ['web'],
  FeatureGrid: ['web'],
  Hero: ['web'],
  Marquee: ['web'],
  PricingPlans: ['web'],
  ProductFrame: ['web'],
  Showcase: ['web'],
  SiteHeader: ['web'],
  SiteFooter: ['web'],
  SpecStrip: ['web'],

  // ── Auth / onboarding / support (site + app) ───────────────────────────────
  PasswordEntry: ['web', 'app'],
  OnboardingStep: ['web', 'app'],
  SupportFlow: ['web', 'app'],

  // ── Generic UI primitives (everywhere) ─────────────────────────────────────
  Avatar: ALL,
  Badge: ALL,
  // Keyed by the demo's `meta.name` (the nav label), which differs from the
  // directory name for these two:
  'Brand mark': ALL, // BrandMark/
  'Share (Take)': ALL, // Share/
  Button: ALL,
  Checkbox: ALL,
  ColorSwatch: ALL,
  ContextMenu: ALL,
  Dialog: ALL,
  InputSelect: ALL,
  Kbd: ALL,
  // On-screen instrument keyboard — plugin/host UIs (daw) + a mobile player
  // could play notes too (app). Not a marketing-site element.
  Keyboard: ['app', 'daw'],
  NumberField: ALL,
  Panel: ALL,
  Popover: ALL,
  Progress: ALL,
  ScrollArea: ALL,
  SegmentedControl: ALL,
  ShareLink: ALL,
  Tabs: ALL,
  TextField: ALL,
  ThemeSwitcher: ALL,
  Toast: ALL,
  Toggle: ALL,
  Tooltip: ALL,

  // ── Instrument controls a mobile mixer could also show (app + daw) ─────────
  Clock: ['app', 'daw'],
  DotMatrix: ['app', 'daw'],
  Fader: ['app', 'daw'],
  Meter: ['app', 'daw'],
  Metronome: ['app', 'daw'],
  MuteSoloToggle: ['app', 'daw'],
  PanKnob: ['app', 'daw'],

  // ── In-product chrome / management / collaboration (app + daw) ─────────────
  AnnotationEditor: ['app', 'daw'],
  AppShell: ['app', 'daw'],
  CollectionView: ['app', 'daw'],
  CommentsPanel: ['app', 'daw'],
  CoverPicker: ['app', 'daw'], // dress an album/song sleeve — in-product, not the marketing site
  DangerConfirm: ['app', 'daw'], // destructive confirm gate — in-product, not the marketing site
  ExportDialog: ['app', 'daw'],
  FlyHighButton: ['app', 'daw'], // Home's catch-ideas (High mode) hero — in-product, not the marketing site
  'High Mode': ['app', 'daw'], // the full catch-ideas flow (Focus mode) — pick → record → review → save
  HighTake: ['app', 'daw'], // High mode's captured-take trim review — same catch-ideas family
  IdeasLibrary: ['app', 'daw'],
  ImportFirst: ['app', 'daw'],
  LyricCRUD: ['app', 'daw'],
  MasterPlayer: ['app', 'daw'], // Home's song-card / collection master mini-player — in-product, plays the rendered master
  NowPlayingBar: ['app', 'daw'], // pinned deck-edge now-playing strip — streaming-style transport + scrub, in-product
  VoiceIdeaCRUD: ['app', 'daw'],
  IncomingManifest: ['app', 'daw'],
  IncomingShare: ['app'],
  LookAndFeelPanel: ['app', 'daw'],
  NavRail: ['app', 'daw'],
  PairQRCode: ['app', 'daw'], // pairing bridges the phone companion and the desktop DAW
  Preferences: ['app', 'daw'],
  ProjectPicker: ['app', 'daw'],
  ReferenceList: ['app', 'daw'],
  Seeker: ['app', 'daw'], // scrubbable position groove — shared by MasterPlayer + CollectionView's album player
  ClipPlayer: ['app', 'daw'], // Ideas-nest clip player — scrubbable waveform, play from any point
  Shortcuts: ['app', 'daw'],
  SongNotesEditor: ['app', 'daw'],
  SplashScreen: ['app', 'daw'],
  StudioSessionCard: ['app', 'daw'], // song page's gateway into the studio — the hero door, in-product chrome
  Versions: ['app', 'daw'],
  WorkspaceCard: ['app', 'daw'], // Home gallery card for a song / collection — in-product chrome
  WorkspaceSetup: ['app', 'daw'], // first-run + new-workspace setup dialog — in-product chrome
  WorkspaceSidebar: ['app', 'daw'],
  WorkspaceSwitcher: ['app', 'daw'], // top-of-sidebar identity + workspace switch menu

  // ── Mobile companion app surfaces (app only) ───────────────────────────────
  MobileRecordButton: ['app'],
  MobileSegmented: ['app'],
  MobileTabBar: ['app'],
  MobileTopBar: ['app'],
  RadioPlayer: ['app'],
  SyncHub: ['app'], // the phone companion's sync home, opened by the topbar QR icon

  // ── DAW workspace only ─────────────────────────────────────────────────────
  AnnotationLane: ['daw'],
  ArmButton: ['daw'],
  Arrangement: ['daw'],
  AutomationButton: ['daw'],
  AutomationLane: ['daw'],
  ChannelStrip: ['daw'],
  Clip: ['daw'],
  DeviceChassis: ['daw'],
  EditCursor: ['daw'],
  FocusedTrackDetailPanel: ['daw'],
  FolderTrackHeader: ['daw'],
  FxChip: ['daw'],
  FxPicker: ['daw'],
  InputLabels: ['daw'],
  InstrumentTemplate: ['daw'],
  LivingInstrumentCard: ['daw'],
  Mixer: ['daw'],
  PhaseInvert: ['daw'],
  PianoRoll: ['daw'],
  PluginGraph: ['daw'], // plugin UI graph/analyzer surface — EQ curve + spectrum + LFO scope
  Playhead: ['daw'],
  RecordMode: ['daw'],
  RepeatToggle: ['daw'],
  ReturnTrackHeader: ['daw'],
  SendChip: ['daw'],
  TapeStrip: ['daw'],
  TimelineGrid: ['daw'],
  TimelineRuler: ['daw'],
  TimeSelection: ['daw'],
  TrackHeader: ['daw'],
  TrackLane: ['daw'],
  TransportBar: ['daw'],
  TransportButton: ['daw'],
  Tuner: ['app', 'daw'], // instrument-room tool — tune on the phone before capturing an idea
}

/**
 * Surfaces a component belongs to. Unknown / untagged names default to all three
 * so a freshly-built demo always shows up — narrow it by adding a tag above.
 */
export function surfacesFor(name: string): Surface[] {
  return SURFACE_TAGS[name] ?? ALL
}

/**
 * Filter a list of named items to those on `surface`. The sentinel `'all'`
 * (the default nav state) returns everything untouched.
 */
export function filterBySurface<T extends { name: string }>(
  items: T[],
  surface: Surface | 'all',
): T[] {
  if (surface === 'all') return items
  return items.filter(item => surfacesFor(item.name).includes(surface))
}
