// Hand-mirrored from /shared/schema.json.
// When schema grows, replace this file with codegen output from shared/codegen/.
// IMPORTANT: trackId is always the engine's te::EditItemID. No mock ids cross the bridge.

export type MeterReading = {
  trackId: string;
  dBL: number; // dBFS; -100 when silent
  dBR: number;
};

export type InputInfo = {
  id: string; // WaveInputDevice::getDeviceID()
  name: string;
  label: string; // empty string when not set
};

export type TrackInfo = {
  id: string; // te::EditItemID — always use as trackId in bridge messages
  name: string;
  kind: "audio" | "folder";
  parentId: string | null; // null = top-level track; folder id = nested inside that folder
};

export type ClipInfo = {
  clipId: string;
  start: number; // seconds
  length: number; // seconds
  label: string;
  peaks?: number[]; // ~200 normalized amplitude values (0–1) for waveform display
};

export type PluginInfo = {
  id: string; // PluginDescription::createIdentifierString()
  name: string;
  vendor: string;
  category: string;
  format: string; // "VST3"
};

export type TrackPluginInfo = {
  id: string; // PluginDescription::createIdentifierString()
  name: string;
};

// One plugin instance in a track's chain.
// identifier = VST3 catalog identity (same as plugins.available uses)
// instanceId = stable per-instance id assigned by the engine (used for remove/reorder/copy)
export type ChainPluginEntry = {
  instanceId: string;
  identifier: string;
  name: string;
  index: number; // 0-based position in the signal path
};

// Richer plugin entry used in plugins.state (adds version field).
export type PluginEntry = {
  id: string; // VST3 identifier — same id as track.addPlugin uses
  name: string;
  vendor: string;
  category: string;
  format: "VST3";
  version: string;
};

export type ScanProgress = {
  current: string; // path of plugin currently being scanned
  done: number;
  total: number;
};

export type FailedPlugin = {
  path: string;
  reason: string;
};

// One entry in the app-level recent-projects list (project.recent event).
// NOT song/project.json state — drives the welcome picker + launch auto-reopen.
export type RecentProject = {
  name: string;
  path: string; // absolute "*.jackdaw" folder
  lastOpenedMs: number; // epoch milliseconds
};

export type UICommand =
  | { type: "ping" }
  | { type: "transport.play" }
  | { type: "transport.stop"; discardRecording?: boolean }
  | { type: "transport.seek"; seconds: number }
  | { type: "inputs.list" }
  | { type: "inputs.setLabel"; id: string; label: string }
  | { type: "track.setInput"; trackId: string; inputId: string }
  | { type: "track.arm"; trackId: string; armed: boolean }
  | { type: "track.setMonitoring"; trackId: string; enabled: boolean }
  // Per-track mixer (mute / solo / volume / pan). Engine is the source of truth — these replace
  // the old toggleMute/toggleSolo console.log stubs and the local-only volume slider.
  | { type: "track.setMute"; trackId: string; muted: boolean }
  | { type: "track.setSolo"; trackId: string; soloed: boolean }
  | { type: "track.setVolume"; trackId: string; db: number } // db in [-60, 6]
  | { type: "track.setPan"; trackId: string; pan: number } // pan in [-1, 1]: -1 L, 0 center, +1 R
  // Peer-to-peer (Croc) raw-audio track sharing. v0 = clips (WAV) + name + clip start/length only.
  // track.send replies with share.code; both report share.progress. Errors via engine.notify.
  | { type: "track.send"; trackId: string }
  | { type: "track.receive"; trackId: string; code: string } // trackId = the FREE target track
  | { type: "share.cancel" } // abort the active send/receive
  | { type: "transport.record" }
  | { type: "clip.delete"; clipId: string }
  // Move a clip to a new timeline position. start is seconds from the origin, clamped to >= 0.
  // trackId is optional: omit/empty = same track; a different trackId moves the clip cross-track.
  // Snapping/grid is a UI concern, not part of the contract. Engine replies with clip.moved.
  | { type: "clip.move"; clipId: string; start: number; trackId?: string }
  // Track-level context-menu commands. All reuse tracks.list (+ existing per-track events);
  // no dedicated response event. track.clone inserts the copy directly below the source.
  // track.delete: for Folder tracks, withContents=false (default) promotes children; true deletes all.
  | { type: "track.delete"; trackId: string; withContents?: boolean }
  | { type: "track.clone"; trackId: string }
  // track.rename: empty/whitespace-only name is rejected by the engine (track keeps current name).
  | { type: "track.rename"; trackId: string; name: string }
  // Folder track ops. track.addFolder creates a Folder (name required; childIds optional seeds it).
  // track.move reparents/reorders: parentId=null moves to top level; index=0-based within new parent.
  | { type: "track.addFolder"; name: string; childIds?: string[] }
  | { type: "track.move"; trackId: string; parentId: string | null; index: number }
  | { type: "take.save" }
  | { type: "plugins.scan" }
  | { type: "track.addPlugin"; trackId: string; pluginId: string }
  | { type: "track.add"; name?: string }
  | { type: "plugins.addFolder"; path: string }
  | { type: "plugins.removeFolder"; path: string }
  | { type: "plugins.rescan"; mode: "incremental" | "skipKnown" | "full" }
  | { type: "plugins.cancelScan" }
  | { type: "project.setTempo"; bpm: number }
  | { type: "project.setTimeSignature"; numerator: number; denominator: number }
  // Project-FILE lifecycle (distinct from the project.setTempo tempo pair above).
  | { type: "project.new"; name: string; parentPath: string }
  | { type: "project.open"; path: string }
  | { type: "project.save" }
  | { type: "project.requestRecent" }
  | { type: "plugin.add"; trackId: string; identifier: string; index?: number }
  | { type: "plugin.remove"; trackId: string; instanceId: string }
  | { type: "plugin.reorder"; trackId: string; instanceId: string; toIndex: number }
  | { type: "plugin.copy"; trackId: string; instanceId: string }
  | { type: "plugin.paste"; trackId: string; token: string; index?: number }
  // Open/close a plugin instance's native editor window (engine-owned; never hosted in the WebView).
  | { type: "plugin.openEditor"; trackId: string; instanceId: string }
  | { type: "plugin.closeEditor"; trackId: string; instanceId: string }
  | {
      type: "metronome.set";
      enabled?: boolean;
      accentDb?: number;
      beatDb?: number;
      duringPlayback?: boolean;
      duringRecording?: boolean;
      countInBeforePlayback?: boolean;
      countInBeforeRecording?: boolean;
    };

