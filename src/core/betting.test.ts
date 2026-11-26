import { describe, expect, test } from '@jest/globals';
import {
  DEFAULT_BET_CONFIG, estimatedEdge, hourly, light, noBetStatus, riskOfRuin,
  suggestedBet, validateBetConfig, type BetConfig,
} from './betting';

const cfg: BetConfig = { ...DEFAULT_BET_CONFIG, ramp: [...DEFAULT_BET_CONFIG.ramp] };

describe('semáforo', () => {
  test.each([
    [-3, 'gray', true], [-2, 'gray', true], [-1.9, 'gray', false], [1.9, 'gray', false],
    [2, 'yellow', false], [2.99, 'yellow', false], [3, 'green', false], [7.4, 'green', false],
  ])('conteo real %p → %s (negativo %p)', (tc, color, negative) => {
    expect(light(tc, cfg)).toEqual({ light: color, negative });
  });
});

describe('apuesta sugerida', () => {
  test('rampa por conteo real truncado', () => {
    expect([0, 1.9, 2.5, 3, 4, 5, 9].map((tc) => suggestedBet(tc, cfg)))
      .toEqual([5000, 5000, 10000, 20000, 30000, 40000, 40000]);
  });
  test('negativo fuerte: mínima', () => {
    expect(suggestedBet(-4, cfg)).toBe(5000);
  });
  test('limitada por el máximo de la mesa y por el capital', () => {
    expect(suggestedBet(6, { ...cfg, maxBet: 25000 })).toBe(25000);
    expect(suggestedBet(6, { ...cfg, bankroll: 17500 })).toBe(17000);
  });
  test('sin capital para la mínima: 0', () => {
    expect(suggestedBet(5, { ...cfg, bankroll: 4000 })).toBe(0);
  });
  test('Kelly fraccionado: f · ventaja / varianza · capital, redondeado a 1.000', () => {
    const k = { ...cfg, method: 'kelly' as const };
    // ventaja a +4: -0,0034 + 0,02 = 0,0166 → 0,25·0,0166/1,33·1.000.000 = 3.120,3
    expect(suggestedBet(4, k)).toBe(5000); // no baja de la mínima
    expect(suggestedBet(4, { ...k, bankroll: 10_000_000 })).toBe(31000);
    expect(suggestedBet(0, k)).toBe(5000); // sin ventaja: mínima
  });
});

test('ventaja estimada, por hora y desviación', () => {
  expect(estimatedEdge(0, cfg)).toBeCloseTo(-0.0034);
  expect(estimatedEdge(3, cfg)).toBeCloseTo(0.0116);
  const h = hourly(10000, 3, cfg);
  expect(h.ev).toBeCloseTo(10000 * 0.0116 * 60);
  expect(h.sd).toBeCloseTo(10000 * Math.sqrt(1.33 * 60));
});

test('riesgo de ruina', () => {
  expect(riskOfRuin(1_000_000, 10000, -0.001, 1.33)).toBe(1);
  expect(riskOfRuin(0, 10000, 0.01, 1.33)).toBe(1);
  // exp(-2·100·1.000.000/(1,33·10⁸)) = exp(-1,5038)
  expect(riskOfRuin(1_000_000, 10000, 0.01, 1.33)).toBeCloseTo(Math.exp(-2e8 / 1.33e8), 6);
  expect(riskOfRuin(2_000_000, 10000, 0.01, 1.33)).toBeLessThan(riskOfRuin(1_000_000, 10000, 0.01, 1.33));
});

test('manos sin apostar', () => {
  expect([0, 1, 2, 3, 4].map((s) => noBetStatus(s, 3))).toEqual(['ok', 'ok', 'warn', 'limit', 'limit']);
});

test('validación de configuración', () => {
  expect(() => validateBetConfig({ ...cfg, maxBet: 1000 })).toThrow();
  expect(() => validateBetConfig({ ...cfg, yellowAt: 4 })).toThrow();
  expect(() => validateBetConfig({ ...cfg, kellyFraction: 0 })).toThrow();
  expect(() => validateBetConfig({ ...cfg, maxNoBetHands: 0 })).toThrow();
  expect(validateBetConfig(cfg)).toEqual(cfg);
});
