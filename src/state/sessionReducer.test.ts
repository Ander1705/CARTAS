import { describe, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from '../core/rules';
import { createSession } from '../core/session';
import { initialSessionState, sessionReducer } from './sessionReducer';

describe('sessionReducer', () => {
  it('conserva la misma sesión cuando falla una acción', () => {
    const initial = initialSessionState(createSession(DEFAULT_RULES));
    const result = sessionReducer(initial, { type: 'card', rank: '5' });
    expect(result.error).toBe('No hay zapato en curso');
    expect(result.history.present).toBe(initial.history.present);
  });
  it('inicia, registra cartas y permite deshacer y rehacer', () => {
    let state = initialSessionState(createSession(DEFAULT_RULES));
    state = sessionReducer(state, { type: 'start', seat: 3 });
    expect(state.history.present.status).toBe('counting');
    expect(state.history.present.mySeat).toBe(3);
    state = sessionReducer(state, { type: 'card', rank: 'A' });
    expect(state.history.present.round?.hands[1]).toEqual([['A']]);
    state = sessionReducer(state, { type: 'undo' });
    expect(state.history.present.round?.hands[1]).toEqual([[]]);
    state = sessionReducer(state, { type: 'redo' });
    expect(state.history.present.round?.hands[1]).toEqual([['A']]);
  });
  it('rechaza dividir cuando no hay una pareja', () => {
    let state = initialSessionState(createSession(DEFAULT_RULES));
    state = sessionReducer(state, { type: 'start', seat: 3 });
    state = sessionReducer(state, { type: 'card', rank: 'A' });
    state = sessionReducer(state, { type: 'split' });
    expect(state.error).toBe('Solo se puede dividir una pareja de 2 cartas');
  });
  it('limpia el error tras una acción válida', () => {
    let state = initialSessionState(createSession(DEFAULT_RULES));
    state = sessionReducer(state, { type: 'card', rank: '5' });
    state = sessionReducer(state, { type: 'start', seat: 3 });
    expect(state.error).toBeNull();
  });
  it('termina el zapato y permite deshacerlo', () => {
    let state = initialSessionState(createSession(DEFAULT_RULES));
    state = sessionReducer(state, { type: 'start', seat: 3 });
    state = sessionReducer(state, { type: 'card', rank: '5' });
    state = sessionReducer(state, { type: 'endShoe' });
    expect(state.history.present.status).toBe('waiting');
    state = sessionReducer(state, { type: 'undo' });
    expect(state.history.present.status).toBe('counting');
  });
});
