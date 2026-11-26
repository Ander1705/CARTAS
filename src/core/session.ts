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
  /** Rondas seguidas sin apostar; vuelve a 0 al apostar o al iniciar zapato. */
  noBetStreak: number;
  /** Totales de la sesión de juego en curso (abarca varios zapatos). */
  sessionStart: number | null;
  wagered: number;
  betRounds: number;
  /** Cartas vistas cuando salió la carta de corte real (para estimar los mazos). */
  cutAtCards: number | null;
}

export interface SessionRecord {
  start: number;
  end: number;
  rounds: number;
  wagered: number;
  startBankroll: number;
  endBankroll: number;
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
    ...EMPTY_STATS,
  };
}

const EMPTY_STATS = { noBetStreak: 0, sessionStart: null, wagered: 0, betRounds: 0, cutAtCards: null };

function roundConfig(s: TableSession) {
  return { direction: s.direction, dealerHitsSoft17: s.rules.dealerHitsSoft17 };
}

export function startShoe(s: TableSession, mySeat: SeatNumber, now = Date.now()): TableSession {
  if (!SEATS.includes(mySeat)) throw new Error('Puesto inválido');
  const shoe = newShoe(shoeConfigFrom(s.rules));
  return {
    ...s, status: 'counting', mySeat, round: newRound(shoe, s.active, roundConfig(s)), roundsPlayed: 0,
    noBetStreak: 0, sessionStart: s.sessionStart ?? now,
  };
}

/** Salió la carta de corte real: última ronda y se anota cuántas cartas se habían visto. */
export function cutCard(s: TableSession): TableSession {
  if (s.status !== 'counting' || s.round === null) throw new Error('No hay zapato en curso');
  return { ...s, status: 'lastRound', cutAtCards: s.round.shoe.seen };
}

export function setRules(s: TableSession, rules: Rules): TableSession {
  if (s.status === 'counting' || s.status === 'lastRound') throw new Error('Cambia las reglas entre zapatos');
  return { ...s, rules: validateRules(rules) };
}

/** Resumen de la sesión al cerrarla; el capital inicial es el configurado al empezar. */
export function sessionRecord(s: TableSession, startBankroll: number, endBankroll: number, now = Date.now()): SessionRecord {
  if (s.sessionStart === null) throw new Error('No hay sesión abierta');
  if (!Number.isFinite(endBankroll) || endBankroll < 0) throw new Error('El capital final no es válido');
  return { start: s.sessionStart, end: now, rounds: s.betRounds, wagered: s.wagered, startBankroll, endBankroll };
}

export function closeSession(s: TableSession): TableSession {
  return { ...s, sessionStart: null, wagered: 0, betRounds: 0 };
}

export function observe(s: TableSession): TableSession {
  return { ...s, status: 'observing', round: null, roundsPlayed: 0 };
}

export function endShoe(s: TableSession): TableSession {
  return { ...s, status: 'waiting', round: null, roundsPlayed: 0 };
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

/** Cierra la ronda con lo que aposté en ella (0 = no aposté). */
export function finishRound(s: TableSession, bet = 0): TableSession {
  if (s.round === null || s.round.phase !== 'done') throw new Error('La ronda no ha terminado');
  if (!Number.isFinite(bet) || bet < 0) throw new Error('La apuesta no puede ser negativa');
  const roundsPlayed = s.roundsPlayed + 1;
  const stats = {
    roundsPlayed,
    noBetStreak: bet > 0 ? 0 : s.noBetStreak + 1,
    wagered: s.wagered + bet,
    betRounds: s.betRounds + (bet > 0 ? 1 : 0),
  };
  if (s.status === 'lastRound') return { ...s, ...stats, status: 'waiting', round: null };
  return { ...s, ...stats, round: newRound(s.round.shoe, s.active, roundConfig(s)) };
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
    // Partidas guardadas antes de la Fase 5 no traen los totales de apuestas.
    return { ...EMPTY_STATS, ...session } as TableSession;
  } catch {
    throw new Error('Datos guardados inválidos');
  }
}
