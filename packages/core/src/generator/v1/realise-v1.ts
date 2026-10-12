import { rational } from '../../numbers/rational';
import { nodeStream } from '../../random/node-stream';
import type { RandomStream } from '../../random/random-stream';
import { err, ok } from '../../result/result';
import type { GeneratorImpl } from '../generator-impl';
import type { NodeId } from '../node-id';
import type { Puzzle, PuzzleRoles } from '../puzzle';
import type { PuzzleBand, PuzzleSpec } from '../puzzle-spec';
import type { PuzzleVersions } from '../puzzle-versions';
import { countValidTriples } from './count-triples';
import { fillDistractors } from './fill-distractors';
import { countNearMisses } from './near-miss';
import { pickTriple, startOffset, type Triple, tripleSource } from './pick-triple';
import { placeCells } from './place-cells';

function copyBand(b: PuzzleBand): PuzzleBand {
  return { band: b.band, minValue: b.minValue, maxValue: b.maxValue, maxCarries: b.maxCarries };
}

function copySpec(spec: PuzzleSpec): PuzzleSpec {
  return {
    n: spec.n,
    operator: spec.operator,
    band: copyBand(spec.band),
    fallbackBands: spec.fallbackBands.map(copyBand),
    ...(spec.contract === undefined ? {} : { contract: spec.contract }),
    nearMissCount: spec.nearMissCount,
    nearMissDelta: spec.nearMissDelta,
    maxAttempts: spec.maxAttempts,
  };
}

const DISTRACTOR_INDICES = [3, 4, 5, 6, 7, 8];

/**
 * One attempt in `band`: a triple, then n − 3 distractors with `nearMisses`
 * near-misses, then the brute-force uniqueness check. Returns the values (a, b, c
 * first) or undefined.
 */
function attemptFill(
  stream: RandomStream,
  spec: PuzzleSpec,
  band: PuzzleBand,
  triple: Triple,
  nearMisses: number,
): [values: number[] | undefined, next: RandomStream] {
  const [values, next] = fillDistractors(stream, [triple.a, triple.b, triple.c], {
    band,
    count: spec.n - 3,
    nearMisses,
    nearMissDelta: spec.nearMissDelta,
  });
  if (values === undefined) return [undefined, next];
  // The fill keeps both invariants by construction; checked again by brute force.
  const distractors = DISTRACTOR_INDICES.slice(0, spec.n - 3);
  if (countValidTriples(values) !== 1 || countNearMisses(values, distractors, spec.nearMissDelta) !== nearMisses) {
    return [undefined, next];
  }
  return [values, next];
}

function record(
  seed: number,
  nodeId: NodeId,
  spec: PuzzleSpec,
  versions: PuzzleVersions,
  placed: { cells: number[]; roles: PuzzleRoles },
  band: PuzzleBand,
  nearMisses: number,
): Puzzle {
  return {
    seed,
    nodeId: { tier: nodeId.tier, index: nodeId.index },
    spec: copySpec(spec),
    cells: placed.cells.map(rational),
    roles: placed.roles,
    answerIndex: placed.roles.c,
    servedBand: band.band,
    ...(band.band === spec.band.band ? {} : { clamp: { requestedBand: spec.band.band, servedBand: band.band } }),
    nearMisses,
    versions: {
      generatorVersion: versions.generatorVersion,
      difficultyModelVersion: versions.difficultyModelVersion,
      tuningVersion: versions.tuningVersion,
    },
  };
}

/**
 * generatorVersion 1 (AD-6, AD-19): a `+` or `−` puzzle of n = 3..9 distinct
 * positive integer cells with exactly one valid triple, inside a band, optionally
 * under an answer contract.
 *
 * Every draw comes, in order, from one stream, `nodeStream(seed, nodeId)`:
 *
 * 1. For the requested band, then each `fallbackBands` entry in order: build the
 *    band's triple source (`tripleSource`; a band that can't host the request is
 *    skipped without drawing), draw its start offset, then make up to
 *    `maxAttempts` attempts:
 *    - pick the attempt's triple (`pickTriple`; within the band's carries);
 *    - fill n − 3 distractors with exactly `nearMissCount` near-misses
 *      (`fillDistractors`), then check uniqueness by brute force;
 *    - on the band's last attempt only, if that fails, retry the same triple (or,
 *      if that attempt drew none, the band's last usable triple) with 1, 2, …
 *      fewer near-misses (the recorded shortfall).
 * 2. The first success is placed by a seeded permutation of all n cells
 *    (`placeCells`). A fallback band records `clamp`.
 * 3. If no band succeeds, the result is `unrealisable`.
 *
 * Pure, integer-only and deterministic (AD-3); every loop is bounded by
 * `maxAttempts`, the band count or a fixed constant. Inputs are validated by
 * `realise`. Output pinned by golden-seeds/generator-v1.json: once v1 ships, it
 * never changes.
 */
export const realiseV1: GeneratorImpl = (seed, nodeId, spec, versions) => {
  let s = nodeStream(seed, nodeId);
  const bands = [spec.band, ...spec.fallbackBands];
  for (const band of bands) {
    const source = tripleSource(band, spec.operator, spec.contract);
    if (source.kind === 'none') continue;
    const [offset, s0] = startOffset(source, s);
    s = s0;
    let lastTriple: Triple | undefined;
    for (let attempt = 0; attempt < spec.maxAttempts; attempt += 1) {
      const [picked, s1] = pickTriple(source, band, spec.operator, attempt, offset, s);
      s = s1;
      const last = attempt === spec.maxAttempts - 1;
      // The last attempt's shortfall retry falls back on the band's last usable triple.
      const triple = picked ?? (last ? lastTriple : undefined);
      if (triple === undefined) continue;
      lastTriple = triple;
      const fewest = last ? 0 : spec.nearMissCount;
      for (let nearMisses = spec.nearMissCount; nearMisses >= fewest; nearMisses -= 1) {
        const [values, s2] = attemptFill(s, spec, band, triple, nearMisses);
        s = s2;
        if (values !== undefined) {
          const [placed] = placeCells(s, values);
          return ok(record(seed, nodeId, spec, versions, placed, band, nearMisses));
        }
      }
    }
  }
  const tried = bands.map((b) => b.band).join(', ');
  const what = spec.contract === undefined ? 'no contract' : `contract ${spec.contract}`;
  return err({
    code: 'unrealisable',
    message: `no ${spec.operator} puzzle with n ${spec.n} and ${what} could be realised in bands ${tried}`,
  });
};
