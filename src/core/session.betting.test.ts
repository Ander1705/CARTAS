import { describe, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { enterCard, nextHand } from './table';
import {
  applyRound, closeSession, createSession, cutCard, deserializeSession, finishRound,
  sessionRecord, setRules, setSeatActive, startShoe, type TableSession,
} from './session';

// Ronda mínima: solo el puesto 1 (T+7 = 17) y el crupier 6+T+5 = 21.
function playRound(s: TableSession): TableSession {
  const c = (x: TableSession, r: 'T' | '6' | '7' | '5') => applyRound(x, (round) => enterCard(round, r));
  s = c(s, 'T'); s = c(s, '6'); s = c(s, '7');
  s = applyRound(s, nextHand); s = c(s, 'T'); s = c(s, '5');
  return s;
}

function solo(): TableSession {
  let s = createSession(DEFAULT_RULES);
  for (let seat = 2; seat <= 7; seat += 1) s = setSeatActive(s, seat as 2, false);
  return startShoe(s, 1, 1000);
}

describe('manos sin apostar y totales de sesión', () => {
  it('sube sin apostar, vuelve a 0 al apostar y suma lo apostado', () => {
    let s = solo();
    s = finishRound(playRound(s), 0);
    s = finishRound(playRound(s), 0);
    expect(s).toMatchObject({ noBetStreak: 2, wagered: 0, betRounds: 0, roundsPlayed: 2 });
    s = finishRound(playRound(s), 25000);
    expect(s).toMatchObject({ noBetStreak: 0, wagered: 25000, betRounds: 1, roundsPlayed: 3 });
  });

  it('rechaza apuestas negativas', () => {
    expect(() => finishRound(playRound(solo()), -1)).toThrow('La apuesta no puede ser negativa');
  });

  it('iniciar zapato reinicia el contador pero conserva la sesión', () => {
    let s = finishRound(playRound(solo()), 0);
    s = finishRound(playRound(s), 10000);
    s = finishRound(playRound(s), 0);
    expect(s.noBetStreak).toBe(1);
    s = startShoe(s, 1, 5000);
    expect(s).toMatchObject({ noBetStreak: 0, sessionStart: 1000, wagered: 10000 });
  });

  it('cerrar sesión genera el resumen y reinicia los totales', () => {
    const s = finishRound(playRound(solo()), 20000);
    expect(sessionRecord(s, 1_000_000, 1_020_000, 9000)).toEqual({
      start: 1000, end: 9000, rounds: 1, wagered: 20000, startBankroll: 1_000_000, endBankroll: 1_020_000,
    });
    expect(() => sessionRecord(s, 1, -5)).toThrow();
    const closed = closeSession(s);
    expect(closed).toMatchObject({ sessionStart: null, wagered: 0, betRounds: 0 });
    expect(() => sessionRecord(closed, 1, 1)).toThrow('No hay sesión abierta');
    expect(startShoe(closed, 2, 7000).sessionStart).toBe(7000);
  });
});

describe('carta de corte y reglas', () => {
  it('salió el corte: última ronda y anota las cartas vistas', () => {
    const s = cutCard(applyRound(solo(), (r) => enterCard(r, 'T')));
    expect(s).toMatchObject({ status: 'lastRound', cutAtCards: 1 });
    expect(() => cutCard(s)).toThrow();
  });

  it('las reglas solo cambian entre zapatos', () => {
    expect(() => setRules(solo(), DEFAULT_RULES)).toThrow('Cambia las reglas entre zapatos');
    expect(setRules(createSession(DEFAULT_RULES), { ...DEFAULT_RULES, decks: 6 }).rules.decks).toBe(6);
    expect(() => setRules(createSession(DEFAULT_RULES), { ...DEFAULT_RULES, decks: 0 })).toThrow();
  });
});

it('carga partidas guardadas antes de la Fase 5', () => {
  const { noBetStreak, sessionStart, wagered, betRounds, cutAtCards, ...old } = createSession(DEFAULT_RULES);
  void [noBetStreak, sessionStart, wagered, betRounds, cutAtCards];
  expect(deserializeSession(JSON.stringify(old))).toMatchObject({ noBetStreak: 0, wagered: 0, sessionStart: null });
});
