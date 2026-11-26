import { RANKS, type Rank } from './cards';
import type { ShoeState } from './shoe';

export type DealerOutcome = '17' | '18' | '19' | '20' | '21' | 'bust' | 'blackjack';
export type DealerDistribution = Readonly<Record<DealerOutcome, number>>;
export interface DealerOptions { hitSoft17: boolean; peekedNoBlackjack: boolean; }

const OUTCOMES: readonly DealerOutcome[] = ['17', '18', '19', '20', '21', 'bust', 'blackjack'];
const VALUE: Readonly<Record<Rank, number>> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };

export function dealerDistribution(shoe: ShoeState, upcard: Rank, options: DealerOptions): DealerDistribution {
  const initial = RANKS.map((rank) => shoe.unseen[rank]);
  const result: Record<DealerOutcome, number> = { '17': 0, '18': 0, '19': 0, '20': 0, '21': 0, bust: 0, blackjack: 0 };
  const memo = new Map<string, number[]>();
  const holeForbidden = options.peekedNoBlackjack && upcard === 'A' ? 'T'
    : options.peekedNoBlackjack && upcard === 'T' ? 'A' : undefined;

  const visit = (counts: number[], hard: number, hasAce: boolean, oneCard: boolean): number[] => {
    const key = `${counts.join(',')}|${hard}|${hasAce ? 1 : 0}|${oneCard ? 1 : 0}`;
    const cached = memo.get(key);
    if (cached) return cached;
    const best = hasAce && hard + 10 <= 21 ? hard + 10 : hard;
    if (best > 21) return terminal('bust');
    const soft = hasAce && hard + 10 <= 21;
    if (best >= 17 && !(best === 17 && soft && options.hitSoft17)) return terminal(String(best) as DealerOutcome);

    let total = 0;
    for (let i = 0; i < counts.length; i++) if (!oneCard || RANKS[i] !== holeForbidden) total += counts[i];
    if (total <= 0) throw new Error('No quedan cartas sin ver');
    const distribution = new Array<number>(OUTCOMES.length).fill(0);
    for (let i = 0; i < counts.length; i++) {
      const count = counts[i];
      if (count === 0 || (oneCard && RANKS[i] === holeForbidden)) continue;
      counts[i]--;
      const nextHard = hard + VALUE[RANKS[i]];
      const nextHasAce = hasAce || RANKS[i] === 'A';
      const nextBest = nextHasAce && nextHard + 10 <= 21 ? nextHard + 10 : nextHard;
      const child = oneCard && nextBest === 21
        ? terminal('blackjack')
        : visit(counts, nextHard, nextHasAce, false);
      counts[i]++;
      for (let j = 0; j < distribution.length; j++) distribution[j] += count / total * child[j];
    }
    memo.set(key, distribution);
    return distribution;
  };

  const terminal = (outcome: DealerOutcome): number[] => {
    const values = new Array<number>(OUTCOMES.length).fill(0);
    values[OUTCOMES.indexOf(outcome)] = 1;
    return values;
  };

  const distribution = visit(initial, VALUE[upcard], upcard === 'A', true);
  OUTCOMES.forEach((outcome, index) => { result[outcome] = distribution[index]; });
  return result;
}
