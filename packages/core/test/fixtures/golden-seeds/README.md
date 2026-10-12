# Golden seeds

`generator-v<N>.json` pins generatorVersion N's output (AD-6): each case's inputs
(seed, NodeId, spec, a tuning file from `../tuning/`, never `content/`) and the
expected cells, `answerIndex` and versions. `pnpm test` checks them in Node, and the
`golden-webkit` Playwright project (`pnpm e2e`) checks them in WebKit. Every
registered version needs a fixture, and every fixture a registered version.

- **Changing output of an unshipped version** (not in `shipped.lock.json`): change
  the generator, run `pnpm golden:update`, and review the fixture diff.
- **Changing output of a shipped version**: don't. Add `generator/v<N+1>/`, register
  it in `packages/core/src/generator/registry.ts`, bump `GENERATOR_VERSION`, add its
  inputs in `../../golden/golden-inputs.ts` if they differ, then run
  `pnpm golden:update --version <N+1>`. The old version stays registered.
- **Shipping a version** (its first release to players): add
  `"<N>": "<sha256>"` to `shipped` in `shipped.lock.json`, with the hash from
  `shasum -a 256 generator-v<N>.json`. From then on the fixture can't change and
  `golden:update` refuses to touch it. v1 is locked at epic-poc-playtest's first release.
