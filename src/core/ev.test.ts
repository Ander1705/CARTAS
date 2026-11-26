import { describe, expect, it } from '@jest/globals';
import { dealSeen, newShoe, type ShoeState } from './shoe';
import type { Rank } from './cards';
import { DEFAULT_RULES, type Rules } from './rules';
import { playerEVs } from './ev';

function fullShoe(hand: Rank[], upcard: Rank, changes: Partial<Rules> = {}) {
  let shoe = newShoe({ decks: 8, burnCards: 0, cutPenetration: 0.75 });
  for (const rank of [...hand, upcard]) shoe = dealSeen(shoe, rank);
  return { shoe, rules: { ...DEFAULT_RULES, ...changes } };
}

function tinyShoe(counts: Partial<Record<Rank, number>>): ShoeState {
  const base = newShoe({ decks: 1, burnCards: 0, cutPenetration: 0.75 });
  const unseen = Object.fromEntries((Object.keys(base.unseen) as Rank[]).map((rank) => [rank, counts[rank] ?? 0])) as Record<Rank, number>;
  return { ...base, unseen };
}

describe('playerEVs', () => {
  it('E1', () => { const { shoe, rules } = fullShoe(['T', '6'], 'T'); const ev = playerEVs(shoe, ['T', '6'], 'T', rules); expect(ev.stand).toBeCloseTo(-0.540826736160998, 12); expect(ev.hit).toBeCloseTo(-0.5359748431671139, 12); expect(ev.double).toBeCloseTo(-1.0719496863342277, 12); expect(ev.surrender).toBeNull(); });
  it('E2', () => { const { shoe, rules } = fullShoe(['9', '7'], 'T'); const ev = playerEVs(shoe, ['9', '7'], 'T', rules); expect(ev.stand).toBeCloseTo(-0.5377185819899459, 12); expect(ev.hit).toBeCloseTo(-0.536507758837559, 12); });
  it('E3', () => { const { shoe, rules } = fullShoe(['T', '2'], '4'); const ev = playerEVs(shoe, ['T', '2'], '4', rules); expect(ev.stand).toBeCloseTo(-0.2110998434063771, 12); expect(ev.hit).toBeCloseTo(-0.2111608081779865, 12); });
  it('E4', () => { const { shoe, rules } = fullShoe(['A', '7'], '2'); const ev = playerEVs(shoe, ['A', '7'], '2', rules); expect(ev.stand).toBeCloseTo(0.12343228631931188, 12); expect(ev.hit).toBeCloseTo(0.06319271461392406, 12); expect(ev.double).toBeCloseTo(0.12066917125571536, 12); });
  it('E5', () => { const { shoe, rules } = fullShoe(['A', '7'], '2', { dealerHitsSoft17: true }); const ev = playerEVs(shoe, ['A', '7'], '2', rules); expect(ev.stand).toBeCloseTo(0.11239703634300796, 12); expect(ev.hit).toBeCloseTo(0.06029777814249367, 12); expect(ev.double).toBeCloseTo(0.1158664581838834, 12); });
  it('E6', () => { const { shoe, rules } = fullShoe(['6', '5'], '6'); const ev = playerEVs(shoe, ['6', '5'], '6', rules); expect(ev.stand).toBeCloseTo(-0.15153138619526862, 12); expect(ev.hit).toBeCloseTo(0.3394145434011006, 12); expect(ev.double).toBeCloseTo(0.6788290868022012, 12); });
  it('E7', () => { const { shoe, rules } = fullShoe(['T', 'T'], '6'); expect(playerEVs(shoe, ['T', 'T'], '6', rules).stand).toBeCloseTo(0.7031079044308189, 12); });
  it('E8', () => { const { shoe, rules } = fullShoe(['T', '6'], 'A'); const ev = playerEVs(shoe, ['T', '6'], 'A', rules); expect(ev.stand).toBeCloseTo(-0.6653639765756427, 12); expect(ev.hit).toBeCloseTo(-0.5161388131000049, 12); });
  it('E9', () => { const { shoe, rules } = fullShoe(['T', '6'], 'A', { dealerPeeks: false, surrender: 'late' }); const ev = playerEVs(shoe, ['T', '6'], 'A', rules); expect(ev.stand).toBeCloseTo(-0.7682665794204208, 12); expect(ev.hit).toBeCloseTo(-0.6649290570135628, 12); expect(ev.double).toBeCloseTo(-1.3298581140271255, 12); expect(ev.surrender).toBeCloseTo(-0.6537530266343825, 12); });
  it('E10', () => { const { shoe, rules } = fullShoe(['T', '6'], 'T', { surrender: 'late' }); expect(playerEVs(shoe, ['T', '6'], 'T', rules).surrender).toBe(-0.5); });
  it('E11', () => { const { shoe, rules } = fullShoe(['T', '3', '3'], 'T', { surrender: 'late' }); const ev = playerEVs(shoe, ['T', '3', '3'], 'T', rules); expect(ev.stand).toBeCloseTo(-0.5409949550075555, 12); expect(ev.hit).toBeCloseTo(-0.5403846811444375, 12); expect(ev.double).toBeNull(); expect(ev.surrender).toBeNull(); });
  it('E12', () => { const { shoe, rules } = fullShoe(['2', '2'], 'A'); const ev = playerEVs(shoe, ['2', '2'], 'A', rules); expect(ev.stand).toBeCloseTo(-0.6662344517010239, 12); expect(ev.hit).toBeCloseTo(-0.25403189811862703, 12); expect(ev.double).toBeCloseTo(-1.3324689034020476, 12); });
  it('E13 double restrictions', () => {
    const a7 = fullShoe(['A', '7'], '2', { doubleOn: '10-11' }); expect(playerEVs(a7.shoe, ['A', '7'], '2', a7.rules).double).toBeNull();
    const sixFive = fullShoe(['6', '5'], '6', { doubleOn: '10-11' }); expect(playerEVs(sixFive.shoe, ['6', '5'], '6', sixFive.rules).double).toBeCloseTo(0.6788290868022012, 12);
    const fiveFour = fullShoe(['5', '4'], '3', { doubleOn: '9-11' }); expect(typeof playerEVs(fiveFour.shoe, ['5', '4'], '3', fiveFour.rules).double).toBe('number');
    const a8 = fullShoe(['A', '8'], '6', { doubleOn: '9-11' }); expect(playerEVs(a8.shoe, ['A', '8'], '6', a8.rules).double).toBeNull();
  });
  it('T1', () => { const shoe = tinyShoe({ T: 3, '5': 1, '6': 1, '9': 1, A: 1 }); const ev = playerEVs(shoe, ['T', '6'], 'A', { ...DEFAULT_RULES }); expect(ev.stand).toBeCloseTo(-17 / 30, 12); expect(ev.hit).toBeCloseTo(-311 / 480, 12); expect(ev.double).toBeCloseTo(-311 / 240, 12); });
  it('T2', () => { const shoe = tinyShoe({ T: 3, '5': 1, '6': 1, '9': 1, A: 1 }); const ev = playerEVs(shoe, ['T', '6'], 'A', { ...DEFAULT_RULES, dealerPeeks: false, surrender: 'late' }); expect(ev.stand).toBeCloseTo(-79 / 105, 12); expect(ev.hit).toBeCloseTo(-671 / 840, 12); expect(ev.double).toBeCloseTo(-671 / 420, 12); expect(ev.surrender).toBeCloseTo(-5 / 7, 12); });
  it('T3', () => { const shoe = tinyShoe({ T: 4, '2': 1, '7': 1, '8': 1 }); const ev = playerEVs(shoe, ['9', '3'], 'T', { ...DEFAULT_RULES }); expect(ev.stand).toBeCloseTo(-17 / 21, 12); expect(ev.hit).toBeCloseTo(-71 / 105, 12); expect(ev.double).toBeCloseTo(-152 / 105, 12); });
  it('T4', () => { const shoe = tinyShoe({ T: 3, '4': 1, '5': 1, '3': 1, '8': 1 }); const ev = playerEVs(shoe, ['A', '6'], '6', { ...DEFAULT_RULES, dealerHitsSoft17: true }); expect(ev.stand).toBeCloseTo(-6 / 35, 12); expect(ev.hit).toBeCloseTo(0, 12); expect(ev.double).toBeCloseTo(0, 12); });
  it('validates initial hands', () => {
    const { shoe, rules } = fullShoe(['A', 'T'], '5'); expect(() => playerEVs(shoe, ['A', 'T'], '5', rules)).toThrow('La mano es blackjack: se paga sin decidir');
    expect(() => playerEVs(shoe, ['T'], '5', rules)).toThrow('La mano necesita al menos 2 cartas');
    expect(() => playerEVs(shoe, ['T', 'T', '5'], '5', rules)).toThrow('La mano ya se pasó');
  });
});

