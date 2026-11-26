import { describe, expect, it } from '@jest/globals';
import { newShoe } from './shoe';
import {
  DEFAULT_RULES,
  UNCONFIRMED_RULES,
  shoeConfigFrom,
  validateRules,
  type Rules,
} from './rules';

describe('rules', () => {
  it('R1 returns an equal copy of the rules', () => {
    const result = validateRules(DEFAULT_RULES);
    expect(result).toEqual(DEFAULT_RULES);
    expect(result).not.toBe(DEFAULT_RULES);
  });

  it('R2 rejects invalid values', () => {
    const invalidRules: Rules[] = [
      { ...DEFAULT_RULES, decks: 0 },
      { ...DEFAULT_RULES, decks: 2.5 },
      { ...DEFAULT_RULES, burnCards: -1 },
      { ...DEFAULT_RULES, burnCards: 416 },
      { ...DEFAULT_RULES, cutPenetration: 0 },
      { ...DEFAULT_RULES, cutPenetration: 1.2 },
      { ...DEFAULT_RULES, blackjackPays: 0 },
      { ...DEFAULT_RULES, insurancePays: -1 },
      { ...DEFAULT_RULES, maxSplitHands: 0 },
      { ...DEFAULT_RULES, maxSplitHands: 9 },
      { ...DEFAULT_RULES, maxSplitHands: 2.5 },
      { ...DEFAULT_RULES, surrender: 'early' as Rules['surrender'] },
      { ...DEFAULT_RULES, doubleOn: '8-11' as Rules['doubleOn'] },
    ];
    for (const rules of invalidRules) {
      expect(() => validateRules(rules)).toThrow(Error);
    }
  });

  it('R3 converts the defaults to a working shoe config', () => {
    expect(shoeConfigFrom(DEFAULT_RULES)).toEqual({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    expect(newShoe(shoeConfigFrom(DEFAULT_RULES))).toBeDefined();
  });

  it('R4 lists only unconfirmed rule keys', () => {
    expect(UNCONFIRMED_RULES).not.toContain('dealerHitsSoft17');
    expect(UNCONFIRMED_RULES).not.toContain('blackjackPays');
    expect(UNCONFIRMED_RULES).not.toContain('insurancePays');
    for (const key of UNCONFIRMED_RULES) {
      expect(key in DEFAULT_RULES).toBe(true);
    }
  });
});
