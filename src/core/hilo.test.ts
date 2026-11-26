import { describe, expect, it } from '@jest/globals';
import { decksRemaining, tcForIndex, type DeckResolution, type TcRounding } from './hilo';
import { newShoe } from './shoe';

describe('tcForIndex', () => {
  it.each([
    [2.6, 2, 2, 3],
    [0.9, 0, 0, 1],
    [-0.4, 0, -1, 0],
    [-2.5, -2, -3, -3],
    [2.5, 2, 2, 3],
    [0, 0, 0, 0],
    [-1, -1, -1, -1],
  ])('rounds %s by the three methods', (input, truncate, floor, round) => {
    expect(tcForIndex(input, 'truncate')).toBe(truncate);
    expect(tcForIndex(input, 'floor')).toBe(floor);
    expect(tcForIndex(input, 'round')).toBe(round);
  });

  it('rejects an invalid deck resolution', () => {
    const shoe = newShoe({ decks: 8, burnCards: 0, cutPenetration: 0.75 });
    expect(() => decksRemaining(shoe, 'x' as DeckResolution)).toThrow('Resolución de mazos inválida: x');
  });

  it('rejects an invalid true-count rounding mode', () => {
    expect(() => tcForIndex(1.5, 'x' as TcRounding)).toThrow('Redondeo inválido: x');
  });
});
