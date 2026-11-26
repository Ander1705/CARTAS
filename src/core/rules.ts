import { newShoe, type ShoeConfig } from './shoe';

export type Surrender = 'none' | 'late';
export type DoubleOn = 'any' | '9-11' | '10-11';

export interface Rules {
  decks: number;
  burnCards: number;
  cutPenetration: number;
  dealerHitsSoft17: boolean;
  blackjackPays: number;
  insurancePays: number;
  doubleAfterSplit: boolean;
  surrender: Surrender;
  dealerPeeks: boolean;
  maxSplitHands: number;
  resplitAces: boolean;
  hitSplitAces: boolean;
  doubleOn: DoubleOn;
}

export const DEFAULT_RULES: Readonly<Rules> = {
  decks: 8,
  burnCards: 1,
  cutPenetration: 0.75,
  dealerHitsSoft17: false,
  blackjackPays: 1.5,
  insurancePays: 2,
  doubleAfterSplit: true,
  surrender: 'none',
  dealerPeeks: true,
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
  doubleOn: 'any',
};

/** Rules not yet confirmed at the user's real table; UI must flag them as "por confirmar". */
export const UNCONFIRMED_RULES: readonly (keyof Rules)[] = [
  'decks',
  'burnCards',
  'doubleAfterSplit',
  'surrender',
  'dealerPeeks',
  'maxSplitHands',
  'resplitAces',
  'hitSplitAces',
  'doubleOn',
];

export function validateRules(rules: Rules): Rules {
  newShoe(shoeConfigFrom(rules));
  if (!Number.isFinite(rules.blackjackPays) || rules.blackjackPays <= 0) {
    throw new Error('El pago de blackjack debe ser mayor que 0');
  }
  if (!Number.isFinite(rules.insurancePays) || rules.insurancePays <= 0) {
    throw new Error('El pago del seguro debe ser mayor que 0');
  }
  if (!Number.isInteger(rules.maxSplitHands) || rules.maxSplitHands < 1 || rules.maxSplitHands > 8) {
    throw new Error('La cantidad máxima de manos divididas debe ser un entero entre 1 y 8');
  }
  if (rules.surrender !== 'none' && rules.surrender !== 'late') {
    throw new Error('La regla de rendición no es válida');
  }
  if (rules.doubleOn !== 'any' && rules.doubleOn !== '9-11' && rules.doubleOn !== '10-11') {
    throw new Error('La regla de doblar no es válida');
  }
  return { ...rules };
}

export function shoeConfigFrom(rules: Rules): ShoeConfig {
  return {
    decks: rules.decks,
    burnCards: rules.burnCards,
    cutPenetration: rules.cutPenetration,
  };
}
