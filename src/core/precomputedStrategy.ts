import type { Rules } from './rules';
import type { StrategyAction, StrategyTable } from './strategy';

const row = (value: string): StrategyAction[] => value.split(' ') as StrategyAction[];
export const BASE_STRATEGY: StrategyTable = {
  hard: {
    5: row('H H H H H H H H H H'), 6: row('H H H H H H H H H H'), 7: row('H H H H H H H H H H'), 8: row('H H H H H H H H H H'),
    9: row('H D D D D H H H H H'), 10: row('D D D D D D D D H H'), 11: row('D D D D D D D D D H'), 12: row('H H S S S H H H H H'),
    13: row('S S S S S H H H H H'), 14: row('S S S S S H H H H H'), 15: row('S S S S S H H H H H'), 16: row('S S S S S H H H H H'),
    17: row('S S S S S S S S S S'), 18: row('S S S S S S S S S S'), 19: row('S S S S S S S S S S'),
  },
  soft: {
    A2: row('H H H D D H H H H H'), A3: row('H H H D D H H H H H'), A4: row('H H D D D H H H H H'), A5: row('H H D D D H H H H H'),
    A6: row('H D D D D H H H H H'), A7: row('S Ds Ds Ds Ds S S H H H'), A8: row('S S S S S S S S S S'), A9: row('S S S S S S S S S S'),
  },
  pairs: {
    AA: row('P P P P P P P P P P'), '22': row('P P P P P P H H H H'), '33': row('P P P P P P H H H H'), '44': row('H H H P P H H H H H'),
    '55': row('D D D D D D D D H H'), '66': row('P P P P P H H H H H'), '77': row('P P P P P P H H H H'), '88': row('P P P P P P P P P P'),
    '99': row('P P P P P S P P S S'), TT: row('S S S S S S S S S S'),
  },
};



export function strategyForRules(rules: Rules): StrategyTable | null {
  return rules.decks === 8 && !rules.dealerHitsSoft17 && rules.doubleAfterSplit
    && rules.dealerPeeks && rules.surrender === 'none' && rules.doubleOn === 'any'
    && rules.maxSplitHands >= 2 ? BASE_STRATEGY : null;
}