describe('playerEVs split', () => {
  it('S1', () => { const { shoe, rules } = fullShoe(['8', '8'], 'T'); expect(playerEVs(shoe, ['8', '8'], 'T', rules).split).toBeCloseTo(-0.48477789153558193, 12); });
  it('S2', () => { const { shoe, rules } = fullShoe(['8', '8'], '6'); expect(playerEVs(shoe, ['8', '8'], '6', rules).split).toBeCloseTo(0.3272779839067592, 12); });
  it('S3', () => { const { shoe, rules } = fullShoe(['A', 'A'], '6'); expect(playerEVs(shoe, ['A', 'A'], '6', rules).split).toBeCloseTo(0.6786123315123708, 12); });
  it('S4', () => { const { shoe, rules } = fullShoe(['A', 'A'], '6', { hitSplitAces: true }); expect(playerEVs(shoe, ['A', 'A'], '6', rules).split).toBeCloseTo(0.9875643127579266, 12); }, 60000);
  it('S5', () => { const { shoe, rules } = fullShoe(['A', 'A'], 'A'); expect(playerEVs(shoe, ['A', 'A'], 'A', rules).split).toBeCloseTo(0.12258518621203635, 12); }, 60000);
  it('S6', () => { const { shoe, rules } = fullShoe(['9', '9'], '7'); const ev = playerEVs(shoe, ['9', '9'], '7', rules); expect(ev.split).toBeCloseTo(0.3692610292009455, 12); expect(ev.stand).toBeCloseTo(0.3995629467019545, 12); });
  it('S7', () => { const { shoe, rules } = fullShoe(['9', '9'], '9'); expect(playerEVs(shoe, ['9', '9'], '9', rules).split).toBeCloseTo(-0.09477012415531888, 12); });
  it('S8', () => { const { shoe, rules } = fullShoe(['4', '4'], '5'); const ev = playerEVs(shoe, ['4', '4'], '5', rules); expect(ev.split).toBeCloseTo(0.10022207014913649, 12); expect(ev.hit).toBeCloseTo(0.08038377311610825, 12); });
  it('S9', () => { const { shoe, rules } = fullShoe(['4', '4'], '5', { doubleAfterSplit: false }); expect(playerEVs(shoe, ['4', '4'], '5', rules).split).toBeCloseTo(-0.011016333220271582, 12); });
  it('S10', () => { const { shoe, rules } = fullShoe(['4', '4'], '5', { doubleOn: '10-11' }); expect(playerEVs(shoe, ['4', '4'], '5', rules).split).toBeCloseTo(0.07954706529766688, 12); });
  it('S11', () => { const { shoe, rules } = fullShoe(['2', '2'], '3'); const ev = playerEVs(shoe, ['2', '2'], '3', rules); expect(ev.split).toBeCloseTo(-0.018911662393926, 12); expect(ev.hit).toBeCloseTo(-0.08218773793799158, 12); }, 60000);
  it('S12', () => { const { shoe, rules } = fullShoe(['2', '2'], '3', { doubleAfterSplit: false }); expect(playerEVs(shoe, ['2', '2'], '3', rules).split).toBeCloseTo(-0.09569962026410196, 12); }, 60000);
  it('S13', () => { const { shoe, rules } = fullShoe(['8', '8'], 'A', { dealerPeeks: false }); expect(playerEVs(shoe, ['8', '8'], 'A', rules).split).toBeCloseTo(-0.8873361978256207, 12); });
  it('S14', () => { const { shoe, rules } = fullShoe(['T', 'T'], '6'); expect(playerEVs(shoe, ['T', 'T'], '6', rules).split).toBeCloseTo(0.5689865735765605, 12); });
  it('S15', () => { const { shoe, rules } = fullShoe(['7', '7'], '8'); const ev = playerEVs(shoe, ['7', '7'], '8', rules); expect(ev.split).toBeCloseTo(-0.38924805590054606, 12); expect(ev.hit).toBeCloseTo(-0.37625355168248853, 12); });
  it('S16', () => { const { shoe, rules } = fullShoe(['6', '6'], '2'); expect(playerEVs(shoe, ['6', '6'], '2', rules).split).toBeCloseTo(-0.20894380937475648, 12); });
  it('S17 nulls', () => {
    const a = fullShoe(['8', '8'], 'T', { maxSplitHands: 1 }); expect(playerEVs(a.shoe, ['8', '8'], 'T', a.rules).split).toBeNull();
    const b = fullShoe(['T', '6'], 'T'); expect(playerEVs(b.shoe, ['T', '6'], 'T', b.rules).split).toBeNull();
    const c = fullShoe(['T', '3', '3'], 'T'); expect(playerEVs(c.shoe, ['T', '3', '3'], 'T', c.rules).split).toBeNull();
  });
});
