import { type DemoPuzzleResult, demoPuzzle } from '@numception/app';
import { useMemo } from 'preact/hooks';

const cellStyle = {
  display: 'inline-block',
  minWidth: '2.5em',
  padding: '2px 6px',
  marginRight: '4px',
  border: '1px solid #888',
  textAlign: 'center',
};

const answerCellStyle = { ...cellStyle, borderColor: '#000', fontWeight: 'bold' };

const dlStyle = { margin: '4px 0', display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '8px' };

/** Dev panel block: the seeded demo puzzle realised by core from the passed-in tuning. */
export function PuzzleBlock({ tuning }: { tuning: unknown }) {
  const result: DemoPuzzleResult = useMemo(() => demoPuzzle(tuning), [tuning]);
  return (
    <section data-testid="dev-puzzle" aria-labelledby="dev-puzzle-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-puzzle-heading" style={{ margin: 0, fontSize: '13px' }}>
        Puzzle
      </h3>
      {result.ok ? (
        <>
          <dl style={dlStyle}>
            <dt>Seed</dt>
            <dd data-testid="dev-puzzle-seed" style={{ margin: 0 }}>
              {result.view.seed}
            </dd>
            <dt>Node</dt>
            <dd data-testid="dev-puzzle-node" style={{ margin: 0 }}>
              tier {result.view.nodeId.tier}, index {result.view.nodeId.index}
            </dd>
            <dt>n</dt>
            <dd data-testid="dev-puzzle-n" style={{ margin: 0 }}>
              {result.view.n}
            </dd>
            <dt>Operator</dt>
            <dd data-testid="dev-puzzle-operator" style={{ margin: 0 }}>
              {result.view.operatorSymbol} ({result.view.operator})
            </dd>
            <dt>Versions</dt>
            <dd data-testid="dev-puzzle-versions" style={{ margin: 0 }}>
              generator {result.view.versions.generatorVersion}, difficulty model {result.view.versions.difficultyModelVersion}, tuning{' '}
              {result.view.versions.tuningVersion}
            </dd>
          </dl>
          <ol aria-label="Cells" style={{ listStyle: 'none', padding: 0, margin: '4px 0' }}>
            {result.view.cells.map((cell, i) => (
              <li
                key={i}
                data-testid="dev-puzzle-cell"
                data-answer={cell.isAnswer ? 'true' : 'false'}
                style={{ display: 'inline' }}
              >
                <span style={cell.isAnswer ? answerCellStyle : cellStyle}>
                  {cell.text}
                  {cell.isAnswer ? ' (answer)' : ''}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p data-testid="dev-puzzle-error" role="alert" style={{ margin: '4px 0' }}>
          {result.error.code}: {result.error.message}
        </p>
      )}
    </section>
  );
}
