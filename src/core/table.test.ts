import { describe, expect, it } from '@jest/globals';
import type { Rank } from './cards';
import { newShoe } from './shoe';
import { decisionShoe, enterCard, newRound, nextHand, removeCard, seatOrder, setTarget, splitHand, toggleSeat, type DealDirection, type SeatNumber } from './table';

const shoe = () => newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
const active134 = { 1: true, 2: false, 3: true, 4: true, 5: false, 6: false, 7: false } as Record<SeatNumber, boolean>;
const activeNone = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((seat) => [seat, false])) as Record<SeatNumber, boolean>;
const config = { direction: 'rightToLeft' as const, dealerHitsSoft17: false };
function roundWith(ranks: Rank[], active = active134, roundConfig: { direction: DealDirection; dealerHitsSoft17: boolean } = config) {
  return ranks.reduce((round, rank) => enterCard(round, rank), newRound(shoe(), active, roundConfig));
}

describe('table', () => {
  it('orders seats in either direction', () => {
    expect(seatOrder('rightToLeft')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(seatOrder('leftToRight')).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('deals the initial cards in two rounds', () => {
    const round = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    expect(round.hands[1]).toEqual([['A', '5']]);
    expect(round.hands[3]).toEqual([['2', '6']]);
    expect(round.hands[4]).toEqual([['3', '7']]);
    expect(round.hands[2]).toEqual([]);
    expect(round.dealer).toEqual(['4']);
    expect(round.phase).toBe('players');
    expect(round.target).toEqual({ kind: 'seat', seat: 1, hand: 0 });
    expect(round.log).toHaveLength(7);
    expect(round.log.every(({ phase }) => phase === 'initial')).toBe(true);
    expect(round.shoe.seen).toBe(7);
  });

  it('deals initial cards in left to right order', () => {
    const round = roundWith(['A', '2', '3', '4', '5', '6', '7'], active134, { ...config, direction: 'leftToRight' });
    expect(round.hands[4]).toEqual([['A', '5']]);
    expect(round.hands[3]).toEqual([['2', '6']]);
    expect(round.hands[1]).toEqual([['3', '7']]);
    expect(round.dealer).toEqual(['4']);
    expect(round.target).toEqual({ kind: 'seat', seat: 4, hand: 0 });
  });

  it('handles a round with no active seats', () => {
    let round = newRound(shoe(), activeNone, config);
    expect(round.target).toEqual({ kind: 'dealer' });
    round = enterCard(round, '9');
    expect(round.phase).toBe('dealer');
    expect(round.target).toEqual({ kind: 'dealer' });
    round = enterCard(round, '8');
    expect(round.phase).toBe('done');
    expect(() => enterCard(round, '2')).toThrow('La ronda terminó');
  });

  it('advances players and finishes the dealer turn', () => {
    let round = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    round = enterCard(round, '5');
    expect(round.target).toEqual({ kind: 'seat', seat: 3, hand: 0 });
    round = nextHand(round);
    expect(round.target).toEqual({ kind: 'seat', seat: 4, hand: 0 });
    round = enterCard(round, 'T');
    expect(round.target).toEqual({ kind: 'seat', seat: 4, hand: 0 });
    round = nextHand(round);
    expect(round.target).toEqual({ kind: 'dealer' });
    round = enterCard(enterCard(round, 'T'), '5');
    expect(round.phase).toBe('done');
    expect(round.target).toBeNull();
  });

  it('honors the soft 17 rule', () => {
    let round = newRound(shoe(), activeNone, config);
    round = enterCard(enterCard(round, 'A'), '6');
    expect(round.phase).toBe('done');
    let hitsSoft17 = newRound(shoe(), activeNone, { ...config, dealerHitsSoft17: true });
    hitsSoft17 = enterCard(enterCard(hitsSoft17, 'A'), '6');
    expect(hitsSoft17.phase).toBe('dealer');
  });

  it('splits pairs and advances through split hands', () => {
    const active = { ...activeNone, 2: true };
    let round = roundWith(['8', '5', '8'], active);
    round = splitHand(round, 2, 0);
    expect(round.hands[2]).toEqual([['8'], ['8']]);
    round = enterCard(round, '3');
    round = nextHand(round);
    expect(round.target).toEqual({ kind: 'seat', seat: 2, hand: 1 });
    round = enterCard(round, 'T');
    round = nextHand(round);
    expect(round.phase).toBe('dealer');
    expect(() => splitHand(round, 2, 0)).toThrow('Solo se puede dividir una pareja de 2 cartas');
  });

  it('computes the cards known at each seat decision', () => {
    let round = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    round = enterCard(round, '5');
    round = enterCard(round, '9');
    round = nextHand(round);
    round = enterCard(round, 'T');
    round = nextHand(round);
    round = enterCard(round, 'T');
    expect(decisionShoe(round, 3).seen).toBe(9);
    expect(decisionShoe(round, 3).unseen.T).toBe(128);
    expect(decisionShoe(round, 3).unseen['9']).toBe(31);
    expect(decisionShoe(round, 1).seen).toBe(8);
    expect(decisionShoe(round, 1).unseen['9']).toBe(32);
    expect(decisionShoe(round, 4).seen).toBe(10);
    expect(decisionShoe(round, 4).unseen.T).toBe(127);
    expect(round.shoe.seen).toBe(11);
  });

  it('validates manual targets and toggles empty seats', () => {
    let round = newRound(shoe(), active134, config);
    round = setTarget(round, { kind: 'seat', seat: 4, hand: 0 });
    round = enterCard(round, 'A');
    expect(round.target).toEqual({ kind: 'seat', seat: 1, hand: 0 });
    expect(() => setTarget(round, { kind: 'seat', seat: 2, hand: 0 })).toThrow('Objetivo no válido');
    round = newRound(shoe(), active134, config);
    round = toggleSeat(round, 2);
    expect(round.active[2]).toBe(true);
    expect(round.hands[2]).toEqual([[]]);
    round = enterCard(round, 'A');
    expect(round.hands[1]).toEqual([['A']]);
    expect(() => toggleSeat(round, 1)).toThrow('No se puede cambiar un puesto con cartas');
    round = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    expect(() => setTarget(round, { kind: 'dealer' })).toThrow('Objetivo no válido');
  });

  it('removes a card, returns it to the shoe and removes the latest matching log entry', () => {
    const round = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    const updated = removeCard(round, { kind: 'seat', seat: 3, hand: 0 }, 1);
    expect(updated.hands[3]).toEqual([['2']]);
    expect(updated.shoe.seen).toBe(6);
    expect(updated.shoe.unseen['6']).toBe(32);
    expect(updated.log.some(({ rank, target }) => rank === '6' && target.kind === 'seat' && target.seat === 3)).toBe(false);
    expect(updated.phase).toBe('players');
    expect(() => removeCard(updated, { kind: 'seat', seat: 3, hand: 0 }, 5)).toThrow('Carta no encontrada');
    const initial = enterCard(enterCard(newRound(shoe(), active134, config), 'A'), '2');
    expect(removeCard(initial, { kind: 'seat', seat: 3, hand: 0 }, 0).target).toEqual({ kind: 'seat', seat: 3, hand: 0 });
  });

  it('does not mutate earlier round snapshots', () => {
    const initial = roundWith(['A', '2', '3', '4', '5', '6', '7']);
    const later = enterCard(initial, '5');
    expect(initial.hands[1]).toEqual([['A', '5']]);
    expect(initial.shoe.seen).toBe(7);
    expect(later.shoe.seen).toBe(8);
  });
});
