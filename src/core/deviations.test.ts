import { describe, expect, test } from '@jest/globals';
import { DEFAULT_RULES, type Rules } from './rules';
import { newShoe, dealSeen, type ShoeState } from './shoe';
import type { Rank } from './cards';
import { referenceStrategy } from './__fixtures__/referenceStrategy';
import { COUNT_DEVIATIONS, INSURANCE_INDEX, adviseHand, findCountDeviation, shouldTakeInsurance } from './deviations';

const rules = (): Rules => ({ ...DEFAULT_RULES });
const shoeWith = (unseen: Record<Rank, number>): ShoeState => ({ ...newShoe({ decks: 8, burnCards: 0, cutPenetration: 0.75 }), unseen });

describe('findCountDeviation', () => {
  test('F1-F2: I18 stand thresholds', () => {
    expect(findCountDeviation(['T', '6'], 'T', 0, rules())?.id).toBe('i18-16v10');
    expect(findCountDeviation(['T', '6'], 'T', -1, rules())).toBeNull();
    expect(findCountDeviation(['T', '5'], 'T', 4, rules())?.id).toBe('i18-15v10');
    expect(findCountDeviation(['T', '5'], 'T', 3, rules())).toBeNull();
  });
  test('F3: Fab 4 requires late surrender and supersedes the listed I18 hands', () => {
    const late = { ...rules(), surrender: 'late' as const };
    expect(findCountDeviation(['T', '5'], 'T', 0, late)?.id).toBe('fab4-15v10');
    expect(findCountDeviation(['T', '6'], 'T', 2, late)).toBeNull();
    expect(findCountDeviation(['T', '4'], 'T', 3, late)?.id).toBe('fab4-14v10');
    expect(findCountDeviation(['T', '4'], 'T', 2, late)).toBeNull();
  });
  test('F4-F6: pairs, below indices, and exact hand lengths', () => {
    expect(findCountDeviation(['T', 'T'], '6', 4, rules())?.id).toBe('i18-TTv6');
    expect(findCountDeviation(['T', 'T'], '5', 4, rules())).toBeNull();
    expect(findCountDeviation(['T', 'T'], '5', 5, rules())?.id).toBe('i18-TTv5');
    expect(findCountDeviation(['T', '2'], '4', -1, rules())?.id).toBe('i18-12v4');
    expect(findCountDeviation(['T', '2'], '4', 0, rules())).toBeNull();
    expect(findCountDeviation(['6', '4'], 'T', 4, rules())?.id).toBe('i18-10v10');
    expect(findCountDeviation(['3', '3', '4'], 'T', 4, rules())).toBeNull();
  });
  test('F7-F8: soft hands do not match hard deviations and Fab 4 requires surrender', () => {
    expect(findCountDeviation(['T', '2', 'A'], '2', -2, rules())?.id).toBe('i18-13v2');
    expect(findCountDeviation(['A', '5'], 'T', 5, rules())).toBeNull();
    expect(findCountDeviation(['T', '5'], 'A', 5, rules())).toBeNull();
    expect(findCountDeviation(['T', '5'], '9', 5, rules())).toBeNull();
  });
  test('F9: insurance index and deviation metadata', () => {
    expect(shouldTakeInsurance(3)).toBe(true);
    expect(shouldTakeInsurance(2.9)).toBe(false);
    expect(INSURANCE_INDEX).toBe(3);
    expect(COUNT_DEVIATIONS.filter((entry) => entry.set === 'Fab4')).toHaveLength(4);
    expect(COUNT_DEVIATIONS.filter((entry) => entry.set === 'I18')).toHaveLength(17);
    expect(COUNT_DEVIATIONS.every((entry) => entry.source.length > 0 && entry.rules.length > 0)).toBe(true);
  });
});

