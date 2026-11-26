// Oráculo independiente del arquitecto: EV de plantarse, pedir, doblar y rendirse.
// counts: índice 0 = A, 1..8 = 2..9, 9 = T. La mano del jugador y la carta visible ya están fuera de counts.
// Tapada: con peek y A/T visible se ENUMERA la tapada (exacto). En otro caso, la tapada es una carta más
// del zapato (intercambiable) y el crupier juega desde la visible. Sin peek, el blackjack del crupier
// se lleva todo lo apostado (ENHC).
const VAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const best = (hard, ace) => (ace && hard + 10 <= 21 ? hard + 10 : hard);

// Distribución final del crupier desde sus cartas conocidas. Devuelve {17..21, bust, bj}.
function dealer(c, cards, hitSoft17) {
  const memo = new Map();
  function play(hard, ace, n) {
    const b = best(hard, ace);
    if (b > 21) return { bust: 1 };
    const soft = ace && hard + 10 <= 21;
    if (b >= 17 && !(hitSoft17 && soft && b === 17)) return b === 21 && n === 2 ? { bj: 1 } : { [b]: 1 };
    const key = c.join(',') + '|' + hard + '|' + +ace + '|' + Math.min(n, 3);
    if (memo.has(key)) return memo.get(key);
    let tot = 0;
    for (let i = 0; i < 10; i++) tot += c[i];
    const out = {};
    for (let i = 0; i < 10; i++) {
      if (!c[i]) continue;
      const p = c[i] / tot;
      c[i]--;
      const sub = play(hard + VAL[i], ace || i === 0, n + 1);
      c[i]++;
      for (const k in sub) out[k] = (out[k] || 0) + p * sub[k];
    }
    memo.set(key, out);
    return out;
  }
  const hard = cards.reduce((s, i) => s + VAL[i], 0);
  return play(hard, cards.includes(0), cards.length);
}

// EV de plantarse con total p (sin blackjack del jugador) contra la distribución d.
function standEV(p, d) {
  if (p > 21) return -1;
  let ev = 0;
  for (const k in d) {
    if (k === 'bust') ev += d[k];
    else if (k === 'bj') ev -= d[k];
    else ev += d[k] * Math.sign(p - Number(k));
  }
  return ev;
}

// Estado = zapato c que INCLUYE la tapada. Con peek y A/T visible, la tapada es uniforme entre las cartas
// de c que no dan blackjack (f = rango prohibido). El jugador nunca conoce la tapada al decidir.
export function playerEVs(counts, hand, up, rules) {
  const c = counts.slice();
  const f = rules.peek && (up === 0 || up === 9) ? (up === 0 ? 9 : 0) : -1;
  const memo = new Map();
  const total = () => c.reduce((a, b) => a + b, 0);
  // Probabilidad de que la próxima carta del jugador sea de rango r (sin reposición, tapada condicionada).
  function drawProbs() {
    const N = total();
    if (f < 0) return c.map((n) => n / N);
    const M = N - c[f];
    return c.map((n, r) => (n * (M - (r !== f ? 1 : 0))) / (M * (N - 1)));
  }
  function dealerD() {
    if (f < 0) return dealer(c, [up], rules.hitSoft17);
    const M = total() - c[f];
    const out = {};
    for (let h = 0; h < 10; h++) {
      if (h === f || !c[h]) continue;
      const w = c[h] / M;
      c[h]--;
      const d = dealer(c, [up, h], rules.hitSoft17);
      c[h]++;
      for (const k in d) out[k] = (out[k] || 0) + w * d[k];
    }
    return out;
  }
  const stand = (hard, ace) => standEV(best(hard, ace), dealerD());
  function bestPlay(hard, ace) {
    if (best(hard, ace) > 21) return -1;
    const key = c.join(',');
    if (memo.has(key)) return memo.get(key);
    const v = Math.max(stand(hard, ace), hit(hard, ace));
    memo.set(key, v);
    return v;
  }
  function hit(hard, ace) {
    const p = drawProbs();
    let ev = 0;
    for (let i = 0; i < 10; i++) {
      if (!p[i]) continue;
      c[i]--;
      ev += p[i] * bestPlay(hard + VAL[i], ace || i === 0);
      c[i]++;
    }
    return ev;
  }
  const hard0 = hand.reduce((s, i) => s + VAL[i], 0);
  const ace0 = hand.includes(0);
  const p = drawProbs();
  let dbl = 0;
  for (let i = 0; i < 10; i++) {
    if (!p[i]) continue;
    c[i]--;
    dbl += p[i] * 2 * stand(hard0 + VAL[i], ace0 || i === 0);
    c[i]++;
  }
  const pbj = dealerD().bj || 0; // con peek es 0
  const two = hand.length === 2;
  return { stand: stand(hard0, ace0), hit: hit(hard0, ace0), double: two ? dbl : null, surrender: two ? -0.5 * (1 - pbj) - pbj : null };
}

export const shoeCounts = (decks) => [4, 4, 4, 4, 4, 4, 4, 4, 4, 16].map((n) => n * decks);
export const IDX = { A: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, T: 9 };

// Uso: node ev_oracle.mjs 8 T,6 T [peek=1] [h17=0]
if (process.argv[1] && process.argv[1].endsWith('ev_oracle.mjs')) {
  const [decks, handS, upS, peek = '1', h17 = '0'] = process.argv.slice(2);
  const hand = handS.split(',').map((x) => IDX[x]);
  const up = IDX[upS];
  const c = shoeCounts(Number(decks));
  for (const i of [...hand, up]) c[i]--;
  const t = Date.now();
  const e = playerEVs(c, hand, up, { peek: peek === '1', hitSoft17: h17 === '1' });
  console.log(JSON.stringify(e), `${Date.now() - t} ms`);
}
