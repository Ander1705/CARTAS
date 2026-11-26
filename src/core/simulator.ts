import { CARDS_PER_DECK, type Rank } from './cards';
import type { Rules } from './rules';
import { lookupAction, type StrategyTable } from './strategy';

const value: Readonly<Record<Rank, number>> = { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };

function handValue(cards: readonly Rank[]): { total: number; soft: boolean } {
  const hard = cards.reduce((sum, rank) => sum + value[rank], 0);
  const soft = cards.includes('A') && hard + 10 <= 21;
  return { total: soft ? hard + 10 : hard, soft };
}

export function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RoundResult { net: number; wagered: number; }

export function playRound(draw: () => Rank, rules: Rules, table: StrategyTable): RoundResult {
  const p1 = draw(); const up = draw(); const p2 = draw(); const hole = draw();
  const dealerCards: Rank[] = [up, hole];
  const dealerValue = handValue(dealerCards).total;
  const dealerBJ = dealerValue === 21;
  const playerBJ = handValue([p1, p2]).total === 21;
  if (rules.dealerPeeks && (up === 'A' || up === 'T') && dealerBJ) return { net: playerBJ ? 0 : -1, wagered: 1 };
  if (playerBJ) return { net: dealerBJ ? 0 : rules.blackjackPays, wagered: 1 };

  interface PlayerHand { cards: Rank[]; bet: number; fromSplit: boolean; surrendered: boolean; bust: boolean; stood: boolean; }
  const hands: PlayerHand[] = [{ cards: [p1, p2], bet: 1, fromSplit: false, surrendered: false, bust: false, stood: false }];
  let handsCount = 1;
  for (let index = 0; index < hands.length; index++) {
    const hand = hands[index];
    if (hand.fromSplit && hand.cards.length === 1) hand.cards.push(draw());
    while (true) {
      const { total, soft } = handValue(hand.cards);
      if (total > 21) { hand.bust = true; break; }
      if (total === 21) { hand.stood = true; break; }
      const lockedAces = hand.fromSplit && hand.cards[0] === 'A' && !rules.hitSplitAces;
      const hard = hand.cards.reduce((sum, rank) => sum + value[rank], 0);
      const doubleTotalAllowed = rules.doubleOn === 'any'
        || (!soft && (rules.doubleOn === '9-11' ? hard >= 9 && hard <= 11 : hard >= 10 && hard <= 11));
      const can = {
        hit: !lockedAces,
        double: hand.cards.length === 2 && (!hand.fromSplit || rules.doubleAfterSplit) && !lockedAces && doubleTotalAllowed,
        split: hand.cards.length === 2 && hand.cards[0] === hand.cards[1] && handsCount < rules.maxSplitHands && (!hand.fromSplit || hand.cards[0] !== 'A' || rules.resplitAces),
        surrender: rules.surrender === 'late' && !hand.fromSplit && handsCount === 1 && hand.cards.length === 2,
      };
      const action = lookupAction(hand.cards, up, table, can);
      if (action === 'H') { hand.cards.push(draw()); continue; }
      if (action === 'S') { hand.stood = true; break; }
      if (action === 'D') { hand.bet *= 2; hand.cards.push(draw()); hand.stood = true; break; }
      if (action === 'R') { hand.surrendered = true; break; }
      handsCount++;
      hands.splice(index, 1,
        { cards: [hand.cards[0]], bet: hand.bet, fromSplit: true, surrendered: false, bust: false, stood: false },
        { cards: [hand.cards[1]], bet: hand.bet, fromSplit: true, surrendered: false, bust: false, stood: false });
      index--;
      break;
    }
  }

  if (hands.some((hand) => !hand.bust && !hand.surrendered)) {
    while (true) {
      const { total, soft } = handValue(dealerCards);
      if (total > 17 || (total === 17 && !(soft && rules.dealerHitsSoft17))) break;
      dealerCards.push(draw());
    }
  }
  const finalDealer = handValue(dealerCards).total;
  const dealerBust = finalDealer > 21;
  const net = hands.reduce((sum, hand) => {
    if (hand.surrendered) return sum + (dealerBJ && !rules.dealerPeeks ? -hand.bet : -0.5 * hand.bet);
    if (hand.bust || (dealerBJ && !rules.dealerPeeks)) return sum - hand.bet;
    if (dealerBust) return sum + hand.bet;
    const playerTotal = handValue(hand.cards).total;
    return sum + (playerTotal > finalDealer ? hand.bet : playerTotal === finalDealer ? 0 : -hand.bet);
  }, 0);
  return { net, wagered: hands.reduce((sum, hand) => sum + hand.bet, 0) };
}

export interface SimResult { rounds: number; net: number; wagered: number; houseEdge: number; stdError: number; }

export function simulate(rules: Rules, table: StrategyTable, rounds: number, seed: number): SimResult {
  const rng = mulberry32(seed);
  const total = rules.decks * 52;
  const shoe: Rank[] = [];
  for (let deck = 0; deck < rules.decks; deck++) for (const rank of Object.keys(CARDS_PER_DECK) as Rank[]) {
    for (let count = 0; count < CARDS_PER_DECK[rank]; count++) shoe.push(rank);
  }
  const shuffle = () => {
    for (let i = shoe.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }
  };
  shuffle();
  let position = Math.min(rules.burnCards, shoe.length);
  const draw = (): Rank => shoe[position++];
  let net = 0; let wagered = 0; let squaredNet = 0;
  for (let round = 0; round < rounds; round++) {
    if (position >= rules.cutPenetration * total) { shuffle(); position = Math.min(rules.burnCards, shoe.length); }
    const result = playRound(draw, rules, table);
    net += result.net; wagered += result.wagered; squaredNet += result.net * result.net;
  }
  const mean = net / rounds;
  return { rounds, net, wagered, houseEdge: -mean, stdError: Math.sqrt((squaredNet / rounds - mean * mean) / rounds) };
}
