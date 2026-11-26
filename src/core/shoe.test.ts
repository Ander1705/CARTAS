import { describe, expect, it } from '@jest/globals';
import { CARDS_PER_DECK, RANKS, type Rank } from './cards';
import { cardsLeftInShoe, dealSeen, newShoe, pastCut, penetration, totalCards } from './shoe';
import { decksRemaining, runningCount, trueCount } from './hilo';

function dealMany(shoe: ReturnType<typeof newShoe>, rank: Rank, n: number) {
  let current = shoe;
  for (let i = 0; i < n; i += 1) current = dealSeen(current, rank);
  return current;
}

function dealSeq(shoe: ReturnType<typeof newShoe>, ranks: Rank[]) {
  return ranks.reduce((current, rank) => dealSeen(current, rank), shoe);
}

describe('shoe', () => {
  it('initializes a shoe and reports composition', () => {
    const shoe = newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    expect(shoe.unseen.T).toBe(128);
    expect(shoe.unseen.A).toBe(32);
    expect(shoe.unseen['5']).toBe(32);
    expect(Object.values(shoe.unseen).reduce((a, b) => a + b, 0)).toBe(416);
    expect(shoe.seen).toBe(0);
    expect(totalCards(shoe)).toBe(416);
    expect(cardsLeftInShoe(shoe)).toBe(415);
    expect(penetration(shoe)).toBeCloseTo(1 / 416, 10);
    expect(pastCut(shoe)).toBe(false);
    expect(decksRemaining(shoe)).toBeCloseTo(415 / 52, 10);
    expect(decksRemaining(shoe, 'half')).toBe(8);
    expect(decksRemaining(shoe, 'whole')).toBe(8);
  });

  it.each([
    [{ decks: 0, burnCards: 0, cutPenetration: 0.75 }],
    [{ decks: 1.5, burnCards: 0, cutPenetration: 0.75 }],
    [{ decks: 1, burnCards: -1, cutPenetration: 0.75 }],
    [{ decks: 1, burnCards: 1.5, cutPenetration: 0.75 }],
    [{ decks: 1, burnCards: 52, cutPenetration: 0.75 }],
    [{ decks: 1, burnCards: 0, cutPenetration: 0 }],
    [{ decks: 1, burnCards: 0, cutPenetration: 1.01 }],
  ])('rejects invalid config %j', (config) => {
    expect(() => newShoe(config)).toThrow(Error);
  });

  it('does not mutate the original shoe when dealing', () => {
    const shoe = newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 });
    const dealt = dealSeen(shoe, 'A');
    expect(shoe.seen).toBe(0);
    expect(shoe.unseen.A).toBe(4);
    expect(dealt.seen).toBe(1);
    expect(dealt.unseen.A).toBe(3);
  });

  it('tracks seen cards and count', () => {
    const shoe = newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    const dealt = dealSeq(shoe, ['5', 'T', '3', '9', 'A', '2']);
    expect(runningCount(dealt)).toBe(1);
    expect(dealt.unseen.T).toBe(127);
    expect(dealt.unseen.A).toBe(31);
    expect(dealt.unseen['5']).toBe(31);
    expect(dealt.seen).toBe(6);
    expect(cardsLeftInShoe(dealt)).toBe(409);
  });

  it('rejects dealing a depleted rank', () => {
    const shoe = dealMany(newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 }), 'A', 4);
    expect(shoe.unseen.A).toBe(0);
    expect(() => dealSeen(shoe, 'A')).toThrow('No quedan cartas de rango A');
  });

  it('depletes the full shoe with a balanced count', () => {
    const ranks: Rank[] = RANKS.flatMap((rank) => Array.from({ length: CARDS_PER_DECK[rank] }, () => rank));
    const shoe = dealSeq(newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 }), ranks);
    expect(runningCount(shoe)).toBe(0);
    expect(cardsLeftInShoe(shoe)).toBe(0);
    expect(penetration(shoe)).toBe(1);
    expect(pastCut(shoe)).toBe(true);
    expect(trueCount(shoe)).toBe(0);
    expect(() => dealSeen(shoe, 'A')).toThrow('No quedan cartas de rango A');
  });

  it('crosses the cut at exactly 39 cards', () => {
    let shoe = newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 });
    const first38 = RANKS.flatMap((rank) => Array.from({ length: CARDS_PER_DECK[rank] }, () => rank)).slice(0, 38);
    shoe = dealSeq(shoe, first38);
    expect(pastCut(shoe)).toBe(false);
    shoe = dealSeen(shoe, 'T');
    expect(pastCut(shoe)).toBe(true);
  });

  it('computes eight deck exact true count after the specified sequence', () => {
    let shoe = newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    for (const [rank, n] of [['2', 9], ['7', 32], ['8', 32], ['9', 32], ['3', 25], ['T', 25]] as const) {
      shoe = dealMany(shoe, rank, n);
    }
    expect(shoe.seen).toBe(155);
    expect(runningCount(shoe)).toBe(9);
    expect(cardsLeftInShoe(shoe)).toBe(260);
    expect(decksRemaining(shoe)).toBe(5);
    expect(trueCount(shoe)).toBeCloseTo(1.8, 10);
    expect(penetration(shoe)).toBe(0.375);
  });

  it('supports half and whole deck resolutions', () => {
    let shoe = newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    for (const [rank, n] of [['2', 7], ['7', 32], ['8', 32], ['9', 32], ['3', 32], ['4', 32], ['5', 22], ['T', 86]] as const) {
      shoe = dealMany(shoe, rank, n);
    }
    expect(shoe.seen).toBe(275);
    expect(runningCount(shoe)).toBe(7);
    expect(cardsLeftInShoe(shoe)).toBe(140);
    expect(trueCount(shoe)).toBeCloseTo(2.6, 10);
    expect(decksRemaining(shoe, 'half')).toBe(2.5);
    expect(trueCount(shoe, 'half')).toBeCloseTo(2.8, 10);
    expect(decksRemaining(shoe, 'whole')).toBe(3);
    expect(trueCount(shoe, 'whole')).toBeCloseTo(7 / 3, 10);
  });

  it('applies minimum half and whole deck resolutions', () => {
    const ranks = RANKS.flatMap((rank) => Array.from({ length: CARDS_PER_DECK[rank] }, () => rank));
    const shoe = dealSeq(newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 }), ranks.slice(0, 42));
    expect(cardsLeftInShoe(shoe)).toBe(10);
    expect(decksRemaining(shoe)).toBeCloseTo(10 / 52, 10);
    expect(decksRemaining(shoe, 'half')).toBe(0.5);
    expect(decksRemaining(shoe, 'whole')).toBe(1);
  });

  it('does not include burned cards in the running count', () => {
    const shoe = dealSeq(newShoe({ decks: 1, burnCards: 5, cutPenetration: 0.75 }), ['2', '3']);
    expect(runningCount(shoe)).toBe(2);
    expect(cardsLeftInShoe(shoe)).toBe(45);
    expect(penetration(shoe)).toBeCloseTo(7 / 52, 10);
  });
});
