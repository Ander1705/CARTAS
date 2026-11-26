// Oráculo del arquitecto: ventaja de la casa por ANÁLISIS COMBINATORIO (primera mano, zapato completo),
// jugando la tabla de estrategia básica. Independiente del Monte Carlo (no simula, suma probabilidades exactas).
// Aproximaciones: dividir sin re-dividir (la del motor); no incluye el efecto de la carta de corte.
import { playerEVs, shoeCounts } from './ev_oracle.mjs';
import { generate } from './strategy_oracle.mjs';
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]; // 2..9, T, A
const N = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];
const VAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function tableAction(T, a, b, up) {
  const col = COLS.indexOf(up);
  if (a === b) return T.pairs[N[a] + N[a]][col];
  const hard = VAL[a] + VAL[b], soft = (a === 0 || b === 0) && hard + 10 <= 21;
  if (soft) return T.soft['A' + N[a === 0 ? b : a]][col];
  return hard >= 20 ? 'S' : hard <= 4 ? 'H' : T.hard[hard][col];
}

export function houseEdge(rules, decks = 8) {
  const T = generate(rules, decks);
  let ev = 0;
  for (let up = 0; up < 10; up++) for (let a = 0; a < 10; a++) for (let b = a; b < 10; b++) {
    const c = shoeCounts(decks);
    const total = c.reduce((x, y) => x + y, 0);
    // P(p1, up, p2) en orden de reparto, sumando ambos órdenes de la mano si a ≠ b.
    let p = c[a] / total; c[a]--; p *= c[up] / (total - 1); c[up]--; p *= c[b] / (total - 2); c[b]--;
    if (a !== b) p *= 2;
    const left = total - 3;
    const playerBJ = (a === 0 && b === 9) || (a === 9 && b === 0);
    const bjHole = up === 0 ? 9 : up === 9 ? 0 : -1;
    const pDealerBJ = bjHole >= 0 ? c[bjHole] / left : 0;
    if (playerBJ) { ev += p * (1 - pDealerBJ) * 1.5; continue; }
    let act = tableAction(T, a, b, up);
    const e = playerEVs(c, [a, b], up, rules);
    const v = { H: e.hit, S: e.stand, D: e.double, Ds: e.double, P: e.split, R: e.surrender }[act];
    const handEV = rules.peek ? (1 - pDealerBJ) * v - pDealerBJ : v; // sin peek, playerEVs ya incluye el BJ del crupier
    ev += p * handEV;
  }
  return -ev;
}

if (process.argv[1] && process.argv[1].endsWith('edge_oracle.mjs')) {
  const base = { peek: true, hitSoft17: false, das: true, surrender: false, doubleOn: 'any' };
  for (const [name, r] of [['Reglas de la tabla de referencia', { ...base, hitSplitAces: false }], ['Reglas de tu mesa (sin re-dividir ases en el cálculo)', { ...base, hitSplitAces: true }]]) {
    const t = Date.now(); console.log(`${name}: ventaja de la casa ${(houseEdge(r) * 100).toFixed(3)} %  (${Date.now() - t} ms)`);
  }
}
