// Imperative shell: store, dispatch, scheduler, pipelines and ports (AD-2).
export { createGame, type EntropySource, type Game, type GameListener, type GameOptions } from './game';
export { createScheduler, type FrameLoop, type PauseReason, type Scheduler, type SchedulerOptions } from './scheduler';
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
export { type RoundInspectorOptions, roundInspectorOptions, type TuningInspectorOptions } from './round-inspector-options';

// For the adapters and the composition root: render and ui may import core only as
// types (AD-1), so the view and hit-test API they need comes through here.
export {
  type Command,
  type CommandContext,
  type GameEvent,
  hitTestView,
  type KilnTokens,
  type LayoutPoint,
  type LayoutPolygon,
  type NodeCellRef,
  type NodeId,
  type PlayCellVM,
  type PlayVM,
  type PresentationVM,
  parseTuning,
  tapCommand,
  type TuningConfig,
} from '@numception/core';
