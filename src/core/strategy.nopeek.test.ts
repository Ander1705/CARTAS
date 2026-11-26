import { beforeAll, expect, it } from '@jest/globals';
import { DEFAULT_RULES } from './rules';
import { generateStrategy } from './strategy';
import { applyChanges, referenceStrategy } from './__fixtures__/referenceStrategy';

let actual: ReturnType<typeof generateStrategy>;
beforeAll(() => { actual = generateStrategy({ ...DEFAULT_RULES, dealerPeeks: false }); }, 600000);
it('regenera la estrategia sin peek', () => expect(actual).toEqual(applyChanges(referenceStrategy, [['hard', '11', 'T', 'H'], ['pairs', '88', 'T', 'H'], ['pairs', '88', 'A', 'H']])), 600000);
