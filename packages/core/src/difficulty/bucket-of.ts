import type { Puzzle } from '../generator/puzzle';
import type { BucketFeatures } from './bucket-features';
import { columnSteps } from './column-steps';
import { formatBucketId } from './format-bucket-id';

/**
 * A realised puzzle's bucket features and canonical bucketId (AD-8, AD-9), e.g.
 * `dm1|add|d2|c1|n5|nm1`. Pure; the selector copies the id into the selection
 * record after realisation (epic Notes).
 */
export function bucketOf(puzzle: Puzzle): { readonly features: BucketFeatures; readonly bucketId: string } {
  // POC cells are integers (d = 1); read the numerator, never the display string.
  const values = puzzle.cells.map((c) => c.n);
  const largest = values.reduce((m, v) => (v > m ? v : m), 0);
  const a = values[puzzle.roles.a]!;
  const b = values[puzzle.roles.b]!;
  const carries = puzzle.spec.operator === 'add' ? columnSteps(a, b, 'carry') : columnSteps(a, b, 'borrow');
  const features: BucketFeatures = {
    difficultyModelVersion: puzzle.versions.difficultyModelVersion,
    operator: puzzle.spec.operator,
    digits: String(largest).length,
    carries,
    n: puzzle.cells.length,
    nearMisses: puzzle.nearMisses,
  };
  return { features, bucketId: formatBucketId(features) };
}