describe('adviseHand', () => {
  test('A1-A2: reports exact composition EV and count deviation independently', () => {
    const a1 = adviseHand(shoeWith({ A: 17, '2': 14, '3': 15, '4': 15, '5': 15, '6': 14, '7': 16, '8': 16, '9': 16, T: 67 }), ['T', '6'], 'T', rules(), referenceStrategy, 3);
    expect(a1.evs.stand).toBeCloseTo(-0.5542883021805634, 12);
    expect(a1.evs.hit).toBeCloseTo(-0.5664602653686837, 12);
    expect(a1.tableAction).toBe('H'); expect(a1.bestAction).toBe('S'); expect(a1.compositionDeviation).toBe(true); expect(a1.countDeviation?.id).toBe('i18-16v10');
    const a2 = adviseHand(shoeWith({ A: 16, '2': 16, '3': 17, '4': 16, '5': 17, '6': 16, '7': 16, '8': 16, '9': 16, T: 59 }), ['T', '2'], '4', rules(), referenceStrategy, -2);
    expect(a2.evs.stand).toBeCloseTo(-0.24396719938442624, 12);
    expect(a2.evs.hit).toBeCloseTo(-0.20720891792932877, 12);
    expect(a2.tableAction).toBe('S'); expect(a2.bestAction).toBe('H'); expect(a2.compositionDeviation).toBe(true); expect(a2.countDeviation?.id).toBe('i18-12v4');
  });
  test('A3-A4: unavailable double falls back; multi-card composition still applies count indices', () => {
    const a3 = adviseHand(shoeWith({ A: 17, '2': 13, '3': 14, '4': 13, '5': 15, '6': 15, '7': 16, '8': 16, '9': 16, T: 69 }), ['2', '3', '4'], '4', rules(), referenceStrategy, 3);
    expect(a3.evs.hit).toBeCloseTo(0.18046319505455985, 12); expect(a3.evs.double).toBeNull();
    expect(a3.tableAction).toBe('H'); expect(a3.bestAction).toBe('H'); expect(a3.compositionDeviation).toBe(false); expect(a3.countDeviation).toBeNull();
    const a4 = adviseHand(shoeWith({ A: 17, '2': 14, '3': 13, '4': 15, '5': 15, '6': 15, '7': 16, '8': 16, '9': 16, T: 67 }), ['T', '3', '3'], 'T', rules(), referenceStrategy, 3);
    expect(a4.evs.stand).toBeCloseTo(-0.5550636859313842, 12); expect(a4.evs.hit).toBeCloseTo(-0.5751570116265688, 12);
    expect(a4.tableAction).toBe('H'); expect(a4.bestAction).toBe('S'); expect(a4.compositionDeviation).toBe(true); expect(a4.countDeviation?.id).toBe('i18-16v10');
  });
  test('A5-A6: full shoe reports both composition and index advice and pair splits', () => {
    const shoe = newShoe({ decks: 8, burnCards: 0, cutPenetration: 0.75 });
    const shoeA5 = dealSeen(dealSeen(dealSeen(shoe, 'T'), '6'), 'T');
    const a5 = adviseHand(shoeA5, ['T', '6'], 'T', rules(), referenceStrategy, 0);
    expect(a5.evs.stand).toBeCloseTo(-0.540826736160998, 12); expect(a5.evs.hit).toBeCloseTo(-0.5359748431671139, 12);
    expect(a5.tableAction).toBe('H'); expect(a5.bestAction).toBe('H'); expect(a5.compositionDeviation).toBe(false); expect(a5.countDeviation?.id).toBe('i18-16v10');
    const shoeA6 = dealSeen(dealSeen(dealSeen(shoe, '8'), '8'), 'T');
    const a6 = adviseHand(shoeA6, ['8', '8'], 'T', rules(), referenceStrategy, 0);
    expect(a6.tableAction).toBe('P'); expect(a6.bestAction).toBe('P');
  });
  test('A7: split aces cannot hit or double when locked', () => {
    const shoe = dealSeen(newShoe({ decks: 8, burnCards: 0, cutPenetration: 0.75 }), 'A');
    const a7 = adviseHand(shoe, ['A', '5'], '6', { ...rules(), hitSplitAces: false }, referenceStrategy, 0, 2);
    expect(a7.tableAction).toBe('S'); expect(a7.bestAction).toBe('S');
  });
});
