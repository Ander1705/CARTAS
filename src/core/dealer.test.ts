import { describe, expect, it } from '@jest/globals';
import { RANKS, type Rank } from './cards';
import { dealerDistribution } from './dealer';
import { dealSeen, newShoe, type ShoeState } from './shoe';

const options = (hitSoft17 = false, peekedNoBlackjack = false) => ({ hitSoft17, peekedNoBlackjack });
function smallShoe(leave: Partial<Record<Rank, number>>, upcard: Rank): ShoeState {
  let shoe = newShoe({ decks: 1, burnCards: 0, cutPenetration: 1 });
  const keep = { ...leave, [upcard]: leave[upcard] ?? 0 };
  for (const rank of RANKS) {
    const remaining = keep[rank] ?? 0;
    const toDeal = shoe.unseen[rank] - remaining - (rank === upcard ? 1 : 0);
    for (let i = 0; i < toDeal; i++) shoe = dealSeen(shoe, rank);
  }
  return dealSeen(shoe, upcard);
}
function expectOutcomes(actual: ReturnType<typeof dealerDistribution>, expected: Partial<Record<keyof typeof actual, number>>) {
  for (const [outcome, value] of Object.entries(expected)) expect(actual[outcome as keyof typeof actual]).toBeCloseTo(value, 12);
}
function fullShoe(upcard: Rank): ShoeState {
  return dealSeen(newShoe({ decks: 8, burnCards: 1, cutPenetration: 1 }), upcard);
}

describe('dealerDistribution', () => {
  it('D1: draws without replacement from a small composition', () => expectOutcomes(dealerDistribution(smallShoe({ T: 2, '5': 1 }, '6'), '6', options()), { '21': 2 / 3, bust: 1 / 3 }));
  it('D2: stands on soft 17 under S17', () => expectOutcomes(dealerDistribution(smallShoe({ '6': 4 }, 'A'), 'A', options()), { '17': 1 }));
  it('D2: hits soft 17 under H17', () => expectOutcomes(dealerDistribution(smallShoe({ '6': 4 }, 'A'), 'A', options(true)), { '19': 1 }));
  it('D3: handles ten upcard blackjack and peek', () => {
    expectOutcomes(dealerDistribution(smallShoe({ A: 2, '9': 2 }, 'T'), 'T', options()), { blackjack: 0.5, '19': 0.5 });
    expectOutcomes(dealerDistribution(smallShoe({ A: 2, '9': 2 }, 'T'), 'T', options(false, true)), { '19': 1 });
  });
  it('D4: handles ace upcard blackjack and peek', () => {
    expectOutcomes(dealerDistribution(smallShoe({ T: 2, '7': 2 }, 'A'), 'A', options()), { blackjack: 0.5, '18': 0.5 });
    expectOutcomes(dealerDistribution(smallShoe({ T: 2, '7': 2 }, 'A'), 'A', options(false, true)), { '18': 1 });
  });
  it('D5: busts with three tens after a six', () => expectOutcomes(dealerDistribution(smallShoe({ T: 3 }, '6'), '6', options()), { bust: 1 }));
  it('D6: full shoe, six upcard S17', () => expectOutcomes(dealerDistribution(fullShoe('6'), '6', options()), { '17': 0.165640083326624, '18': 0.106208477996629, '19': 0.106390434931837, '20': 0.10159211062189, '21': 0.0972472731499421, bust: 0.422921619973078 }));
  it('D7: full shoe, two upcard S17', () => expectOutcomes(dealerDistribution(fullShoe('2'), '2', options()), { '17': 0.139694112412388, '18': 0.134518345221328, '19': 0.129928733241317, '20': 0.124020994047764, '21': 0.118307829035813, bust: 0.353529986041391 }));
  it('D8: full shoe, ten upcard peek', () => expectOutcomes(dealerDistribution(fullShoe('T'), 'T', options(false, true)), { '17': 0.121131507697144, '18': 0.120932629373181, '19': 0.121155995686477, '20': 0.369014384324823, '21': 0.0376403222992647, bust: 0.230125160619109 }));
  it('D9: full shoe, ace upcard peek', () => expectOutcomes(dealerDistribution(fullShoe('A'), 'A', options(false, true)), { '17': 0.188282553401675, '18': 0.189155103892163, '19': 0.188909534806423, '20': 0.189250530195687, '21': 0.0774977999194826, bust: 0.166904477784569 }));
  it('D10: full shoe, ace upcard without peek', () => expectOutcomes(dealerDistribution(fullShoe('A'), 'A', options()), { blackjack: 0.308433734939759, '17': 0.130209862232002, bust: 0.115425506323305 }));
  it('D11: full shoe, ace upcard H17 peek', () => expectOutcomes(dealerDistribution(fullShoe('A'), 'A', options(true, true)), { '17': 0.0828935266254188, '18': 0.206657160603448, bust: 0.201125005548908 }));
  it('D12: full shoe, six upcard H17', () => expectOutcomes(dealerDistribution(fullShoe('6'), '6', options(true)), { '17': 0.115007933773761, bust: 0.439313740855805 }));
  it('D13: distributions sum to one for all upcards and peek settings', () => {
    for (const upcard of RANKS) for (const peekedNoBlackjack of [false, true]) {
      const distribution = dealerDistribution(fullShoe(upcard), upcard, options(false, peekedNoBlackjack));
      expect(Object.values(distribution).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
      expect(Object.values(distribution).every((value) => value >= 0)).toBe(true);
    }
  });
  it('D14: computes all upcards in under two seconds', () => {
    const start = Date.now();
    for (const upcard of RANKS) dealerDistribution(fullShoe(upcard), upcard, options());
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
