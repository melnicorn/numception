// The WebKit golden-seed harness (AD-6): runs the same comparison as
// packages/core/test/golden.test.ts, but in the browser engine, and reports it on
// the page for tools/golden-harness/e2e/golden.spec.ts.
import { registeredGeneratorVersions } from '../../../packages/core/src/generator/registered-generator-versions';
import { goldenFixtures } from '../../../packages/core/test/golden/golden-fixtures';
import { checkGoldenCoverage, compareGoldenSeeds, type GoldenSeeds } from '../../../packages/core/test/golden/golden-seeds';
import { goldenTunings } from '../../../packages/core/test/golden/golden-tunings';

/** What the page reports, also on `window.__goldenReport`. */
export type GoldenReport = {
  readonly fixtures: readonly string[];
  readonly cases: number;
  readonly mismatches: readonly string[];
};

function run(): GoldenReport {
  const fixtures = Object.keys(goldenFixtures).sort();
  const mismatches = [
    ...checkGoldenCoverage(registeredGeneratorVersions(), fixtures),
    ...fixtures.flatMap((file) => compareGoldenSeeds(file, goldenFixtures[file], goldenTunings)),
  ];
  const cases = fixtures.reduce((n, file) => n + ((goldenFixtures[file] as GoldenSeeds).cases?.length ?? 0), 0);
  return { fixtures, cases, mismatches };
}

const out = document.getElementById('golden-result');
let report: GoldenReport;
try {
  report = run();
} catch (e) {
  report = { fixtures: [], cases: 0, mismatches: [`harness threw: ${e instanceof Error ? e.message : String(e)}`] };
}
(window as unknown as { __goldenReport: GoldenReport }).__goldenReport = report;
if (out) {
  out.textContent = JSON.stringify(report, null, 2);
  out.dataset.status = report.mismatches.length === 0 ? 'pass' : 'fail';
}
