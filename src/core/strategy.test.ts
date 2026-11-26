import { beforeAll, describe, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { generateStrategy, type StrategyTable } from './strategy';
import { referenceStrategy } from './__fixtures__/referenceStrategy';

describe('generateStrategy default rules', () => {
  let actual: StrategyTable;
  beforeAll(() => { actual = generateStrategy({ ...DEFAULT_RULES }); }, 600000);
  it('duros 5-8', () => { for (const key of [5, 6, 7, 8]) expect(actual.hard[key]).toEqual(referenceStrategy.hard[key]); }, 600000);
  it('duro 9', () => expect(actual.hard[9]).toEqual(referenceStrategy.hard[9]), 600000);
  it('duro 10', () => expect(actual.hard[10]).toEqual(referenceStrategy.hard[10]), 600000);
  it('duro 11', () => expect(actual.hard[11]).toEqual(referenceStrategy.hard[11]), 600000);
  it('duro 12', () => expect(actual.hard[12]).toEqual(referenceStrategy.hard[12]), 600000);
  it('duros 13-16', () => { for (const key of [13, 14, 15, 16]) expect(actual.hard[key]).toEqual(referenceStrategy.hard[key]); }, 600000);
  it('duros 17-19', () => { for (const key of [17, 18, 19]) expect(actual.hard[key]).toEqual(referenceStrategy.hard[key]); }, 600000);
  it('suaves A2-A3', () => { for (const key of ['A2', 'A3']) expect(actual.soft[key]).toEqual(referenceStrategy.soft[key]); }, 600000);
  it('suaves A4-A5', () => { for (const key of ['A4', 'A5']) expect(actual.soft[key]).toEqual(referenceStrategy.soft[key]); }, 600000);
  it('suave A6', () => expect(actual.soft.A6).toEqual(referenceStrategy.soft.A6), 600000);
  it('suave A7', () => expect(actual.soft.A7).toEqual(referenceStrategy.soft.A7), 600000);
  it('suaves A8-A9', () => { for (const key of ['A8', 'A9']) expect(actual.soft[key]).toEqual(referenceStrategy.soft[key]); }, 600000);
  for (const key of ['AA', '22', '33', '44', '55', '66', '77', '88', '99', 'TT']) it(`pareja ${key}`, () => expect(actual.pairs[key]).toEqual(referenceStrategy.pairs[key]), 600000);
  it('tabla completa', () => expect(actual).toEqual(referenceStrategy), 600000);
});
