import { type Rank } from './cards';
import { playerEVs, type PlayerEVs, type EVCache } from './ev';
import { type Rules, shoeConfigFrom } from './rules';
import { dealSeen, newShoe } from './shoe';

export type StrategyAction = 'H' | 'S' | 'D' | 'Ds' | 'P' | 'R';
export const DEALER_COLUMNS: readonly Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'];
export interface StrategyTable { hard: Record<number, StrategyAction[]>; soft: Record<string, StrategyAction[]>; pairs: Record<string, StrategyAction[]>; }

type HandEV = Pick<PlayerEVs, 'stand' | 'hit' | 'double' | 'surrender' | 'split'>;
type AveragedEV = { [K in keyof HandEV]: number | null } & { stand: number };
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T'] as const;
const VALUE: Readonly<Record<Rank, number>> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };

function decision(ev: HandEV): StrategyAction {
  const options: [StrategyAction, number | null][] = [['S', ev.stand], ['H', ev.hit], ['D', ev.double], ['P', ev.split], ['R', ev.surrender]];
  let best = options[0];
  for (const option of options.slice(1)) if (option[1] !== null && option[1]! > best[1]!) best = option;
  return best[0] === 'D' ? (ev.hit! > ev.stand ? 'D' : 'Ds') : best[0];
}

function average(hands: { ev: PlayerEVs; weight: number }[]): StrategyAction {
  const fields = ['stand', 'hit', 'double', 'surrender', 'split'] as const;
  const averaged = {} as AveragedEV;
  for (const field of fields) {
    let sum = 0;
    let weight = 0;
    for (const hand of hands) if (hand.ev[field] !== null) { sum += hand.ev[field]! * hand.weight; weight += hand.weight; }
    if (field === 'stand') averaged.stand = weight === 0 ? 0 : sum / weight;
    else averaged[field] = weight === 0 ? null : sum / weight;
  }
  return decision(averaged);
}

export function generateStrategy(rules: Rules): StrategyTable {
  const table: StrategyTable = { hard: {}, soft: {}, pairs: {} };
  for (const upcard of DEALER_COLUMNS) {
    let base = newShoe(shoeConfigFrom(rules));
    base = dealSeen(base, upcard);
    const cache: EVCache = { dealer: new Map(), hit: new Map() };
    const evaluate = (a: Rank, b: Rank) => {
      const shoe = dealSeen(dealSeen(base, a), b);
      return playerEVs(shoe, [a, b], upcard, rules, 1, cache);
    };
    for (let total = 5; total <= 19; total++) {
      const hands: { ev: PlayerEVs; weight: number }[] = [];
      for (let i = 0; i < RANKS.length; i++) for (let j = i + 1; j < RANKS.length; j++) {
        const a = RANKS[i]; const b = RANKS[j];
        if (VALUE[a] + VALUE[b] === total) hands.push({ ev: evaluate(a, b), weight: base.unseen[a] * base.unseen[b] });
      }
      if (hands.length) (table.hard[total] ??= [])[DEALER_COLUMNS.indexOf(upcard)] = average(hands);
    }
    for (let value = 2; value <= 9; value++) {
      const key = `A${value}`;
      table.soft[key] ??= Array<StrategyAction>(10);
      table.soft[key][DEALER_COLUMNS.indexOf(upcard)] = average([{ ev: evaluate('A', String(value) as Rank), weight: 1 }]);
    }
    for (const rank of ['A', ...RANKS] as Rank[]) {
      const key = `${rank}${rank}`;
      table.pairs[key] ??= Array<StrategyAction>(10);
      table.pairs[key][DEALER_COLUMNS.indexOf(upcard)] = average([{ ev: evaluate(rank, rank), weight: 1 }]);
    }
  }
  return table;
}
