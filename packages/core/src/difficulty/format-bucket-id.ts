import type { BucketFeatures } from './bucket-features';

/** The canonical bucketId for a set of features: `dm<v>|<op>|d<digits>|c<carries>|n<n>|nm<nearMisses>`. */
export function formatBucketId(f: BucketFeatures): string {
  return `dm${f.difficultyModelVersion}|${f.operator}|d${f.digits}|c${f.carries}|n${f.n}|nm${f.nearMisses}`;
}
