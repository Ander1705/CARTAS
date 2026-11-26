import type { Rank } from './cards';
import { dealSeen, returnCard, type ShoeState } from './shoe';

export type SeatNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6, 7];
export type DealDirection = 'rightToLeft' | 'leftToRight';
export type Target = { kind: 'seat'; seat: SeatNumber; hand: number } | { kind: 'dealer' };
export type RoundPhase = 'initial' | 'players' | 'dealer' | 'done';
export interface LogEntry { rank: Rank; target: Target; phase: 'initial' | 'players' | 'dealer'; }
export interface RoundConfig { direction: DealDirection; dealerHitsSoft17: boolean; }
export interface RoundState {
  config: RoundConfig;
  startShoe: ShoeState;
  shoe: ShoeState;
  active: Record<SeatNumber, boolean>;
  hands: Record<SeatNumber, Rank[][]>;
  dealer: Rank[];
  log: LogEntry[];
  phase: RoundPhase;
  target: Target | null;
}

export function seatOrder(direction: DealDirection): SeatNumber[] {
  return direction === 'rightToLeft' ? [...SEATS] : [...SEATS].reverse();
}

function activeSeats(round: RoundState): SeatNumber[] {
  return seatOrder(round.config.direction).filter((seat) => round.active[seat]);
}

function nextInitialSlot(round: RoundState): Pick<RoundState, 'phase' | 'target'> {
  const seats = activeSeats(round);
  const firstEmpty = seats.find((seat) => round.hands[seat][0]?.length === 0);
  if (firstEmpty !== undefined) return { phase: 'initial', target: { kind: 'seat', seat: firstEmpty, hand: 0 } };
  if (round.dealer.length === 0) return { phase: 'initial', target: { kind: 'dealer' } };
  const firstOne = seats.find((seat) => round.hands[seat][0]?.length === 1);
  if (firstOne !== undefined) return { phase: 'initial', target: { kind: 'seat', seat: firstOne, hand: 0 } };
  return seats.length
    ? { phase: 'players', target: { kind: 'seat', seat: seats[0], hand: 0 } }
    : { phase: 'dealer', target: { kind: 'dealer' } };
}

export function newRound(shoe: ShoeState, active: Record<SeatNumber, boolean>, config: RoundConfig): RoundState {
  const round: RoundState = {
    config: { ...config }, startShoe: shoe, shoe, active: { ...active },
    hands: Object.fromEntries(SEATS.map((seat) => [seat, active[seat] ? [[]] : []])) as unknown as Record<SeatNumber, Rank[][]>,
    dealer: [], log: [], phase: 'initial', target: null,
  };
  return { ...round, ...nextInitialSlot(round) };
}

function handTotal(cards: Rank[]): { total: number; soft: boolean } {
  const base = cards.reduce((sum, rank) => sum + (rank === 'A' ? 1 : rank === 'T' ? 10 : Number(rank)), 0);
  const soft = cards.includes('A') && base + 10 <= 21;
  return { total: base + (soft ? 10 : 0), soft };
}

function logTarget(target: Target): Target {
  return target.kind === 'dealer' ? { kind: 'dealer' } : { ...target };
}

export function nextHand(round: RoundState): RoundState {
  if (round.phase === 'dealer') return { ...round, phase: 'done', target: null };
  if (round.phase !== 'players' || round.target?.kind !== 'seat') throw new Error('Siguiente solo durante el juego');
  const { seat, hand } = round.target;
  if (hand + 1 < round.hands[seat].length) return { ...round, target: { kind: 'seat', seat, hand: hand + 1 } };
  const seats = activeSeats(round);
  const nextSeat = seats[seats.indexOf(seat) + 1];
  return nextSeat === undefined
    ? { ...round, phase: 'dealer', target: { kind: 'dealer' } }
    : { ...round, target: { kind: 'seat', seat: nextSeat, hand: 0 } };
}

