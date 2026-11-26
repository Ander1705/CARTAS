export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T';

export const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];

/** Cards of each rank in ONE 52-card deck. T = 10,J,Q,K -> 16. */
export const CARDS_PER_DECK: Readonly<Record<Rank, number>> = {
  A: 4,
  '2': 4,
  '3': 4,
  '4': 4,
  '5': 4,
  '6': 4,
  '7': 4,
  '8': 4,
  '9': 4,
  T: 16,
};

const HILO_VALUES: Readonly<Record<Rank, -1 | 0 | 1>> = {
  A: -1,
  '2': 1,
  '3': 1,
  '4': 1,
  '5': 1,
  '6': 1,
  '7': 0,
  '8': 0,
  '9': 0,
  T: -1,
};

export function hiloValue(rank: Rank): -1 | 0 | 1 {
  return HILO_VALUES[rank];
}

const RANK_LOOKUP: Readonly<Record<string, Rank | undefined>> = {
  A: 'A',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  T: 'T',
  '10': 'T',
  '0': 'T',
  J: 'T',
  Q: 'T',
  K: 'T',
};

export function parseRank(input: string): Rank {
  const normalized = input.trim().toUpperCase();
  const rank = RANK_LOOKUP[normalized];

  if (rank === undefined) {
    throw new Error(`Rango inválido: "${input}"`);
  }

  return rank;
}
