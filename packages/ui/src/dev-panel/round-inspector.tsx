import {
  DEMO_SEED,
  type InspectedNode,
  type InspectRoundRequest,
  type InspectRoundResult,
  inspectRound,
  type RoundInspectorOptions,
  type TuningInspectorOptions,
} from '@numception/app';
import { useState } from 'preact/hooks';

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '2px', font: '12px system-ui, sans-serif' } as const;
const controlsStyle = { display: 'flex', flexWrap: 'wrap', gap: '6px 8px', alignItems: 'flex-end', margin: '4px 0' } as const;
const linesStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '2px 0 6px',
  font: '12px ui-monospace, Menlo, monospace',
  overflowWrap: 'anywhere',
} as const;

type RoundTypeName = InspectRoundRequest['type'];
type Operator = InspectRoundRequest['operator'];
type Tuning = Extract<TuningInspectorOptions, { ok: true }>;

/** The text of one puzzle line: label, contract, cells (answer in brackets), served band and bucketId. */
function lineText(node: InspectedNode): string {
  const cells = node.cells.map((c) => (c.isAnswer ? `[${c.text}]` : c.text)).join(' ');
  const contract = node.contract === undefined ? '' : ` =${node.contract}`;
  const band = `b${node.servedBand}${node.clamped ? ' clamped' : ''}`;
  return `${node.label}${contract}: ${cells} · ${band} · ${node.bucketId}`;
}

const range = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

/**
 * Dev panel block: plans a Classic or Tower round with a chosen tuning, n, operator,
 * seed and leaf band, and lists every puzzle as text, tier by tier (top first). The
 * view comes from app's `inspectRound`; this component holds only the form state.
 */
export function RoundInspector({ tunings, options }: { tunings: Readonly<Record<string, unknown>>; options: RoundInspectorOptions }) {
  const [version, setVersion] = useState<number | undefined>(options.defaultTuningVersion);
  const [type, setType] = useState<RoundTypeName>('classic');
  const [n, setN] = useState(3);
  const [operator, setOperator] = useState<Operator>('add');
  const [seed, setSeed] = useState(String(DEMO_SEED));
  const [leafBand, setLeafBand] = useState(1);
  const [result, setResult] = useState<InspectRoundResult | undefined>(undefined);

  const selected = options.tunings.find((t) => t.tuningVersion === version);
  const tuning: Tuning | undefined = selected?.ok ? selected : undefined;
  // Keep the form inside what the selected tuning allows.
  const nValue = tuning ? Math.min(Math.max(n, tuning.nMin), tuning.nMax) : n;
  const operatorValue = tuning && !tuning.operators.some((o) => o.operator === operator) ? tuning.operators[0]!.operator : operator;
  const bandValue = tuning && !tuning.bands.includes(leafBand) ? tuning.bands[0]! : leafBand;

  const plan = () => {
    if (version === undefined) {
      setResult({ ok: false, error: { code: 'unknown-tuning', message: 'no tuning is bundled' } });
      return;
    }
    setResult(inspectRound(tunings, { tuningVersion: version, type, n: nValue, operator: operatorValue, seed, leafBand: bandValue }));
  };

  return (
    <section data-testid="dev-round-inspector" aria-labelledby="dev-round-inspector-heading" style={{ marginTop: '8px' }}>
      <h3 id="dev-round-inspector-heading" style={{ margin: 0, fontSize: '13px' }}>
        Round inspector
      </h3>
      <form
        style={controlsStyle}
        // Any edit makes the shown round stale: clear it until the next "Plan round".
        onInput={() => setResult(undefined)}
        onChange={() => setResult(undefined)}
        onSubmit={(e) => {
          e.preventDefault();
          plan();
        }}
      >
        <div style={fieldStyle}>
          <label htmlFor="dev-round-tuning">Tuning</label>
          <select
            id="dev-round-tuning"
            value={version === undefined ? '' : String(version)}
            onChange={(e) => setVersion(Number(e.currentTarget.value))}
          >
            {options.tunings.map((t) => (
              <option key={t.tuningVersion} value={String(t.tuningVersion)}>
                {t.tuningVersion}
                {t.ok ? '' : ' (invalid)'}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="dev-round-type">Type</label>
          <select id="dev-round-type" value={type} onChange={(e) => setType(e.currentTarget.value as RoundTypeName)}>
            <option value="classic">Classic</option>
            <option value="tower">Tower</option>
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="dev-round-n">n</label>
          <select id="dev-round-n" value={String(nValue)} onChange={(e) => setN(Number(e.currentTarget.value))}>
            {(tuning ? range(tuning.nMin, tuning.nMax) : [nValue]).map((v) => (
              <option key={v} value={String(v)}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="dev-round-operator">Operator</label>
          <select id="dev-round-operator" value={operatorValue} onChange={(e) => setOperator(e.currentTarget.value as Operator)}>
            {(tuning?.operators ?? [{ operator: operatorValue, symbol: operatorValue }]).map((o) => (
              <option key={o.operator} value={o.operator}>
                {o.symbol} ({o.operator})
              </option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="dev-round-seed">Seed</label>
          <input
            id="dev-round-seed"
            type="text"
            inputMode="numeric"
            size={10}
            value={seed}
            onInput={(e) => setSeed(e.currentTarget.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="dev-round-leaf-band">Leaf band</label>
          <select id="dev-round-leaf-band" value={String(bandValue)} onChange={(e) => setLeafBand(Number(e.currentTarget.value))}>
            {(tuning?.bands ?? [bandValue]).map((b) => (
              <option key={b} value={String(b)}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Plan round</button>
      </form>
      {selected && !selected.ok && (
        <p data-testid="dev-round-tuning-error" role="alert" style={{ margin: '4px 0' }}>
          tuning {selected.tuningVersion}: {selected.error.code}: {selected.error.message}
        </p>
      )}
      {result && !result.ok && (
        <p data-testid="dev-round-error" role="alert" style={{ margin: '4px 0' }}>
          {result.error.code}: {result.error.message}
        </p>
      )}
      {result?.ok && (
        <div data-testid="dev-round-output">
          <p data-testid="dev-round-summary" style={{ margin: '4px 0', fontSize: '12px' }}>
            {result.view.type === 'tower' ? 'Tower' : 'Classic'} n={result.view.n} {result.view.operatorSymbol} ({result.view.operator}):{' '}
            {result.view.puzzleCount} puzzles ({result.view.type === 'tower' ? 'n² + n + 1' : 'n + 1'}) · seed {result.view.seed}, round seed{' '}
            {result.view.roundSeed} · leaf band {result.view.leafBand} · generator {result.view.versions.generatorVersion}, difficulty model{' '}
            {result.view.versions.difficultyModelVersion}, tuning {result.view.versions.tuningVersion}
          </p>
          {result.view.tiers.map((tier) => (
            <div key={tier.tier} data-testid="dev-round-tier" data-tier={String(tier.tier)}>
              <h4 style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Tier {tier.tier} ({tier.nodes.length})
              </h4>
              <ol aria-label={`Tier ${tier.tier} puzzles`} style={linesStyle}>
                {tier.nodes.map((node) => (
                  <li key={node.label} data-testid="dev-round-line" data-label={node.label} data-clamped={node.clamped ? 'true' : 'false'}>
                    {lineText(node)}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
