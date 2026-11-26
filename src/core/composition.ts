import { RANKS, type Rank } from './cards';
import type { ShoeState } from './shoe';

export type RankProbabilities = Readonly<Record<Rank, number>>;

function totalUnseen(shoe: ShoeState): number {
  return RANKS.reduce((total, rank) => total + shoe.unseen[rank], 0);
}

export function nextCardProbabilities(shoe: ShoeState): RankProbabilities {
  const total = totalUnseen(shoe);
  if (total === 0) {
    throw new Error('No quedan cartas sin ver');
  }
  return Object.fromEntries(RANKS.map((rank) => [rank, shoe.unseen[rank] / total])) as Record<Rank, number>;
}

export function groupProbabilities(shoe: ShoeState): { ace: number; ten: number; small: number; neutral: number } {
  const probabilities = nextCardProbabilities(shoe);
  return {
    ace: probabilities.A,
    ten: probabilities.T,
    small: probabilities['2'] + probabilities['3'] + probabilities['4'] + probabilities['5'] + probabilities['6'],
    neutral: probabilities['7'] + probabilities['8'] + probabilities['9'],
  };
}

export function holeCardProbabilities(
  shoe: ShoeState,
  upcard: Rank,
  peekedNoBlackjack: boolean,
): RankProbabilities {
  let total = totalUnseen(shoe);
  if (total === 0) {
    throw new Error('No quedan cartas sin ver');
  }

  const unseen: Record<Rank, number> = { ...shoe.unseen };
  if (peekedNoBlackjack && upcard === 'A') {
    total -= unseen.T;
    unseen.T = 0;
  } else if (peekedNoBlackjack && upcard === 'T') {
    total -= unseen.A;
    unseen.A = 0;
  }
  if (total === 0) {
    throw new Error('No quedan cartas sin ver');
  }
  return Object.fromEntries(RANKS.map((rank) => [rank, unseen[rank] / total])) as Record<Rank, number>;
}
