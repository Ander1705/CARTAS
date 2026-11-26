// Oráculo del arquitecto: tabla de estrategia básica generada con zapato completo.
// Duros: promedio ponderado del EV sobre todas las combinaciones de 2 cartas NO pareja que suman ese total
// (peso = n_a · n_b con el zapato sin la carta visible). Suaves: A,x. Parejas: x,x.
// Una caché (crupier + jugador) por columna: misma visible y mismas reglas.
// Acción: la de mayor EV. Si es doblar: 'D' si pedir > plantarse, si no 'Ds'. Rendirse = 'R'.
import { playerEVs, shoeCounts } from './ev_oracle.mjs';
const N = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];
const UPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]; // columnas 2..9, T, A
const VAL = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function decide(ev, rules) {
  const opts = [['S', ev.stand], ['H', ev.hit]];
  if (ev.double !== null) opts.push(['D', ev.double]);
  if (ev.split !== null) opts.push(['P', ev.split]);
  if (rules.surrender && ev.surrender !== null) opts.push(['R', ev.surrender]);
  let best = opts[0];
  for (const o of opts) if (o[1] > best[1]) best = o;
  if (best[0] === 'D') return ev.hit > ev.stand ? 'D' : 'Ds';
  return best[0];
}

function cell(hands, up, rules, decks, cache) {
  // hands: [[a,b], peso]; promedia cada EV con los pesos.
  const acc = { stand: 0, hit: 0, double: 0, surrender: 0, split: 0 };
  let W = 0, hasSplit = false;
  for (const [[a, b], w] of hands) {
    const c = shoeCounts(decks); c[up]--; c[a]--; c[b]--;
    const e = playerEVs(c, [a, b], up, rules, cache);
    for (const k in acc) if (e[k] !== null) acc[k] += w * e[k];
    if (e.split !== null) hasSplit = true;
    W += w;
  }
  for (const k in acc) acc[k] /= W;
  if (!hasSplit) acc.split = null;
  return decide(acc, rules);
}

export function generate(rules, decks = 8) {
  const T = { hard: {}, soft: {}, pairs: {} };
  for (const up of UPS) {
    const base = shoeCounts(decks); base[up]--;
    const cache = { dealer: new Map(), hit: new Map() };
    for (let t = 5; t <= 19; t++) {
      const hands = [];
      for (let a = 1; a <= 9; a++) for (let b = a + 1; b <= 9; b++) {
        if (VAL[a] + VAL[b] === t) hands.push([[a, b], base[a] * base[b]]);
      }
      (T.hard[t] ||= []).push(cell(hands, up, rules, decks, cache));
    }
    for (let x = 1; x <= 8; x++) (T.soft['A' + N[x]] ||= []).push(cell([[[0, x], 1]], up, rules, decks, cache));
    for (let x = 0; x <= 9; x++) (T.pairs[N[x] + N[x]] ||= []).push(cell([[[x, x], 1]], up, rules, decks, cache));
  }
  return T;
}

if (process.argv[1] && process.argv[1].endsWith('strategy_oracle.mjs')) {
  const base = { peek: true, hitSoft17: false, das: true, hitSplitAces: true, surrender: false, doubleOn: 'any' };
  const variants = { base, sinPeek: { ...base, peek: false }, rendicion: { ...base, surrender: true }, sinDAS: { ...base, das: false } };
  const out = {};
  for (const [name, r] of Object.entries(variants)) {
    const t0 = Date.now(); out[name] = generate(r); console.error(`${name}: ${Date.now() - t0} ms`);
  }
  console.log(JSON.stringify(out));
}
