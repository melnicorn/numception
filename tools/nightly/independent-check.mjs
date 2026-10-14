// @ts-check
// Independent brute-force checker for the nightly uniqueness run (FR-1, AD-19).
// Shares no code with packages/core's generator: it reads only cell values,
// the operator and the answer index from plain objects.

/**
 * Problems with one puzzle, judged from its values alone. Empty means valid.
 * @param {{ values: readonly number[], operator: 'add' | 'sub', answerIndex: number }} p
 * @returns {string[]}
 */
export function puzzleProblems({ values, operator, answerIndex }) {
  const problems = [];
  const n = values.length;
  if (n < 3 || n > 9) problems.push(`n ${n} outside 3..9`);
  if (values.some((v) => !Number.isInteger(v) || v < 1)) problems.push(`non-positive or non-integer value in [${values.join(', ')}]`);
  if (new Set(values).size !== n) problems.push(`duplicate values in [${values.join(', ')}]`);
  /** @type {[number, number, number][]} */
  const triples = []; // [i, j, k] with values[i] + values[j] === values[k], i < j
  for (let i = 0; i < n; i += 1)
    for (let j = i + 1; j < n; j += 1)
      for (let k = 0; k < n; k += 1) if (k !== i && k !== j && values[i] + values[j] === values[k]) triples.push([i, j, k]);
  if (triples.length !== 1) {
    problems.push(`${triples.length} valid triples in [${values.join(', ')}], expected exactly 1`);
    return problems;
  }
  const [i, j, k] = triples[0];
  if (operator === 'add' && answerIndex !== k) problems.push(`+ answer is cell ${answerIndex}, expected the sum cell ${k}`);
  if (operator === 'sub' && answerIndex !== i && answerIndex !== j) problems.push(`− answer is cell ${answerIndex}, expected one of the two smaller cells ${i}, ${j}`);
  return problems;
}

/**
 * Problems with a planned round: every puzzle at every tier valid (upper tiers as
 * planned, leaves as realised in band 1), every child's contract equal to its
 * parent's cell, and every leaf answering its contract.
 * @param {{
 *   n: number,
 *   operator: 'add' | 'sub',
 *   tiers: number,
 *   nodes: readonly { tier: number, index: number, contract?: number, values?: readonly number[], answerIndex?: number }[],
 *   leafPuzzle: (index: number) => { values: readonly number[], answerIndex: number } | undefined,
 * }} round
 * @returns {string[]}
 */
export function roundProblems({ n, operator, tiers, nodes, leafPuzzle }) {
  const problems = [];
  const at = new Map(nodes.map((node) => [`${node.tier}/${node.index}`, node]));
  const expectedCount = Array.from({ length: tiers }, (_, t) => n ** t).reduce((a, b) => a + b, 0);
  if (nodes.length !== expectedCount) problems.push(`${nodes.length} nodes, expected ${expectedCount}`);
  for (const node of nodes) {
    if (node.tier > 1) {
      if (!node.values || node.answerIndex === undefined) {
        problems.push(`upper node ${node.tier}/${node.index} has no puzzle`);
        continue;
      }
      for (const p of puzzleProblems({ values: node.values, operator, answerIndex: node.answerIndex })) problems.push(`node ${node.tier}/${node.index}: ${p}`);
      if (node.contract !== undefined && node.values[node.answerIndex] !== node.contract) problems.push(`node ${node.tier}/${node.index} answers ${node.values[node.answerIndex]}, contract ${node.contract}`);
      node.values.forEach((v, j) => {
        const child = at.get(`${node.tier - 1}/${node.index * n + j}`);
        if (!child) problems.push(`node ${node.tier}/${node.index} child ${j} missing`);
        else if (child.contract !== v) problems.push(`child ${child.tier}/${child.index} contract ${child.contract}, parent cell ${v}`);
      });
    } else {
      const leaf = leafPuzzle(node.index);
      if (!leaf) {
        problems.push(`leaf 1/${node.index} did not realise in band 1 (contract ${node.contract})`);
        continue;
      }
      for (const p of puzzleProblems({ values: leaf.values, operator, answerIndex: leaf.answerIndex })) problems.push(`leaf 1/${node.index}: ${p}`);
      const answer = leaf.values[leaf.answerIndex];
      if (answer !== node.contract) problems.push(`leaf 1/${node.index} realises answer ${answer}, contract ${node.contract}`);
    }
  }
  return problems;
}
