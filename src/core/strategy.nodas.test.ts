import { beforeAll, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { generateStrategy } from './strategy';
import { applyChanges, referenceStrategy } from './__fixtures__/referenceStrategy';

let actual: ReturnType<typeof generateStrategy>;
beforeAll(() => { actual = generateStrategy({ ...DEFAULT_RULES, doubleAfterSplit: false }); }, 600000);
it('regenera la estrategia sin double after split', () => expect(actual).toEqual(applyChanges(referenceStrategy, [['pairs', '22', '2', 'H'], ['pairs', '22', '3', 'H'], ['pairs', '33', '2', 'H'], ['pairs', '33', '3', 'H'], ['pairs', '44', '5', 'H'], ['pairs', '44', '6', 'H'], ['pairs', '66', '2', 'H']])), 600000);
