// Oráculo independiente del arquitecto: probabilidades finales del crupier, exactas, sin reposición.
// counts: índice 0 = A, 1..8 = 2..9, 9 = T. Las cartas ya vistas (incluida la visible) deben estar fuera.
const VAL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function dealerDist(counts, upIdx, { hitSoft17 = false, peekNoBJ = false } = {}) {
  const memo = new Map();
  const c = counts.slice();
  // Estado: total "duro" (A = 1) y si hay algún as en la mano.
  function play(hard, hasAce, ncards) {
    const soft = hasAce && hard + 10 <= 21;
    const best = soft ? hard + 10 : hard;
    if (best > 21) return { bust: 1 };
    if (best >= 17 && !(hitSoft17 && soft && best === 17)) {
      if (best === 21 && ncards === 2) return { bj: 1 };
      return { [best]: 1 };
    }
    const key = c.join(',') + '|' + hard + '|' + (hasAce ? 1 : 0) + '|' + Math.min(ncards, 3);
    const m = memo.get(key);
    if (m) return m;
    const out = {};
    let tot = 0;
    for (let i = 0; i < 10; i++) tot += c[i];
    for (let i = 0; i < 10; i++) {
      if (c[i] === 0) continue;
      // Peek: la tapada (2.ª carta) no puede formar blackjack.
      if (peekNoBJ && ncards === 1 && ((upIdx === 0 && i === 9) || (upIdx === 9 && i === 0))) continue;
      const p0 = c[i];
      c[i]--;
      const sub = play(hard + VAL[i], hasAce || i === 0, ncards + 1);
      c[i]++;
      for (const k in sub) out[k] = (out[k] || 0) + sub[k] * p0;
    }
    // Normalizar por la masa realmente permitida.
    let mass = 0;
    for (let i = 0; i < 10; i++) {
      if (c[i] === 0) continue;
      if (peekNoBJ && ncards === 1 && ((upIdx === 0 && i === 9) || (upIdx === 9 && i === 0))) continue;
      mass += c[i];
    }
    for (const k in out) out[k] /= mass;
    void tot;
    memo.set(key, out);
    return out;
  }
  return play(VAL[upIdx], upIdx === 0, 1);
}

export function shoeCounts(decks) {
  return [4, 4, 4, 4, 4, 4, 4, 4, 4, 16].map((n) => n * decks);
}

if (process.argv[1] && process.argv[1].endsWith('dealer_oracle.mjs')) {
  const names = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T'];
  const decks = Number(process.argv[2] || 8);
  for (const peek of [false, true]) {
    console.log(`\n${decks} mazos, S17, peek=${peek}`);
    for (let u = 0; u < 10; u++) {
      const c = shoeCounts(decks);
      c[u]--;
      const d = dealerDist(c, u, { peekNoBJ: peek && (u === 0 || u === 9) });
      const sum = Object.values(d).reduce((a, b) => a + b, 0);
      const f = (k) => ((d[k] || 0) * 100).toFixed(4).padStart(8);
      console.log(`${names[u]}: 17${f(17)} 18${f(18)} 19${f(19)} 20${f(20)} 21${f(21)} BJ${f('bj')} bust${f('bust')}  sum=${sum.toFixed(12)}`);
    }
  }
}