export function enterCard(round: RoundState, rank: Rank): RoundState {
  if (round.phase === 'done' || round.target === null) throw new Error('La ronda terminó');
  const target = round.target;
  const shoe = dealSeen(round.shoe, rank);
  let hands = round.hands;
  let dealer = round.dealer;
  if (target.kind === 'dealer') dealer = [...dealer, rank];
  else hands = { ...hands, [target.seat]: hands[target.seat].map((cards, index) => index === target.hand ? [...cards, rank] : cards) };
  const updated: RoundState = { ...round, shoe, hands, dealer, log: [...round.log, { rank, target: logTarget(target), phase: round.phase }] };
  if (round.phase === 'initial') return { ...updated, ...nextInitialSlot(updated) };
  if (round.phase === 'players' && target.kind === 'seat') {
    if (handTotal(hands[target.seat][target.hand]).total >= 21) return nextHand(updated);
    return updated;
  }
  const { total, soft } = handTotal(dealer);
  if (dealer.length >= 2 && (total > 21 || (total >= 17 && !(soft && round.config.dealerHitsSoft17)))) {
    return { ...updated, phase: 'done', target: null };
  }
  return updated;
}

export function setTarget(round: RoundState, target: Target): RoundState {
  if (round.phase === 'done') throw new Error('La ronda terminó');
  const valid = target.kind === 'dealer'
    ? (round.phase === 'initial' ? round.dealer.length === 0 : round.phase === 'dealer')
    : round.active[target.seat] && (round.phase === 'initial'
      ? target.hand === 0 && round.hands[target.seat][0]?.length < 2
      : round.phase === 'players' && Number.isInteger(target.hand) && target.hand >= 0 && target.hand < round.hands[target.seat].length);
  if (!valid) throw new Error('Objetivo no válido');
  return { ...round, target: logTarget(target) };
}

export function splitHand(round: RoundState, seat: SeatNumber, hand: number): RoundState {
  const cards = round.hands[seat][hand];
  if (round.phase !== 'players' || !cards || cards.length !== 2 || cards[0] !== cards[1]) {
    throw new Error('Solo se puede dividir una pareja de 2 cartas');
  }
  const hands = { ...round.hands, [seat]: [...round.hands[seat].slice(0, hand), [cards[0]], [cards[1]], ...round.hands[seat].slice(hand + 1)] };
  return { ...round, hands, target: { kind: 'seat', seat, hand } };
}

function sameTarget(a: Target, b: Target): boolean {
  return a.kind === b.kind && (a.kind === 'dealer' || (b.kind === 'seat' && a.seat === b.seat && a.hand === b.hand));
}

export function removeCard(round: RoundState, target: Target, cardIndex: number): RoundState {
  const cards = target.kind === 'dealer' ? round.dealer : round.hands[target.seat]?.[target.hand];
  if (!cards || !Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= cards.length) throw new Error('Carta no encontrada');
  const rank = cards[cardIndex];
  const remaining = cards.filter((_, index) => index !== cardIndex);
  const logIndex = round.log.findLastIndex((entry) => entry.rank === rank && sameTarget(entry.target, target));
  const log = logIndex < 0 ? round.log : round.log.filter((_, index) => index !== logIndex);
  const updated: RoundState = {
    ...round,
    shoe: returnCard(round.shoe, rank),
    dealer: target.kind === 'dealer' ? remaining : round.dealer,
    hands: target.kind === 'seat' ? { ...round.hands, [target.seat]: round.hands[target.seat].map((hand, index) => index === target.hand ? remaining : hand) } : round.hands,
    log,
  };
  return round.phase === 'initial' ? { ...updated, ...nextInitialSlot(updated) } : updated;
}

export function toggleSeat(round: RoundState, seat: SeatNumber): RoundState {
  if (round.phase !== 'initial' || round.hands[seat].some((hand) => hand.length > 0)) throw new Error('No se puede cambiar un puesto con cartas');
  const active = { ...round.active, [seat]: !round.active[seat] };
  const hands = { ...round.hands, [seat]: active[seat] ? [[]] : [] };
  const updated = { ...round, active, hands };
  return { ...updated, ...nextInitialSlot(updated) };
}

export function decisionShoe(round: RoundState, mySeat: SeatNumber): ShoeState {
  const order = seatOrder(round.config.direction);
  const myIndex = order.indexOf(mySeat);
  return round.log.reduce((shoe, entry) => {
    const counts = entry.phase === 'initial' || (entry.phase === 'players' && entry.target.kind === 'seat' && order.indexOf(entry.target.seat) <= myIndex);
    return counts ? dealSeen(shoe, entry.rank) : shoe;
  }, round.startShoe);
}
