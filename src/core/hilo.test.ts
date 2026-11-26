import { describe, expect, it } from '@jest/globals';
import { tcForIndex } from './hilo';

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
});
