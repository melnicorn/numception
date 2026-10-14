// Pure, deterministic domain: no I/O, clock, randomness, platform or DOM (AD-1, AD-3).
export type { DomainError, DomainErrorCode } from './result/domain-error';
export { err, ok, type Result } from './result/result';

export { deriveSeed } from './random/derive-seed';

export { type Rational, rational, serialiseRational } from './numbers/rational';
export { displayValue } from './numbers/display-value';

export { MAX_TUNING_VALUE } from './tuning/max-tuning-value';
export {
  MAX_ATTEMPTS,
  MAX_N,
  MAX_PRESENTATION_MS,
  MIN_N,
  type TuningBand,
  type TuningBandRange,
  type TuningConfig,
  TuningConfigSchema,
  type TuningPresentation,
} from './tuning/tuning-config';
export { parseTuning } from './tuning/parse-tuning';

export type { NodeId } from './generator/node-id';
export { OPERATORS, type Operator } from './generator/operator';
export type { Puzzle, PuzzleClamp, PuzzleRoles } from './generator/puzzle';
export type { PuzzleBand, PuzzleSpec } from './generator/puzzle-spec';
export { DIFFICULTY_MODEL_VERSION } from './generator/difficulty-model-version';
export { GENERATOR_VERSION } from './generator/generator-version';
export type { PuzzleVersions } from './generator/puzzle-versions';
export { versionsFor } from './generator/versions-for';
export { realise } from './generator/realise';
export { nearMissCountFor, type SpecRequest, specFor } from './spec/spec-for';

export {
  type FixedTopCell,
  type PlanRequest,
  ROUND_TYPE_NAMES,
  type RoundPlan,
  type RoundPlanNode,
  type RoundTypeName,
} from './rounds/round-plan';
export { childrenOf, nodeCount, parentOf, tierWidth, topNodeId } from './rounds/round-node-id';
export { type IsSolved, planRound, realiseRoundNode, ROUND_TYPES, type RoundType, roundTypeOf, type SolveOutcome } from './rounds/round-types';
export { playOrder } from './rounds/play-order';
export { pathFromTop } from './rounds/path-from-top';

export type { Presentation, PresentationKind } from './presentation/presentation';
export { beatDuration } from './presentation/beat-duration';

export type { TapOutcome } from './rules/tap-outcome';
export { classifyTap } from './rules/classify-tap';

export type { BucketFeatures } from './difficulty/bucket-features';
export { bucketOf } from './difficulty/bucket-of';
export { formatBucketId } from './difficulty/format-bucket-id';
export { parseBucketId } from './difficulty/parse-bucket-id';

export { SHAPE_IDS, type ShapeId } from './layout/shape-id';
export type { CellGeometry, LayoutPoint, LayoutPolygon, OperatorGeometry, ShapeLayout } from './layout/shape-layout';
export { SHAPES } from './layout/shapes/shapes';
export { defaultShapeFor } from './layout/default-shape-for';
export { hitTest } from './layout/hit-test';
export { focusOrder } from './layout/focus-order';

export type { AppState, DeviceState } from './state/app-state';
export type { GameState, ProfileKind, ProfileSettings } from './state/game-state';
export type { Round } from './state/round';
export { type NodeKey, nodeKey } from './state/node-key';
export type { Command } from './state/command';
export type { CommandContext, Ulid } from './state/command-context';
export type { Envelope } from './state/envelope';
export type { GameEvent } from './state/game-event';
export type { StepResult } from './state/step-result';
export { initialAppState } from './state/initial-app-state';
export { createProfile } from './state/create-profile';
export { step } from './state/step';
export { nextRoundRequest } from './state/next-round-request';
export { completePresentation } from './state/complete-presentation';

export { KILN_TOKENS, type KilnTokens } from './view/kiln-tokens';
export type { NodeCellRef } from './view/node-cell-ref';
export type { PlayCellVM, PlayVM, PresentationVM } from './view/play-vm';
export { tapCommand } from './view/tap-command';
export { selectView } from './view/select-view';
export { hitTestView } from './view/hit-test-view';
