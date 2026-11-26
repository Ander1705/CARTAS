import { createHistory, record, redo, undo, type History } from '../core/history';
import { parseRank, type Rank } from '../core/cards';
import { enterCard, nextHand, removeCard, setTarget, splitHand, type SeatNumber, type Target } from '../core/table';
import type { Rules } from '../core/rules';
import { applyRound, closeSession, cutCard, endShoe, finishRound, observe, setMySeat, setRules, setSeatActive, startShoe, type TableSession } from '../core/session';

export type SessionAction =
  | { type: 'start'; seat: SeatNumber } | { type: 'observe' } | { type: 'mySeat'; seat: SeatNumber }
  | { type: 'toggleSeat'; seat: SeatNumber } | { type: 'target'; target: Target }
  | { type: 'card'; rank: Rank } | { type: 'next' } | { type: 'split' }
  | { type: 'removeCard'; target: Target; index: number } | { type: 'finishRound'; bet: number }
  | { type: 'cutCard' } | { type: 'rules'; rules: Rules } | { type: 'closeSession' }
  | { type: 'endShoe' }
  | { type: 'undo' } | { type: 'redo' };
export interface SessionState { history: History<TableSession>; error: string | null; }
export function initialSessionState(session: TableSession): SessionState { return { history: createHistory(session), error: null }; }

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'undo') return { ...state, history: undo(state.history), error: null };
  if (action.type === 'redo') return { ...state, history: redo(state.history), error: null };
  try {
    const s = state.history.present;
    let next: TableSession;
    switch (action.type) {
      case 'start': next = startShoe(s, action.seat); break;
      case 'observe': next = observe(s); break;
      case 'mySeat': next = setMySeat(s, action.seat); break;
      case 'toggleSeat': next = setSeatActive(s, action.seat, !s.active[action.seat]); break;
      case 'target': next = applyRound(s, (r) => setTarget(r, action.target)); break;
      case 'card': next = applyRound(s, (r) => enterCard(r, parseRank(action.rank))); break;
      case 'next': next = applyRound(s, nextHand); break;
      case 'split': {
        const t = s.round?.target;
        if (t?.kind !== 'seat') throw new Error('Toca primero la mano que quieres dividir');
        next = applyRound(s, (r) => splitHand(r, t.seat, t.hand)); break;
      }
      case 'removeCard': next = applyRound(s, (r) => removeCard(r, action.target, action.index)); break;
      case 'finishRound': next = finishRound(s, action.bet); break;
      case 'cutCard': next = cutCard(s); break;
      case 'rules': next = setRules(s, action.rules); break;
      case 'closeSession': next = closeSession(s); break;
      case 'endShoe': next = endShoe(s); break;
    }
    return { history: record(state.history, next), error: null };
  } catch (e) {
    return { ...state, error: e instanceof Error ? e.message : String(e) };
  }
}