export type EngineEvent =
  | { type: "pong" }
  | {
      type: "engine.frame";
      playing: boolean;
      recording: boolean;
      seconds: number;
      durationSeconds: number;
      meters: MeterReading[];
    }
  | { type: "inputs.available"; inputs: InputInfo[] }
  | { type: "record.started" }
  | { type: "record.stopped" }
  | { type: "clip.added"; trackId: string; clip: ClipInfo }
  // Authoritative clip position after a clip.move (start in seconds, clamped >= 0). trackId is the
  // clip's possibly-new track. The UI reconciles its optimistic drag to this. Clip position is
  // project state (persisted/restored by the engine), not a contract concern beyond this event.
  | { type: "clip.moved"; trackId: string; clipId: string; start: number }
  | { type: "take.saved"; takeId: string; masterPath: string }
  | { type: "render.progress"; takeId: string; pct: number }
  | { type: "tracks.list"; tracks: TrackInfo[] }
  // Authoritative per-track mixer state. Emitted after every track.setMute/setSolo/setVolume/setPan
  // and once per track on (re)list / project load. db in [-60, 6]; pan in [-1, 1].
  | {
      type: "track.mixer";
      trackId: string;
      muted: boolean;
      soloed: boolean;
      db: number;
      pan: number;
    }
  // Peer-to-peer (Croc) raw-audio track sharing. share.code = the one-time phrase to hand off;
  // share.progress reports both directions. On receive "done", clips replay via tracks.list + clip.added.
  | { type: "share.code"; code: string }
  | {
      type: "share.progress";
      direction: "send" | "receive";
      phase: "starting" | "transferring" | "done" | "error";
      pct?: number; // 0–1, only during "transferring"
    }
  | { type: "engine.notify"; level: "error" | "info"; message: string }
  | { type: "plugins.available"; plugins: PluginInfo[] }
  | { type: "track.chain"; trackId: string; plugins: TrackPluginInfo[] }
  | {
      type: "plugins.state";
      folders: string[];
      plugins: PluginEntry[];
      scanning: boolean;
      progress: ScanProgress | null;
      failed: FailedPlugin[];
    }
  | { type: "plugins.scanProgress"; current: string; done: number; total: number }
  | { type: "project.state"; bpm: number; numerator: number; denominator: number }
  // Project-FILE lifecycle (distinct from the project.state tempo pair above).
  | { type: "project.opened"; name: string; path: string }
  | { type: "project.needsSelection" }
  | { type: "project.recent"; projects: RecentProject[] }
  | { type: "project.saved"; path: string }
  | { type: "track.plugins"; trackId: string; plugins: ChainPluginEntry[] }
  | { type: "plugin.clipboard"; token: string; name: string }
  // Authoritative open/closed state of a plugin's native editor window. `open` is the source of truth.
  | { type: "plugin.editorState"; trackId: string; instanceId: string; open: boolean }
  | {
      type: "metronome.state";
      enabled: boolean;
      accentDb: number;
      beatDb: number;
      duringPlayback: boolean;
      duringRecording: boolean;
      countInBeforePlayback: boolean;
      countInBeforeRecording: boolean;
    };
