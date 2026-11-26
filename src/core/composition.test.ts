import { describe, expect, it } from '@jest/globals';
import { dealSeen, newShoe } from './shoe';
import { groupProbabilities, holeCardProbabilities, nextCardProbabilities } from './composition';
import type { Rank } from './cards';

const expectClose = (actual: number, expected: number) => expect(actual).toBeCloseTo(expected, 12);
const probabilitySum = (probabilities: Readonly<Record<Rank, number>>) =>
  Object.values(probabilities).reduce((sum, probability) => sum + probability, 0);

function deal(shoe: ReturnType<typeof newShoe>, ranks: Rank[]): ReturnType<typeof newShoe> {
  return ranks.reduce((current, rank) => dealSeen(current, rank), shoe);
}

describe('composition', () => {
  it('C1 computes fresh 8-deck rank and group probabilities', () => {
    const shoe = newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 });
    const probabilities = nextCardProbabilities(shoe);
    expectClose(probabilities.T, 128 / 416);
    expectClose(probabilities.A, 32 / 416);
    expectClose(probabilities['5'], 32 / 416);
    const groups = groupProbabilities(shoe);
    expectClose(groups.ace, 32 / 416);
    expectClose(groups.ten, 128 / 416);
    expectClose(groups.small, 160 / 416);
    expectClose(groups.neutral, 96 / 416);
    expectClose(probabilitySum(probabilities), 1);
  });

  it('C2 treats burned cards as unknown', () => {
    const probabilities = nextCardProbabilities(newShoe({ decks: 1, burnCards: 1, cutPenetration: 0.75 }));
    expectClose(probabilities.A, 4 / 52);
    expectClose(probabilities.T, 16 / 52);
  });

  it('C3 removes dealt aces from unseen composition', () => {
    const shoe = deal(newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 }), ['A', 'A', 'A', 'A']);
    const probabilities = nextCardProbabilities(shoe);
    expectClose(probabilities.A, 0);
    expectClose(probabilities.T, 16 / 48);
  });

  it('C4 conditions the hole card on an ace upcard peek', () => {
    const shoe = deal(newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 }), ['A']);
    const noPeek = holeCardProbabilities(shoe, 'A', false);
    expectClose(noPeek.T, 128 / 415);
    expectClose(noPeek.A, 31 / 415);
    const peek = holeCardProbabilities(shoe, 'A', true);
    expectClose(peek.T, 0);
    expectClose(peek.A, 31 / 287);
    expectClose(peek['5'], 32 / 287);
    expectClose(probabilitySum(peek), 1);
  });

  it('C5 conditions the hole card on a ten upcard peek', () => {
    const shoe = deal(newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 }), ['T']);
    const peek = holeCardProbabilities(shoe, 'T', true);
    expectClose(peek.A, 0);
    expectClose(peek.T, 127 / 383);
    expectClose(peek['9'], 32 / 383);
    expectClose(probabilitySum(peek), 1);
    expectClose(holeCardProbabilities(shoe, 'T', false).A, 32 / 415);
  });

  it('C6 leaves probabilities unchanged for a non-blackjack upcard', () => {
    const shoe = deal(newShoe({ decks: 8, burnCards: 1, cutPenetration: 0.75 }), ['7']);
    const probabilities = holeCardProbabilities(shoe, '7', true);
    expectClose(probabilities.T, 128 / 415);
    expectClose(probabilities.A, 32 / 415);
  });

  it("C7 throws when no unseen cards remain", () => {
    const allRanks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];
    const ranks = allRanks.flatMap((rank) => Array.from({ length: rank === 'T' ? 16 : 4 }, () => rank));
    const shoe = deal(newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 }), ranks);
    expect(() => nextCardProbabilities(shoe)).toThrow('No quedan cartas sin ver');
  });
});
