// Oráculo del arquitecto: deriva los índices de desviación con el motor exacto.
// Zapato a conteo real t: 4 mazos restantes (8 mazos con la mitad repartida); se cambian j = 2t cartas
// bajas (2-6, por turnos) por altas (T y A en proporción 4:1). Para t < 0 se cambian altas por bajas.
// Cada intercambio mueve el conteo corrido en 2 → conteo real = 2j / 4 = t. Es una aproximación (modelo lineal).
import { playerEVs, shoeCounts } from './ev_oracle.mjs';
const IDX = { A: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, T: 9 };

export function shoeAtTC(t, decksLeft = 4) {
  const c = shoeCounts(decksLeft);
  const j = Math.round(2 * Math.abs(t));
  const lows = [1, 2, 3, 4, 5];
  const highs = [9, 9, 9, 9, 0];
  for (let k = 0; k < j; k++) {
    const lo = lows[k % 5], hi = highs[k % 5];
    if (t > 0) { c[lo]--; c[hi]++; } else { c[lo]++; c[hi]--; }
  }
  return c;
}

const RULES = { peek: true, hitSoft17: false, das: true, hitSplitAces: true, doubleOn: 'any' };
// [nombre, mano, visible, jugada básica, desviación, índice publicado, dirección]
// 'ge': la desviación se hace con conteo real ≥ índice. 'lt': la desviación (pedir) se hace con conteo < índice.
export const PLAYS = [
  ['16 vs 10', 'T,6', 'T', 'hit', 'stand', 0, 'ge'],
  ['15 vs 10', 'T,5', 'T', 'hit', 'stand', 4, 'ge'],
  ['10,10 vs 5', 'T,T', '5', 'stand', 'split', 5, 'ge'],
  ['10,10 vs 6', 'T,T', '6', 'stand', 'split', 4, 'ge'],
  ['10 vs 10', '6,4', 'T', 'hit', 'double', 4, 'ge'],
  ['12 vs 3', 'T,2', '3', 'hit', 'stand', 2, 'ge'],
  ['12 vs 2', 'T,2', '2', 'hit', 'stand', 3, 'ge'],
  ['11 vs A', '6,5', 'A', 'hit', 'double', 1, 'ge'],
  ['9 vs 2', '5,4', '2', 'hit', 'double', 1, 'ge'],
  ['10 vs A', '6,4', 'A', 'hit', 'double', 4, 'ge'],
  ['9 vs 7', '5,4', '7', 'hit', 'double', 3, 'ge'],
  ['16 vs 9', 'T,6', '9', 'hit', 'stand', 5, 'ge'],
  ['13 vs 2', 'T,3', '2', 'stand', 'hit', -1, 'lt'],
  ['12 vs 4', 'T,2', '4', 'stand', 'hit', 0, 'lt'],
  ['12 vs 5', 'T,2', '5', 'stand', 'hit', -2, 'lt'],
  ['12 vs 6', 'T,2', '6', 'stand', 'hit', -1, 'lt'],
  ['13 vs 3', 'T,3', '3', 'stand', 'hit', -2, 'lt'],
  ['R 14 vs 10', 'T,4', 'T', 'hit', 'surrender', 3, 'ge'],
  ['R 15 vs 10', 'T,5', 'T', 'hit', 'surrender', 0, 'ge'],
  ['R 15 vs 9', 'T,5', '9', 'hit', 'surrender', 2, 'ge'],
  ['R 15 vs A', 'T,5', 'A', 'hit', 'surrender', 1, 'ge'],
];

// Cruce derivado: el menor conteo real t (pasos de 0,5, en -8..10) a partir del cual "stand/double/split/surrender" ≥ "hit"
// (para 'lt': el menor t desde el cual plantarse ≥ pedir; se pide por debajo).
export function deriveIndex([, handS, upS, basic, dev, , dir]) {
  const hand = handS.split(',').map((x) => IDX[x]), up = IDX[upS];
  const better = (t) => {
    const c = shoeAtTC(t); for (const i of [...hand, up]) c[i]--;
    const e = playerEVs(c, hand, up, { ...RULES, surrender: true });
    const v = { hit: e.hit, stand: e.stand, double: e.double, split: e.split, surrender: e.surrender };
    return dir === 'ge' ? v[dev] >= v[basic] : v[basic] >= v[dev];
  };
  for (let t = -8; t <= 10; t += 0.5) if (better(t)) return t;
  return null;
}

// Seguro: conviene cuando P(tapada = 10) > 1/3 (paga 2:1).
export function insuranceIndex() {
  for (let t = -4; t <= 10; t += 0.5) { const c = shoeAtTC(t); c[0]--; const n = c.reduce((a, b) => a + b, 0); if (c[9] / n > 1 / 3) return t; }
  return null;
}

if (process.argv[1] && process.argv[1].endsWith('index_oracle.mjs')) {
  console.log('Seguro: publicado +3, derivado', insuranceIndex());
  // El índice publicado n se usa con el conteo real TRUNCADO/redondeado; el cruce real cae dentro de (n-1, n+1].
  for (const p of PLAYS) { const d = deriveIndex(p); const ok = Math.abs(d - p[5]) <= 1; console.log(`${p[0].padEnd(12)} publicado ${String(p[5]).padStart(3)}  cruce ${String(d).padStart(4)}  ${ok ? '✓ (±1)' : '✗ revisar'}`); }
}
