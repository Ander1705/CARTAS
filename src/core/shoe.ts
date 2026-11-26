import { CARDS_PER_DECK, RANKS, type Rank } from './cards';

export interface ShoeConfig {
  decks: number;
  burnCards: number;
  cutPenetration: number;
}

export interface ShoeState {
  readonly config: ShoeConfig;
  readonly unseen: Readonly<Record<Rank, number>>;
  readonly seen: number;
}

export function newShoe(config: ShoeConfig): ShoeState {
  if (!Number.isInteger(config.decks) || config.decks < 1) {
    throw new Error('La cantidad de mazos debe ser un entero mayor o igual a 1');
  }
  const total = config.decks * 52;
  if (!Number.isInteger(config.burnCards) || config.burnCards < 0 || config.burnCards >= total) {
    throw new Error('La cantidad de cartas quemadas debe ser un entero entre 0 y el total de cartas');
  }
  if (!Number.isFinite(config.cutPenetration) || config.cutPenetration <= 0 || config.cutPenetration > 1) {
    throw new Error('La penetración de corte debe ser mayor que 0 y menor o igual a 1');
  }

  const unseen = Object.fromEntries(
    RANKS.map((rank) => [rank, config.decks * CARDS_PER_DECK[rank]]),
  ) as Record<Rank, number>;
  return { config: { ...config }, unseen, seen: 0 };
}

export function totalCards(shoe: ShoeState): number {
  return shoe.config.decks * 52;
}

export function cardsLeftInShoe(shoe: ShoeState): number {
  return totalCards(shoe) - shoe.seen - shoe.config.burnCards;
}

export function penetration(shoe: ShoeState): number {
  return (shoe.seen + shoe.config.burnCards) / totalCards(shoe);
}

export function pastCut(shoe: ShoeState): boolean {
  return penetration(shoe) >= shoe.config.cutPenetration;
}

export function dealSeen(shoe: ShoeState, rank: Rank): ShoeState {
  if (cardsLeftInShoe(shoe) === 0) {
    throw new Error('No quedan cartas en el zapato');
  }
  if (shoe.unseen[rank] === 0) {
    throw new Error(`No quedan cartas de rango ${rank}`);
  }
  return {
    config: shoe.config,
    unseen: { ...shoe.unseen, [rank]: shoe.unseen[rank] - 1 },
    seen: shoe.seen + 1,
  };
}

export function returnCard(shoe: ShoeState, rank: Rank): ShoeState {
  if (shoe.seen === 0) throw new Error('No hay cartas vistas para devolver');
  if (shoe.unseen[rank] === shoe.config.decks * CARDS_PER_DECK[rank]) {
    throw new Error(`No se vio ninguna carta de rango ${rank}`);
  }
  return {
    config: shoe.config,
    unseen: { ...shoe.unseen, [rank]: shoe.unseen[rank] + 1 },
    seen: shoe.seen - 1,
  };
}
