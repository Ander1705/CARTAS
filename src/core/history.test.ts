import { describe, expect, it } from '@jest/globals';
import { canRedo, canUndo, createHistory, record, redo, undo } from './history';

describe('history', () => {
  it('records, undoes and redoes values without a fixed limit', () => {
    let history = createHistory(1);
    history = record(history, 2);
    history = record(history, 3);
    history = undo(undo(history));
    expect(history.present).toBe(1);
    expect(canUndo(history)).toBe(false);
    expect(redo(history).present).toBe(2);
  });

  it('clears the future when recording after undo', () => {
    const history = record(undo(record(createHistory(1), 2)), 9);
    expect(history.present).toBe(9);
    expect(canRedo(history)).toBe(false);
  });
});
