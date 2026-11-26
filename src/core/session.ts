import { pastCut, newShoe } from './shoe';
import { shoeConfigFrom, validateRules, type Rules } from './rules';
import { newRound, toggleSeat, SEATS, type RoundState, type SeatNumber, type DealDirection } from './table';

export type ShoeStatus = 'waiting' | 'counting' | 'lastRound' | 'observing';

export interface TableSession {
  version: 1;
  status: ShoeStatus;
  rules: Rules;
  direction: DealDirection;
  mySeat: SeatNumber | null;
  active: Record<SeatNumber, boolean>;
  round: RoundState | null;
  roundsPlayed: number;
}

export function createSession(rules: Rules, direction: DealDirection = 'rightToLeft'): TableSession {
  return {
    version: 1,
    status: 'waiting',
    rules: validateRules(rules),
    direction,
    mySeat: null,
    active: Object.fromEntries(SEATS.map((seat) => [seat, true])) as Record<SeatNumber, boolean>,
    round: null,
    roundsPlayed: 0,
  };
}

function roundConfig(s: TableSession) {
  return { direction: s.direction, dealerHitsSoft17: s.rules.dealerHitsSoft17 };
}

export function startShoe(s: TableSession, mySeat: SeatNumber): TableSession {
  if (!SEATS.includes(mySeat)) throw new Error('Puesto inválido');
  const shoe = newShoe(shoeConfigFrom(s.rules));
  return { ...s, status: 'counting', mySeat, round: newRound(shoe, s.active, roundConfig(s)), roundsPlayed: 0 };
}

export function observe(s: TableSession): TableSession {
  return { ...s, status: 'observing', round: null, roundsPlayed: 0 };
}

export function setMySeat(s: TableSession, seat: SeatNumber): TableSession {
  if (!SEATS.includes(seat)) throw new Error('Puesto inválido');
  return { ...s, mySeat: seat };
}

export function setSeatActive(s: TableSession, seat: SeatNumber, active: boolean): TableSession {
  if (!SEATS.includes(seat)) throw new Error('Puesto inválido');
  let round = s.round;
  if (round?.phase === 'initial' && !round.hands[seat].some((hand) => hand.length > 0) && round.active[seat] !== active) {
    round = toggleSeat(round, seat);
  }
  return { ...s, active: { ...s.active, [seat]: active }, round };
}

export function applyRound(s: TableSession, fn: (round: RoundState) => RoundState): TableSession {
  if ((s.status !== 'counting' && s.status !== 'lastRound') || s.round === null) {
    throw new Error('No hay zapato en curso');
  }
  const round = fn(s.round);
  return { ...s, round, status: s.status === 'counting' && pastCut(round.shoe) ? 'lastRound' : s.status };
}

export function finishRound(s: TableSession): TableSession {
  if (s.round === null || s.round.phase !== 'done') throw new Error('La ronda no ha terminado');
  const roundsPlayed = s.roundsPlayed + 1;
  if (s.status === 'lastRound') return { ...s, status: 'waiting', round: null, roundsPlayed };
  return { ...s, round: newRound(s.round.shoe, s.active, roundConfig(s)), roundsPlayed };
}

export function serializeSession(s: TableSession): string {
  return JSON.stringify(s);
}

export function deserializeSession(text: string): TableSession {
  try {
    const value: unknown = JSON.parse(text);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error();
    const session = value as Partial<TableSession>;
    if (session.version !== 1 || !['waiting', 'counting', 'lastRound', 'observing'].includes(session.status ?? '') || !('rules' in session) || !('active' in session)) throw new Error();
    return session as TableSession;
  } catch {
    throw new Error('Datos guardados inválidos');
  }
}
