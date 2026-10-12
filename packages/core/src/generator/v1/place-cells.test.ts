import { describe, expect, it } from 'vitest';
import { randomStream } from '../../random/random-stream';
import { placeCells } from './place-cells';

describe('placeCells', () => {
  it('permutes every value and reports where a, b and c landed', () => {
    const values = [3, 5, 8, 11, 20, 1];
    const positions = new Set<number>();
    let s = randomStream(3);
    for (let i = 0; i < 100; i += 1) {
      const [{ cells, roles }, next] = placeCells(s, values);
      s = next;
      expect([...cells].sort((x, y) => x - y)).toEqual([...values].sort((x, y) => x - y));
      expect(cells[roles.a]).toBe(3);
      expect(cells[roles.b]).toBe(5);
      expect(cells[roles.c]).toBe(8);
      positions.add(roles.c);
    }
    expect(positions.size).toBe(values.length);
  });
});
