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
export { pinnedTuning, type TuningsByVersion } from './tuning/tunings-by-version';

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
export type { SoftMissCue } from './presentation/soft-miss-cue';
export { beatDuration, softMissDuration } from './presentation/beat-duration';
export { MINIMAL_CROSSFADE_MS } from './presentation/minimal-crossfade-ms';
export { isMotionLevel, MOTION_LEVELS, type MotionLevel } from './settings/motion-level';
export { effectiveMotion } from './settings/effective-motion';
export { MAX_PLAYLIST_LENGTH, THEME_SELECTIONS, type ThemeSelection } from './settings/theme-selection';
export type { SettingChange, SettingKey } from './settings/setting-change';
export {
  FIRST_RUN_THEME_ID,
  type PresentationChoice,
  type PresentationRequest,
  selectPresentation,
} from './presentation/select-presentation';

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

export type { AppState, DeviceState, OsPreferences } from './state/app-state';
export { isPauseReason, PAUSE_REASONS, type PauseReason } from './state/pause-reason';
export type { GameState, ProfileKind, ProfileSettings } from './state/game-state';
export type { Round } from './state/round';
export { type NodeKey, nodeKey } from './state/node-key';
export type { Command } from './state/command';
export type { CommandContext, Ulid } from './state/command-context';
export type { Envelope } from './state/envelope';
export type { GameEvent } from './state/game-event';
export type { StepResult } from './state/step-result';
export { initialAppState } from './state/initial-app-state';
export { createProfile, KID_DEFAULTS } from './state/create-profile';
export { motionOf } from './state/motion-of';
export { CROSSFADE_TRANSITION_ID, DEFAULT_TRANSITION_ID } from './state/beat';
export { step } from './state/step';
export { nextRoundRequest } from './state/next-round-request';
export { completePresentation } from './state/complete-presentation';
export { puzzleInView } from './state/puzzle-in-view';

export { SAVE_FORMAT_VERSION } from './save/save-format-version';
export type { SaveDocument, SavePayload } from './save/save-document';
export type { DeviceSettingsDocument } from './save/device-settings';
export { canonicalJson } from './save/canonical-json';
export { saveChecksum } from './save/save-checksum';
export { MIGRATIONS, type SaveMigration, type SaveMigrations } from './save/migrations';
export { serializeGame } from './save/serialize-game';
export { type ParsedSave, parseSave, type SaveFormat } from './save/parse-save';
export { serializeDeviceSettings } from './save/serialize-device-settings';
export { parseDeviceSettings } from './save/parse-device-settings';
export { checkGameState } from './save/check-game-state';

export { type ThemeMode, type ThemeTokens, ThemeTokensSchema } from './theme/theme-tokens';
export { parseTheme } from './theme/parse-theme';
export { KILN_TOKENS } from './theme/kiln-tokens';
export { BUILTIN_THEMES, type ThemeCatalog, themeById } from './theme/theme-catalog';
export type { NodeCellRef } from './view/node-cell-ref';
export type { CameraVM, PlayCellVM, PlayContextVM, PlayVM, PresentationVM, SoftMissVM } from './view/play-vm';
export type { CameraRect } from './view/camera-rect';
export { tapCommand } from './view/tap-command';
export { GUIDE_LINE_TEXT, selectView } from './view/select-view';
export { hitTestView } from './view/hit-test-view';
