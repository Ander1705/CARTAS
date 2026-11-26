import { BASE_STRATEGY } from '../precomputedStrategy';
import type { StrategyTable, StrategyAction } from '../strategy';
export const referenceStrategy = BASE_STRATEGY;

export type Change = ['hard' | 'soft' | 'pairs', string, '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'A', StrategyAction];
export function applyChanges(table: StrategyTable, changes: Change[]): StrategyTable {
  const copy: StrategyTable = { hard: Object.fromEntries(Object.entries(table.hard).map(([key, value]) => [key, [...value]])), soft: Object.fromEntries(Object.entries(table.soft).map(([key, value]) => [key, [...value]])), pairs: Object.fromEntries(Object.entries(table.pairs).map(([key, value]) => [key, [...value]])) };
  const columns = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'A'];
  for (const [group, key, column, action] of changes) {
    const row = (copy[group] as Record<string, StrategyAction[]>)[key];
    if (row) row[columns.indexOf(column)] = action;
  }
  return copy;
}
