import type { Rank } from './cards';
import type { Rules } from './rules';
import type { ShoeState } from './shoe';
import { playerEVs, type PlayerEVs } from './ev';
import type { StrategyAction, StrategyTable } from './strategy';

export type PlayAction = 'H' | 'S' | 'D' | 'P' | 'R';
export interface CountDeviation {
  id: string; set: 'I18' | 'Fab4';
  hand: { kind: 'hard'; total: number } | { kind: 'pair'; rank: Rank };
  upcard: Rank; action: PlayAction; index: number;
  direction: 'atOrAbove' | 'below';
  twoCardsOnly: boolean;
  source: string; rules: string;
}

export const INSURANCE_INDEX = 3;
export function shouldTakeInsurance(tcIndex: number): boolean { return tcIndex >= INSURANCE_INDEX; }

const source = 'Schlesinger, Blackjack Attack (Illustrious 18 / Fab 4), vía bj21.com y blackjackstrategy.io';
const ruleNote = 'Hi-Lo, 6 mazos, S17, DAS (se usa para 8 mazos: puede variar ±1)';
const hard = (total: number) => ({ kind: 'hard' as const, total });
const pair = (rank: Rank) => ({ kind: 'pair' as const, rank });
const deviation = (id: string, set: CountDeviation['set'], hand: CountDeviation['hand'], upcard: Rank, action: PlayAction, index: number, direction: CountDeviation['direction'], twoCardsOnly = false): CountDeviation => ({ id, set, hand, upcard, action, index, direction, twoCardsOnly, source, rules: ruleNote });

export const COUNT_DEVIATIONS: readonly CountDeviation[] = [
  deviation('fab4-14v10', 'Fab4', hard(14), 'T', 'R', 3, 'atOrAbove', true),
  deviation('fab4-15v10', 'Fab4', hard(15), 'T', 'R', 0, 'atOrAbove', true),
  deviation('fab4-15v9', 'Fab4', hard(15), '9', 'R', 2, 'atOrAbove', true),
  deviation('fab4-15vA', 'Fab4', hard(15), 'A', 'R', 1, 'atOrAbove', true),
  deviation('i18-16v10', 'I18', hard(16), 'T', 'S', 0, 'atOrAbove'),
  deviation('i18-15v10', 'I18', hard(15), 'T', 'S', 4, 'atOrAbove'),
  deviation('i18-TTv5', 'I18', pair('T'), '5', 'P', 5, 'atOrAbove', true),
  deviation('i18-TTv6', 'I18', pair('T'), '6', 'P', 4, 'atOrAbove', true),
  deviation('i18-10v10', 'I18', hard(10), 'T', 'D', 4, 'atOrAbove', true),
  deviation('i18-12v3', 'I18', hard(12), '3', 'S', 2, 'atOrAbove'),
  deviation('i18-12v2', 'I18', hard(12), '2', 'S', 3, 'atOrAbove'),
  deviation('i18-11vA', 'I18', hard(11), 'A', 'D', 1, 'atOrAbove', true),
  deviation('i18-9v2', 'I18', hard(9), '2', 'D', 1, 'atOrAbove', true),
  deviation('i18-10vA', 'I18', hard(10), 'A', 'D', 4, 'atOrAbove', true),
  deviation('i18-9v7', 'I18', hard(9), '7', 'D', 3, 'atOrAbove', true),
  deviation('i18-16v9', 'I18', hard(16), '9', 'S', 5, 'atOrAbove'),
  deviation('i18-13v2', 'I18', hard(13), '2', 'H', -1, 'below'),
  deviation('i18-12v4', 'I18', hard(12), '4', 'H', 0, 'below'),
  deviation('i18-12v5', 'I18', hard(12), '5', 'H', -2, 'below'),
  deviation('i18-12v6', 'I18', hard(12), '6', 'H', -1, 'below'),
  deviation('i18-13v3', 'I18', hard(13), '3', 'H', -2, 'below'),
];

