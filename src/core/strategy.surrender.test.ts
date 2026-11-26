import { beforeAll, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { generateStrategy } from './strategy';
import { applyChanges, referenceStrategy } from './__fixtures__/referenceStrategy';

let actual: ReturnType<typeof generateStrategy>;
beforeAll(() => { actual = generateStrategy({ ...DEFAULT_RULES, surrender: 'late' }); }, 600000);
it('regenera la estrategia con surrender tardío', () => expect(actual).toEqual(applyChanges(referenceStrategy, [['hard', '15', 'T', 'R'], ['hard', '16', '9', 'R'], ['hard', '16', 'T', 'R'], ['hard', '16', 'A', 'R']])), 600000);
