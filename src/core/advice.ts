import type { Rank } from './cards';
import { playerEVs, type PlayerEVs } from './ev';
import { findCountDeviation, shouldTakeInsurance, type CountDeviation, type PlayAction } from './deviations';
import { tcForIndex, trueCount } from './hilo';
import type { TableSession } from './session';
import { strategyForRules } from './precomputedStrategy';
import { availability, lookupAction, type Availability } from './strategy';
import { decisionShoe, type SeatNumber } from './table';
import type { ShoeState } from './shoe';

export interface TurnInfo {
  myTurn: boolean;
  turnSeat: SeatNumber | null;
  hand: Rank[] | null;
  upcard: Rank | null;
  splitHands: number;
  shoe: ShoeState | null;
  tcIndex: number | null;
}

export function turnInfo(s: TableSession): TurnInfo {
  const round = s.round;
  const target = round?.phase === 'players' ? round.target : null;
  const turnSeat = target?.kind === 'seat' ? target.seat : null;
  const cards = turnSeat === null || !target || target.kind !== 'seat'
    ? null : round?.hands[target.seat][target.hand] ?? null;
  const myTurn = turnSeat === s.mySeat && cards !== null && cards.length >= 2;
  const shoe = round && s.mySeat !== null ? decisionShoe(round, s.mySeat) : null;
  const tcIndex = shoe ? tcForIndex(trueCount(shoe)) : null;
  return {
    myTurn,
    turnSeat,
    hand: myTurn ? cards : null,
    upcard: myTurn && round?.dealer.length ? round.dealer[0] : null,
    splitHands: s.mySeat !== null ? round?.hands[s.mySeat].length || 1 : 1,
    shoe,
    tcIndex,
  };
}

export interface QuickAdvice {
  tableAction: PlayAction | null;
  countDeviation: CountDeviation | null;
  insurance: boolean | null;
  available: Availability;
}

export function quickAdvice(s: TableSession, info: TurnInfo): QuickAdvice | null {
  if (!info.myTurn || !info.hand || !info.upcard || info.tcIndex === null) return null;
  const available = availability(info.hand, s.rules, info.splitHands);
  const table = strategyForRules(s.rules);
  return {
    available,
    tableAction: table ? lookupAction(info.hand, info.upcard, table, available) : null,
    countDeviation: findCountDeviation(info.hand, info.upcard, info.tcIndex, s.rules),
    insurance: info.upcard === 'A' && info.hand.length === 2 && info.splitHands === 1
      ? shouldTakeInsurance(info.tcIndex) : null,
  };
}

export interface FullAdvice {
  evs: PlayerEVs;
  bestAction: PlayAction;
  tableAction: PlayAction | null;
  compositionDeviation: boolean | null;
}

export function fullAdvice(s: TableSession, info: TurnInfo): FullAdvice | null {
  if (!info.myTurn || !info.hand || !info.upcard || !info.shoe) return null;
  const evs = playerEVs(info.shoe, info.hand, info.upcard, s.rules, info.splitHands);
  const values: [PlayAction, number | null][] = [
    ['S', evs.stand], ['H', evs.hit], ['D', evs.double],
    ['P', evs.split], ['R', evs.surrender],
  ];
  let best: [PlayAction, number | null] = values[0];
  for (const candidate of values.slice(1)) {
    if (candidate[1] !== null && candidate[1] > best[1]!) best = candidate;
  }
  const table = strategyForRules(s.rules);
  const can = {
    hit: evs.hit !== null,
    double: evs.double !== null,
    split: evs.split !== null,
    surrender: evs.surrender !== null,
  };
  const tableAction = table ? lookupAction(info.hand, info.upcard, table, can) : null;
  return {
    evs,
    bestAction: best[0],
    tableAction,
    compositionDeviation: tableAction === null ? null : best[0] !== tableAction,
  };
}
