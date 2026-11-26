import { CARDS_PER_DECK, hiloValue, RANKS } from './cards';
import type { ShoeState } from './shoe';
import { cardsLeftInShoe } from './shoe';

export type DeckResolution = 'exact' | 'half' | 'whole';
export type TcRounding = 'truncate' | 'floor' | 'round';

export function runningCount(shoe: ShoeState): number {
  return RANKS.reduce(
    (count, rank) => count + (shoe.config.decks * CARDS_PER_DECK[rank] - shoe.unseen[rank]) * hiloValue(rank),
    0,
  );
}

export function decksRemaining(shoe: ShoeState, resolution: DeckResolution = 'exact'): number {
  const decks = cardsLeftInShoe(shoe) / 52;
  switch (resolution) {
    case 'exact': return decks;
    case 'half': return Math.max(0.5, Math.round(decks * 2) / 2);
    case 'whole': return Math.max(1, Math.round(decks));
    default: throw new Error(`Resolución de mazos inválida: ${resolution}`);
  }
}

export function trueCount(shoe: ShoeState, resolution: DeckResolution = 'exact'): number {
  if (cardsLeftInShoe(shoe) === 0) return 0;
  return runningCount(shoe) / decksRemaining(shoe, resolution);
}

export function tcForIndex(tc: number, rounding: TcRounding = 'truncate'): number {
  let result: number;
  switch (rounding) {
    case 'truncate': result = Math.trunc(tc); break;
    case 'floor': result = Math.floor(tc); break;
    case 'round': result = Math.sign(tc) * Math.round(Math.abs(tc)); break;
    default: throw new Error(`Redondeo inválido: ${rounding}`);
  }
  return result === 0 ? 0 : result;
}
