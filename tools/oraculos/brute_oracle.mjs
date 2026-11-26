// Verificación por fuerza bruta (zapatos diminutos): enumera TODAS las permutaciones de las cartas no vistas
// en orden real de reparto: π[0] = tapada, luego las cartas que pide el jugador, luego las del crupier.
// Sin fórmulas ni intercambiabilidad. La decisión del jugador solo depende de las cartas que él ha visto.
import { playerEVs } from './ev_oracle.mjs';
const VAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const best = (cards) => { const h = cards.reduce((s, i) => s + VAL[i], 0); return cards.includes(0) && h + 10 <= 21 ? h + 10 : h; };

function perms(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  const seen = new Set();
  arr.forEach((x, i) => { if (seen.has(x)) return; seen.add(x); for (const p of perms([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([x, ...p]); });
  return out; // permutaciones distintas: cada una con el mismo peso multinomial, así que el promedio es correcto
}

// Resultado para el jugador (1 unidad) con total p (no blackjack) dada la permutación y k cartas tomadas por el jugador.
function settle(p, pi, k, up, hitSoft17) {
  if (p > 21) return -1;
  const d = [up, pi[0]];
  if (best(d) === 21) return -1; // blackjack del crupier (solo posible sin peek): pierde todo
  let j = 1 + k;
  for (;;) {
    const b = best(d);
    const h = d.reduce((s, i) => s + VAL[i], 0);
    const soft = d.includes(0) && h + 10 <= 21;
    if (b > 21) return 1;
    if (b >= 17 && !(hitSoft17 && soft && b === 17)) return Math.sign(p - b);
    if (j >= pi.length) throw new Error('zapato agotado');
    d.push(pi[j++]);
  }
}

export function bruteEVs(pool, hand, up, { peek, hitSoft17 }) {
  const forb = peek && (up === 0 || up === 9) ? (up === 0 ? 9 : 0) : -1;
  const P = perms(pool).filter((pi) => pi[0] !== forb);
  const avg = (xs, f) => xs.reduce((s, x) => s + f(x), 0) / xs.length;
  const cons = (s) => P.filter((pi) => s.every((c, i) => pi[1 + i] === c));
  const standV = (s) => avg(cons(s), (pi) => settle(best([...hand, ...s]), pi, s.length, up, hitSoft17));
  function hitV(s) {
    const C = cons(s);
    let ev = 0;
    for (const r of new Set(C.map((pi) => pi[1 + s.length]))) {
      const w = C.filter((pi) => pi[1 + s.length] === r).length / C.length;
      const s2 = [...s, r];
      ev += w * (best([...hand, ...s2]) > 21 ? -1 : Math.max(standV(s2), hitV(s2)));
    }
    return ev;
  }
  const C = cons([]);
  let dbl = 0;
  for (const r of new Set(C.map((pi) => pi[1]))) {
    const w = C.filter((pi) => pi[1] === r).length / C.length;
    dbl += w * 2 * avg(cons([r]), (pi) => settle(best([...hand, r]), pi, 1, up, hitSoft17));
  }
  return { stand: standV([]), hit: hitV([]), double: dbl };
}

if (process.argv[1] && process.argv[1].endsWith('brute_oracle.mjs') && process.argv[2] !== 'split') {
  // Zapatos aleatorios de 7-8 cartas con muchas cartas altas, para que nunca se agote.
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let n = 0, worst = 0, skipped = 0;
  for (let t = 0; t < 400; t++) {
    const pool = Array.from({ length: 7 + Math.floor(rnd() * 2) }, () => (rnd() < 0.45 ? 9 : Math.floor(rnd() * 10)));
    const hand = [Math.floor(rnd() * 10), Math.floor(rnd() * 10)];
    if (best(hand) === 21) continue;
    const up = rnd() < 0.5 ? (rnd() < 0.5 ? 0 : 9) : Math.floor(rnd() * 10);
    const rules = { peek: rnd() < 0.7, hitSoft17: rnd() < 0.3 };
    const counts = Array(10).fill(0); pool.forEach((i) => counts[i]++);
    const forb = rules.peek && (up === 0 || up === 9) ? (up === 0 ? 9 : 0) : -1;
    if (forb >= 0 && counts.reduce((a, b) => a + b, 0) === counts[forb]) continue;
    let b;
    try { b = bruteEVs(pool, hand, up, rules); } catch { skipped++; continue; }
    const o = playerEVs(counts, hand, up, rules);
    for (const k of ['stand', 'hit', 'double']) worst = Math.max(worst, Math.abs(b[k] - o[k]));
    n++;
  }
  console.log(`casos comparados: ${n}, saltados por zapato agotado: ${skipped}, diferencia máxima: ${worst.toExponential(2)}`);
}

// Dividir (misma aproximación que el oráculo): 2 × valor de UNA mano que empieza con x y recibe
// su segunda carta del zapato (π[1]); se juega lo mejor entre plantarse, pedir y (si DAS) doblar.
export function bruteSplitSingle(pool, x, up, rules) {
  const forb = rules.peek && (up === 0 || up === 9) ? (up === 0 ? 9 : 0) : -1;
  const P = perms(pool).filter((pi) => pi[0] !== forb);
  let v = 0;
  for (const r of new Set(P.map((pi) => pi[1]))) {
    const w = P.filter((pi) => pi[1] === r).length / P.length;
    // Reutiliza bruteEVs: la mano [x, r] con el zapato sin esa r, condicionando a π[1] = r.
    const rest = pool.slice(); rest.splice(rest.indexOf(r), 1);
    const e = bruteEVs(rest, [x, r], up, rules);
    v += w * (x === 0 ? e.stand : Math.max(e.stand, e.hit, rules.das ? e.double : -Infinity));
  }
  return 2 * v;
}

if (process.argv[1] && process.argv[1].endsWith('brute_oracle.mjs') && process.argv[2] === 'split') {
  let seed = 999;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let n = 0, worst = 0;
  for (let t = 0; t < 150; t++) {
    const pool = Array.from({ length: 7 }, () => (rnd() < 0.45 ? 9 : Math.floor(rnd() * 10)));
    const x = Math.floor(rnd() * 10);
    const up = rnd() < 0.5 ? (rnd() < 0.5 ? 0 : 9) : Math.floor(rnd() * 10);
    const rules = { peek: rnd() < 0.7, hitSoft17: false, das: rnd() < 0.5, doubleOn: 'any', hitSplitAces: false };
    const counts = Array(10).fill(0); pool.forEach((i) => counts[i]++);
    const forb = rules.peek && (up === 0 || up === 9) ? (up === 0 ? 9 : 0) : -1;
    if (forb >= 0 && counts[forb] === 7) continue;
    let b; try { b = bruteSplitSingle(pool, x, up, rules); } catch { continue; }
    const o = playerEVs(counts, [x, x], up, rules).split;
    worst = Math.max(worst, Math.abs(b - o)); n++;
  }
  console.log(`dividir: ${n} casos, diferencia máxima ${worst.toExponential(2)}`);
}
