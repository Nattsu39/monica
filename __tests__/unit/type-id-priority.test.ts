import { describe, expect, it } from 'vitest';
import { PRIORITY_CONSTS } from '../../src/extra-bonuses/priority-const.js';
import {
  TYPE_ID_TO_PRIORITY_SOURCE,
  UNMAPPED_PRIORITY_TYPE_IDS,
  assertPriorityConstsMonotonic,
  assertTypeIdPriorityMapping,
  getPriorityForTypeId,
} from '../validation/type-id-priority.js';

describe('type-id-priority', () => {
  it('PRIORITY_CONSTS.base 严格递增', () => {
    const values = Object.values(PRIORITY_CONSTS.base);
    for (let index = 1; index < values.length; index += 1) {
      expect(values[index]).toBeGreaterThan(values[index - 1] ?? 0);
    }
  });

  it('PRIORITY_CONSTS.pve / pvp 严格递增', () => {
    for (const scope of ['pve', 'pvp'] as const) {
      const values = Object.values(PRIORITY_CONSTS[scope]);
      for (let index = 1; index < values.length; index += 1) {
        expect(values[index]).toBeGreaterThan(values[index - 1] ?? 0);
      }
    }
  });

  it('断言辅助函数不抛出', () => {
    expect(() => assertPriorityConstsMonotonic()).not.toThrow();
    expect(() => assertTypeIdPriorityMapping()).not.toThrow();
  });

  it('type_id 6–11（除 10）映射到 PRIORITY_CONSTS 常量', () => {
    for (const [typeId, sourceKey] of Object.entries(TYPE_ID_TO_PRIORITY_SOURCE)) {
      expect(PRIORITY_CONSTS.base[sourceKey]).toBeTypeOf('number');
      expect(PRIORITY_CONSTS.pve[sourceKey]).toBeTypeOf('number');
      expect(getPriorityForTypeId(Number(typeId), 'base')).toBe(
        PRIORITY_CONSTS.base[sourceKey],
      );
    }
    expect(UNMAPPED_PRIORITY_TYPE_IDS).toContain(10);
    expect(getPriorityForTypeId(10, 'base')).toBe(Number.MAX_SAFE_INTEGER);
  });
});
