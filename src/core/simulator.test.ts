import { describe, expect, it } from '@jest/globals';
import type { Rank } from './cards';
import { DEFAULT_RULES } from './rules';
import { lookupAction, type Availability } from './strategy';
import { playRound, simulate } from './simulator';
import { applyChanges, referenceStrategy } from './__fixtures__/referenceStrategy';

function seq(cards: Rank[]): () => Rank {
  let position = 0;
  return () => {
    const card = cards[position++];
    if (card === undefined) throw new Error('Se agotó la secuencia de cartas');
    return card;
  };
}

const referenceRules = { ...DEFAULT_RULES, hitSplitAces: false, resplitAces: false };
const all: Availability = { hit: true, double: true, split: true, surrender: true };

describe('playRound', () => {
  it.each([
    ['M1', referenceRules, ['A', '9', 'T', '7'], referenceStrategy, 1.5, 1],
    ['M2', referenceRules, ['T', 'A', '9', 'T'], referenceStrategy, -1, 1],
    ['M3', referenceRules, ['A', 'A', 'T', 'T'], referenceStrategy, 0, 1],
    ['M4', referenceRules, ['6', '6', '5', 'T', 'T', '7'], referenceStrategy, 2, 2],
    ['M5', referenceRules, ['8', 'T', '8', '7', '3', 'T', 'T'], referenceStrategy, 3, 3],
    ['M6', { ...referenceRules, dealerPeeks: false }, ['6', 'T', '5', 'A', 'T'], referenceStrategy, -2, 2],
    ['M7', { ...referenceRules, surrender: 'late' as const }, ['T', 'T', '6', '7'], applyChanges(referenceStrategy, [['hard', '16', 'T', 'R']]), -0.5, 1],
    ['M8', referenceRules, ['A', '6', 'A', 'T', 'T', '5', 'T'], referenceStrategy, 2, 2],
    ['M9', { ...referenceRules, hitSplitAces: true }, ['A', '6', 'A', 'T', 'T', '5', 'T', 'T'], referenceStrategy, 3, 3],
    ['M10 S17', referenceRules, ['T', 'A', '9', '6', '3'], referenceStrategy, 1, 1],
    ['M10 H17', { ...referenceRules, dealerHitsSoft17: true }, ['T', 'A', '9', '6', '3'], referenceStrategy, -1, 1],
  ] as const)('%s', (_name, rules, cards, table, net, wagered) => {
    expect(playRound(seq([...cards] as Rank[]), rules, table)).toEqual({ net, wagered });
  });
});

describe('simulate', () => {
  it('es reproducible con una semilla fija', () => {
    const first = simulate(referenceRules, referenceStrategy, 2000, 7);
    expect(simulate(referenceRules, referenceStrategy, 2000, 7)).toEqual(first);
    expect(first.rounds).toBe(2000);
    expect(first.stdError).toBeGreaterThan(0);
  });
});

describe('lookupAction', () => {
  it('resuelve parejas, dobles, rendición y acciones no disponibles', () => {
    expect(lookupAction(['5', '5'], '6', referenceStrategy, all)).toBe('D');
    expect(lookupAction(['6', '2', '3'], '6', referenceStrategy, { ...all, double: false })).toBe('H');
    expect(lookupAction(['A', '7'], '3', referenceStrategy, { ...all, double: false })).toBe('S');
    expect(lookupAction(['8', '8'], 'T', referenceStrategy, { ...all, split: false })).toBe('H');
    const surrender = applyChanges(referenceStrategy, [['hard', '16', 'T', 'R']]);
    expect(lookupAction(['T', '6'], 'T', surrender, all)).toBe('R');
    expect(lookupAction(['T', '6'], 'T', surrender, { ...all, surrender: false })).toBe('H');
    expect(lookupAction(['A', '5'], '6', referenceStrategy, { ...all, hit: false, double: false })).toBe('S');
  });
});
