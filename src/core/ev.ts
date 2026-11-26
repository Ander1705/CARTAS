import { RANKS, type Rank } from './cards';
import { dealerDistribution, type DealerDistribution } from './dealer';
import type { Rules } from './rules';
import type { ShoeState } from './shoe';

export interface PlayerEVs { stand: number; hit: number; double: number | null; surrender: number | null; }

const VALUE: Readonly<Record<Rank, number>> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };
const bestTotal = (hard: number, hasAce: boolean): number => hasAce && hard + 10 <= 21 ? hard + 10 : hard;

export function playerEVs(shoe: ShoeState, hand: readonly Rank[], upcard: Rank, rules: Rules): PlayerEVs {
  if (hand.length < 2) throw new Error('La mano necesita al menos 2 cartas');
  let hard = 0;
  let hasAce = false;
  for (const rank of hand) { hard += VALUE[rank]; hasAce ||= rank === 'A'; }
  const total = bestTotal(hard, hasAce);
  if (hand.length === 2 && total === 21) throw new Error('La mano es blackjack: se paga sin decidir');
  if (total > 21) throw new Error('La mano ya se pasó');

  const counts = RANKS.map((rank) => shoe.unseen[rank]);
  const countTotal = (): number => counts.reduce((sum, count) => sum + count, 0);
  const forbidden = rules.dealerPeeks && upcard === 'A' ? 'T' : rules.dealerPeeks && upcard === 'T' ? 'A' : undefined;
  const recordCounts = (): Record<Rank, number> => Object.fromEntries(RANKS.map((rank, i) => [rank, counts[i]])) as Record<Rank, number>;
  const dealer = (): DealerDistribution => dealerDistribution({ ...shoe, unseen: recordCounts() }, upcard, { hitSoft17: rules.dealerHitsSoft17, peekedNoBlackjack: forbidden !== undefined });
  const probabilities = (): number[] => {
    const n = countTotal();
    if (forbidden === undefined) return counts.map((count) => count / n);
    const f = RANKS.indexOf(forbidden);
    const m = n - counts[f];
    return counts.map((count, i) => count * (m - (RANKS[i] !== forbidden ? 1 : 0)) / (m * (n - 1)));
  };
  const standEV = (playerTotal: number, d: DealerDistribution): number => {
    if (playerTotal > 21) return -1;
    let ev = d.bust - d.blackjack;
    for (let t = 17; t <= 21; t++) ev += d[String(t) as keyof DealerDistribution] * Math.sign(playerTotal - t);
    return ev;
  };
  const dRoot = dealer();
  const stand = standEV(total, dRoot);
  const memo = new Map<string, number>();
  const hitValue = (playerHard: number, playerAce: boolean): number => {
    const key = `${counts.join(',')}|${playerHard}|${playerAce ? 1 : 0}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    const ps = probabilities();
    let value = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] === 0 || ps[i] === 0) continue;
      counts[i]--;
      const nextHard = playerHard + VALUE[RANKS[i]];
      const nextAce = playerAce || RANKS[i] === 'A';
      const nextTotal = bestTotal(nextHard, nextAce);
      const child = nextTotal > 21 ? -1 : Math.max(standEV(nextTotal, dealer()), hitValue(nextHard, nextAce));
      counts[i]++;
      value += ps[i] * child;
    }
    memo.set(key, value);
    return value;
  };
  const hit = hitValue(hard, hasAce);

  let canDouble = hand.length === 2;
  if (rules.doubleOn !== 'any') canDouble &&= !hasAce && (rules.doubleOn === '9-11' ? hard >= 9 && hard <= 11 : hard >= 10 && hard <= 11);
  let double: number | null = null;
  if (canDouble) {
    const ps = probabilities();
    let value = 0;
    for (let i = 0; i < counts.length; i++) {
      if (counts[i] === 0 || ps[i] === 0) continue;
      counts[i]--;
      value += ps[i] * standEV(bestTotal(hard + VALUE[RANKS[i]], hasAce || RANKS[i] === 'A'), dealer());
      counts[i]++;
    }
    double = 2 * value;
  }
  const surrender = rules.surrender === 'late' && hand.length === 2 ? -0.5 * (1 - dRoot.blackjack) - dRoot.blackjack : null;
  return { stand, hit, double, surrender };
}
