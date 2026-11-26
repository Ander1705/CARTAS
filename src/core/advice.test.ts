import { describe, expect, it } from '@jest/globals';
import { quickAdvice, fullAdvice, turnInfo } from './advice';
import { availability } from './strategy';
import { BASE_STRATEGY, strategyForRules } from './precomputedStrategy';
import { DEFAULT_RULES } from './rules';
import { createSession, endShoe, setSeatActive, startShoe, applyRound } from './session';
import { enterCard, nextHand } from './table';

function started(seats: number[]) {
  let s = createSession({ ...DEFAULT_RULES });
  for (const seat of [1, 2, 3, 4, 5, 6, 7]) {
    if (!seats.includes(seat)) s = setSeatActive(s, seat as 1, false);
  }
  return s;
}

function cards(s: ReturnType<typeof createSession>, ranks: ('A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T')[]) {
  return ranks.reduce((current, rank) => applyRound(current, (round) => enterCard(round, rank)), s);
}

describe('advice', () => {
  it('recomienda en vivo solo cuando es mi turno', () => {
    let s = started([1, 3, 4]);
    s = startShoe(s, 3);
    s = cards(s, ['A', '2', '3', '4', '5', '6', '7']);
    expect(turnInfo(s)).toMatchObject({ myTurn: false, turnSeat: 1, hand: null });
    s = cards(s, ['T']);
    s = applyRound(s, nextHand);
    expect(turnInfo(s)).toMatchObject({ myTurn: true, turnSeat: 3, hand: ['2', '6'], upcard: '4', splitHands: 1, tcIndex: 0 });
    expect(turnInfo(s).shoe?.seen).toBe(8);
    expect(quickAdvice(s, turnInfo(s))).toMatchObject({ tableAction: 'H', countDeviation: null, insurance: null });
  });

  it('calcula seguro, desviación y EV exacto', () => {
    let s = startShoe(started([1]), 1);
    s = cards(s, ['T', 'A', '9']);
    expect(turnInfo(s).tcIndex).toBe(0);
    expect(Object.is(turnInfo(s).tcIndex, 0)).toBe(true);
    expect(quickAdvice(s, turnInfo(s))).toMatchObject({ tableAction: 'S', insurance: false });

    s = startShoe(started([1]), 1);
    s = cards(s, ['T', 'T', '6']);
    expect(quickAdvice(s, turnInfo(s))).toMatchObject({ tableAction: 'H', countDeviation: { id: 'i18-16v10' } });
    expect(fullAdvice(s, turnInfo(s))).toMatchObject({
      evs: { stand: expect.closeTo(-0.540826736160998, 12), hit: expect.closeTo(-0.5359748431671139, 12) },
      bestAction: 'H', tableAction: 'H', compositionDeviation: false,
    });
  });

  it('selecciona tabla y disponibilidad según reglas', () => {
    expect(strategyForRules({ ...DEFAULT_RULES })).toBe(BASE_STRATEGY);
    expect(strategyForRules({ ...DEFAULT_RULES, hitSplitAces: false })).toBe(BASE_STRATEGY);
    expect(strategyForRules({ ...DEFAULT_RULES, dealerPeeks: false })).toBeNull();
    expect(strategyForRules({ ...DEFAULT_RULES, decks: 6 })).toBeNull();
    expect(strategyForRules({ ...DEFAULT_RULES, surrender: 'late' })).toBeNull();
    expect(availability(['8', '8'], { ...DEFAULT_RULES }, 1).split).toBe(true);
    expect(availability(['8', '8'], { ...DEFAULT_RULES }, 4).split).toBe(false);
    expect(availability(['A', '5'], { ...DEFAULT_RULES, hitSplitAces: false }, 2)).toMatchObject({ hit: false, double: false });
    expect(availability(['T', '6'], { ...DEFAULT_RULES, surrender: 'late' }, 1).surrender).toBe(true);
    expect(availability(['T', '6'], { ...DEFAULT_RULES, surrender: 'late' }, 2).surrender).toBe(false);
  });

  it('termina el zapato sin borrar el puesto', () => {
    let s = startShoe(started([1, 3]), 3);
    s = cards(s, ['A']);
    expect(endShoe(s)).toMatchObject({ status: 'waiting', round: null, roundsPlayed: 0, mySeat: 3 });
  });
});