const VALUE: Readonly<Record<Rank, number>> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };
const COLUMNS: readonly Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'];

export function findCountDeviation(hand: readonly Rank[], upcard: Rank, tcIndex: number, rules: Rules): CountDeviation | null {
  const hardTotal = hand.reduce((sum, rank) => sum + VALUE[rank], 0);
  const hasAce = hand.includes('A');
  const soft = hasAce && hardTotal + 10 <= 21;
  for (const entry of COUNT_DEVIATIONS) {
    if (entry.set === 'Fab4' && rules.surrender !== 'late') continue;
    if (rules.surrender === 'late' && hand.length === 2 && ['i18-16v10', 'i18-16v9', 'i18-15v10'].includes(entry.id)) continue;
    if (entry.upcard !== upcard || (entry.twoCardsOnly && hand.length !== 2)) continue;
    if (entry.hand.kind === 'pair') {
      if (hand.length !== 2 || hand[0] !== entry.hand.rank || hand[1] !== entry.hand.rank) continue;
    } else if (soft || hardTotal !== entry.hand.total) continue;
    if (entry.direction === 'atOrAbove' ? tcIndex >= entry.index : tcIndex < entry.index) return entry;
  }
  return null;
}

export interface PlayAdvice { evs: PlayerEVs; tableAction: PlayAction; bestAction: PlayAction; compositionDeviation: boolean; countDeviation: CountDeviation | null; }

export function adviseHand(shoe: ShoeState, hand: readonly Rank[], upcard: Rank, rules: Rules, table: StrategyTable, tcIndex: number, splitHands = 1): PlayAdvice {
  const evs = playerEVs(shoe, hand, upcard, rules, splitHands);
  const hardTotal = hand.reduce((sum, rank) => sum + VALUE[rank], 0);
  const soft = hand.includes('A') && hardTotal + 10 <= 21;
  const total = soft ? hardTotal + 10 : hardTotal;
  let tableChoice: StrategyAction;
  if (hand.length === 2 && hand[0] === hand[1] && evs.split !== null) tableChoice = table.pairs[`${hand[0]}${hand[0]}`][COLUMNS.indexOf(upcard)];
  else if (soft) tableChoice = total === 21 ? 'S' : total === 12 ? 'H' : table.soft[`A${total - 11}`][COLUMNS.indexOf(upcard)];
  else tableChoice = total <= 4 ? 'H' : total >= 20 ? 'S' : table.hard[total][COLUMNS.indexOf(upcard)];

  const hardSoftChoice = (): StrategyAction => soft
    ? (total === 21 ? 'S' : total === 12 ? 'H' : table.soft[`A${total - 11}`][COLUMNS.indexOf(upcard)])
    : (total <= 4 ? 'H' : total >= 20 ? 'S' : table.hard[total][COLUMNS.indexOf(upcard)]);
  const resolve = (action: StrategyAction): PlayAction => {
    switch (action) {
      case 'D': return evs.double !== null ? 'D' : 'H';
      case 'Ds': return evs.double !== null ? 'D' : 'S';
      case 'P': return evs.split !== null ? 'P' : resolve(hardSoftChoice());
      case 'R': return evs.surrender !== null ? 'R' : 'H';
      default: return action;
    }
  };
  let tableAction = resolve(tableChoice);
  const actionEV = (action: PlayAction): number | null => action === 'S' ? evs.stand : action === 'H' ? evs.hit : action === 'D' ? evs.double : action === 'P' ? evs.split : evs.surrender;
  if (actionEV(tableAction) === null) tableAction = 'S';
  const candidates: PlayAction[] = ['S', 'H', 'D', 'P', 'R'];
  let bestAction: PlayAction = candidates[0];
  for (const action of candidates.slice(1)) {
    const value = actionEV(action);
    if (value !== null && value > actionEV(bestAction)!) bestAction = action;
  }
  return { evs, tableAction, bestAction, compositionDeviation: bestAction !== tableAction, countDeviation: findCountDeviation(hand, upcard, tcIndex, rules) };
}
