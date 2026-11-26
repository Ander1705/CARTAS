import { tcForIndex } from './hilo';

export type BetMethod = 'ramp' | 'kelly';
export type Light = 'gray' | 'yellow' | 'green';

export interface BetConfig {
  bankroll: number;
  minBet: number;
  maxBet: number;
  maxNoBetHands: number;
  yellowAt: number;
  greenAt: number;
  negativeAt: number;
  /** Unidades (múltiplos de la apuesta mínima) para conteo real ≤+1, +2, +3, +4 y +5 o más. */
  ramp: number[];
  method: BetMethod;
  kellyFraction: number;
  /** Ventaja de la casa con conteo 0, en fracción (negativa = a favor de la casa). Aproximación. */
  baseEdge: number;
  /** Ventaja que gana el jugador por cada punto de conteo real. Aproximación. */
  edgePerTC: number;
  /** Varianza por mano en unidades de apuesta al cuadrado (blackjack ≈ 1,33). */
  variance: number;
  handsPerHour: number;
}

export const DEFAULT_BET_CONFIG: Readonly<BetConfig> = {
  bankroll: 1_000_000,
  minBet: 5_000,
  maxBet: 500_000,
  maxNoBetHands: 3,
  yellowAt: 2,
  greenAt: 3,
  negativeAt: -2,
  ramp: [1, 2, 4, 6, 8],
  method: 'ramp',
  kellyFraction: 0.25,
  // Simulación de 1 millón de rondas con las reglas de la mesa del usuario: 0,338 % para la casa.
  baseEdge: -0.0034,
  edgePerTC: 0.005,
  variance: 1.33,
  handsPerHour: 60,
};

export function validateBetConfig(c: BetConfig): BetConfig {
  const positive = (v: number) => Number.isFinite(v) && v > 0;
  if (!Number.isFinite(c.bankroll) || c.bankroll < 0) throw new Error('El capital no puede ser negativo');
  if (!positive(c.minBet)) throw new Error('La apuesta mínima debe ser mayor que 0');
  if (!positive(c.maxBet) || c.maxBet < c.minBet) throw new Error('La apuesta máxima debe ser mayor o igual a la mínima');
  if (!Number.isInteger(c.maxNoBetHands) || c.maxNoBetHands < 1) throw new Error('El máximo de manos sin apostar debe ser un entero de 1 o más');
  if (!(c.negativeAt < c.yellowAt && c.yellowAt <= c.greenAt)) throw new Error('Los umbrales deben cumplir negativo < amarillo ≤ verde');
  if (c.ramp.length === 0 || c.ramp.some((u) => !positive(u))) throw new Error('Cada escalón de la rampa debe ser mayor que 0');
  if (!(c.kellyFraction > 0 && c.kellyFraction <= 1)) throw new Error('La fracción de Kelly debe estar entre 0 y 1');
  if (!positive(c.variance) || !positive(c.handsPerHour)) throw new Error('Varianza y manos por hora deben ser mayores que 0');
  return { ...c, ramp: [...c.ramp] };
}

/** Ventaja estimada del jugador (aproximación lineal, no garantía). */
export function estimatedEdge(tc: number, c: BetConfig): number {
  return c.baseEdge + c.edgePerTC * tc;
}

export function light(tc: number, c: BetConfig): { light: Light; negative: boolean } {
  const t = tcForIndex(tc);
  return {
    light: t >= c.greenAt ? 'green' : t >= c.yellowAt ? 'yellow' : 'gray',
    negative: t <= c.negativeAt,
  };
}

/** Apuesta sugerida en COP, limitada por capital y máximo de la mesa; 0 si el capital no alcanza la mínima. */
export function suggestedBet(tc: number, c: BetConfig): number {
  const cap = Math.min(c.maxBet, c.bankroll);
  if (cap < c.minBet) return 0;
  const t = tcForIndex(tc);
  let raw: number;
  if (t <= c.negativeAt) raw = c.minBet;
  else if (c.method === 'ramp') raw = c.minBet * c.ramp[Math.max(0, Math.min(c.ramp.length - 1, t - 1))];
  else {
    const edge = estimatedEdge(tc, c);
    raw = edge > 0 ? (c.kellyFraction * edge * c.bankroll) / c.variance : c.minBet;
  }
  // Fichas de 1.000 COP: se redondea hacia abajo para no pasar el límite.
  const bet = Math.floor(Math.min(raw, cap) / 1000) * 1000;
  return Math.max(c.minBet, bet);
}

/** Ganancia esperada y desviación estándar por hora (estimaciones). */
export function hourly(bet: number, tc: number, c: BetConfig): { ev: number; sd: number } {
  return {
    ev: bet * estimatedEdge(tc, c) * c.handsPerHour,
    sd: bet * Math.sqrt(c.variance * c.handsPerHour),
  };
}

/** Riesgo de ruina con aproximación de difusión: exp(−2·μ·B/σ²), por mano. */
export function riskOfRuin(bankroll: number, avgBet: number, avgEdge: number, variance: number): number {
  if (avgBet <= 0 || bankroll <= 0) return bankroll <= 0 ? 1 : 0;
  const mu = avgBet * avgEdge;
  if (mu <= 0) return 1;
  return Math.exp((-2 * mu * bankroll) / (variance * avgBet * avgBet));
}

/** Manos sin apostar: aviso cuando falta 1 para el límite y alerta al llegar. */
export function noBetStatus(streak: number, max: number): 'ok' | 'warn' | 'limit' {
  return streak >= max ? 'limit' : streak === max - 1 ? 'warn' : 'ok';
}
