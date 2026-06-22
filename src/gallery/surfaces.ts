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
  Checkbox: ALL,
  ColorSwatch: ALL,
  ContextMenu: ALL,
  Dialog: ALL,
  InputSelect: ALL,
  Kbd: ALL,
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
  MuteSoloToggle: ['app', 'daw'],
  PanKnob: ['app', 'daw'],

  // ── In-product chrome / management / collaboration (app + daw) ─────────────
  AnnotationEditor: ['app', 'daw'],
  AppShell: ['app', 'daw'],
  CommentsPanel: ['app', 'daw'],
  ExportDialog: ['app', 'daw'],
  IdeasLibrary: ['app', 'daw'],
  ImportFirst: ['app', 'daw'],
  LyricCRUD: ['app', 'daw'],
  VoiceIdeaCRUD: ['app', 'daw'],
  IncomingManifest: ['app', 'daw'],
  IncomingShare: ['app'],
  LookAndFeelPanel: ['app', 'daw'],
  NavRail: ['app', 'daw'],
  PairQRCode: ['app', 'daw'], // pairing bridges the phone companion and the desktop DAW
  Preferences: ['app', 'daw'],
  ProjectPicker: ['app', 'daw'],
  Shortcuts: ['app', 'daw'],
  SongNotesEditor: ['app', 'daw'],
  SplashScreen: ['app', 'daw'],
  Versions: ['app', 'daw'],

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
  EditCursor: ['daw'],
  FocusedTrackDetailPanel: ['daw'],
  FolderTrackHeader: ['daw'],
  FxChip: ['daw'],
  InputLabels: ['daw'],
  Mixer: ['daw'],
  PhaseInvert: ['daw'],
  PianoRoll: ['daw'],
  Playhead: ['daw'],
  RecordMode: ['daw'],
  RepeatToggle: ['daw'],
  ReturnTrackHeader: ['daw'],
  SendChip: ['daw'],
  TimelineGrid: ['daw'],
  TimelineRuler: ['daw'],
  TimeSelection: ['daw'],
  TrackHeader: ['daw'],
  TrackLane: ['daw'],
  TransportBar: ['daw'],
  TransportButton: ['daw'],
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
