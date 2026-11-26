import { describe, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { enterCard, nextHand } from './table';
import {
  applyRound, createSession, deserializeSession, finishRound, observe, serializeSession,
  setMySeat, setSeatActive, startShoe,
} from './session';

const rules1 = { ...DEFAULT_RULES, decks: 1, burnCards: 0, cutPenetration: 0.1 };
const card = (s: ReturnType<typeof createSession>, rank: 'T' | '6' | '7' | '5' | '9' | '4') =>
  applyRound(s, (round) => enterCard(round, rank));

describe('session', () => {
  it('S1 creates a validated waiting session', () => {
    const s = createSession(DEFAULT_RULES);
    expect(s).toMatchObject({ version: 1, status: 'waiting', round: null, mySeat: null, roundsPlayed: 0 });
    expect(Object.values(s.active)).toEqual([true, true, true, true, true, true, true]);
    expect(() => createSession({ ...DEFAULT_RULES, decks: 0 })).toThrow();
  });

  it('S2 starts a shoe', () => {
    const s = startShoe(createSession(DEFAULT_RULES), 3);
    expect(s).toMatchObject({ status: 'counting', mySeat: 3, round: { phase: 'initial', shoe: { seen: 0 }, target: { kind: 'seat', seat: 1, hand: 0 } } });
  });

  it('S3 changes seat', () => {
    const s = createSession(DEFAULT_RULES);
    expect(setMySeat(s, 5).mySeat).toBe(5);
    expect(() => setMySeat(s, 8 as 1)).toThrow('Puesto inválido');
    const started = startShoe(s, 3);
    expect(setMySeat(started, 6)).toMatchObject({ status: started.status, round: started.round, mySeat: 6 });
  });

  it('S4 checks round state', () => {
    expect(() => applyRound(createSession(DEFAULT_RULES), (round) => round)).toThrow('No hay zapato en curso');
    expect(() => finishRound(startShoe(createSession(DEFAULT_RULES), 1))).toThrow('La ronda no ha terminado');
  });

  it('S5 plays through the cut card round', () => {
    let s = createSession(rules1);
    for (let seat = 2; seat <= 7; seat += 1) s = setSeatActive(s, seat as 2, false);
    s = startShoe(s, 1);
    s = card(s, 'T'); s = card(s, '6'); s = card(s, '7');
    s = applyRound(s, nextHand); s = card(s, 'T'); s = card(s, '5');
    expect(s).toMatchObject({ status: 'counting', round: { phase: 'done', shoe: { seen: 5 } } });
    s = finishRound(s);
    expect(s).toMatchObject({ status: 'counting', roundsPlayed: 1, round: { phase: 'initial', shoe: { seen: 5 }, startShoe: { seen: 5 }, active: { 1: true, 2: false } } });
    s = card(s, '9'); expect(s.status).toBe('lastRound');
    s = card(s, '4'); s = card(s, '9'); s = applyRound(s, nextHand); s = card(s, 'T'); s = card(s, '4');
    expect(s.round?.phase).toBe('done');
    expect(finishRound(s)).toMatchObject({ status: 'waiting', round: null, roundsPlayed: 2 });
  });

  it('S6 changes an empty seat immediately and an occupied seat next round', () => {
    let s = startShoe(createSession(DEFAULT_RULES), 1);
    s = setSeatActive(s, 4, false);
    expect(s).toMatchObject({ active: { 4: false }, round: { active: { 4: false } } });
    s = card(s, 'T'); s = setSeatActive(s, 1, false);
    expect(s.active[1]).toBe(false);
    expect(s.round?.active[1]).toBe(true);
  });

  it('S7 observes until a new shoe starts', () => {
    const s = observe(startShoe(createSession(DEFAULT_RULES), 1));
    expect(s).toMatchObject({ status: 'observing', round: null });
    expect(() => applyRound(s, (round) => round)).toThrow('No hay zapato en curso');
    expect(startShoe(s, 1).status).toBe('counting');
  });

  it('S8 serializes and rejects invalid saved values', () => {
    let s = card(startShoe(createSession(DEFAULT_RULES), 3), 'T');
    expect(deserializeSession(serializeSession(s))).toEqual(s);
    expect(() => deserializeSession('no json')).toThrow('Datos guardados inválidos');
    expect(() => deserializeSession(JSON.stringify({ ...s, version: 2 }))).toThrow('Datos guardados inválidos');
    expect(() => deserializeSession('{"version":1,"status":"x"}')).toThrow('Datos guardados inválidos');
  });
});
