// Imperative shell: store, dispatch, scheduler, pipelines and ports (AD-2).
export { createGame, type EntropySource, type Game, type GameListener, type GameOptions } from './game';
export { createScheduler, type FrameLoop, type PauseReason, type Scheduler, type SchedulerOptions } from './scheduler';
export type { DeviceLoad, ProfileLoad, StorageDriver, StoragePort, StoreName } from './storage-port';
export { createSlotStorage, DEVICE_KEY, slotKey } from './slot-storage';
export {
  createSaveWriter,
  FIRST_BACKOFF_MS,
  MAX_BACKOFF_MS,
  saveAfterBatches,
  type SaveWriter,
  type SaveWriterOptions,
  type SaveWriterStats,
} from './save-writer';
export { type LoadedSession, loadSave } from './load-save';
export type { LifecycleCommand, LifecyclePort } from './lifecycle-port';
export { type AudioChannels, type AudioPort, type CueId, type CueParams, noAudio } from './audio-port';
export { type HapticKind, type HapticsPort, noHaptics } from './haptics-port';
export {
  DEFAULT_FEEDBACK_FLAGS,
  type FeedbackControls,
  type FeedbackFlags,
  type FeedbackFlagStore,
  parseFeedbackFlags,
} from './feedback-flags';
export {
  type Cue,
  createFeedbackDirector,
  cuesFor,
  type FeedbackDirector,
  type FeedbackDirectorOptions,
  solveStep,
} from './feedback-director';
export {
  DEMO_NODE_ID,
  DEMO_SEED,
  type DemoPuzzleCell,
  type DemoPuzzleResult,
  type DemoPuzzleView,
  demoPuzzle,
} from './demo-puzzle';
export {
  type InspectedCell,
  type InspectedNode,
  type InspectedTier,
  type InspectRoundRequest,
  type InspectRoundResult,
  inspectRound,
  type RoundInspectorView,
} from './inspect-round';
export { type LoadedThemeCatalog, loadThemeCatalog, type RejectedTheme } from './theme-catalog';
export { type RoundInspectorOptions, roundInspectorOptions, type TuningInspectorOptions } from './round-inspector-options';

// For the adapters and the composition root: render and ui may import core only as
// types (AD-1), so the view and hit-test API they need comes through here.
export {
  type CameraRect,
  type CameraVM,
  type Command,
  type CommandContext,
  type GameEvent,
  hitTestView,
  KILN_TOKENS,
  type LayoutPoint,
  type LayoutPolygon,
  type NodeCellRef,
  type NodeId,
  type PlayCellVM,
  type PlayContextVM,
  type PlayVM,
  type PresentationVM,
  parseTuning,
  type Puzzle,
  puzzleInView,
  type SoftMissVM,
  tapCommand,
  type ThemeCatalog,
  type ThemeTokens,
  type TuningConfig,
  type TuningsByVersion,
} from '@numception/core';
