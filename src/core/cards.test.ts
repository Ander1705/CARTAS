import { describe, expect, it } from '@jest/globals';
import { CARDS_PER_DECK, hiloValue, parseRank, RANKS } from './cards';

describe('hiloValue', () => {
  it.each([
    ['2', 1],
    ['3', 1],
    ['4', 1],
    ['5', 1],
    ['6', 1],
    ['7', 0],
    ['8', 0],
    ['9', 0],
    ['T', -1],
    ['A', -1],
  ] as const)('rank %s returns %i', (rank, expected) => {
    expect(hiloValue(rank)).toBe(expected);
  });
});

describe('deck composition', () => {
  it('has 10 unique ranks', () => {
    expect(RANKS).toHaveLength(10);
    expect(new Set(RANKS).size).toBe(RANKS.length);
  });

  it('contains 52 cards with 4 aces and 16 ten-value cards', () => {
    expect(Object.values(CARDS_PER_DECK).reduce((sum, count) => sum + count, 0)).toBe(52);
    expect(CARDS_PER_DECK.T).toBe(16);
    expect(CARDS_PER_DECK.A).toBe(4);
  });

  it('balances Hi-Lo counts for one deck', () => {
    const count = RANKS.reduce((sum, rank) => sum + CARDS_PER_DECK[rank] * hiloValue(rank), 0);
    expect(count).toBe(0);
  });

  it('balances Hi-Lo counts for eight decks', () => {
    const count = RANKS.reduce((sum, rank) => sum + 8 * CARDS_PER_DECK[rank] * hiloValue(rank), 0);
    const positive = RANKS.reduce(
      (sum, rank) => sum + (hiloValue(rank) === 1 ? 8 * CARDS_PER_DECK[rank] : 0),
      0,
    );
    const negative = RANKS.reduce(
      (sum, rank) => sum + (hiloValue(rank) === -1 ? 8 * CARDS_PER_DECK[rank] : 0),
      0,
    );
    const neutral = RANKS.reduce(
      (sum, rank) => sum + (hiloValue(rank) === 0 ? 8 * CARDS_PER_DECK[rank] : 0),
      0,
    );

    expect(count).toBe(0);
    expect(positive).toBe(160);
    expect(negative).toBe(160);
    expect(neutral).toBe(96);
  });
});

describe('parseRank', () => {
  it.each([
    ['K', 'T'],
    ['q', 'T'],
    ['J', 'T'],
    ['10', 'T'],
    ['0', 'T'],
    ['t', 'T'],
    ['a', 'A'],
    [' 7 ', '7'],
    ['9', '9'],
  ])('parses %j as %s', (input, expected) => {
    expect(parseRank(input)).toBe(expected);
  });

  it.each(['1', '11', '', 'X', '1O', '00'])('rejects %j', (input) => {
    expect(() => parseRank(input)).toThrow(`Rango inválido: "${input}"`);
  });
});
