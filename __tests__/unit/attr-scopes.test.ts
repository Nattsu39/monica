import { describe, it, expect } from 'vitest';
import {
  ATTR_MODES,
  cloneInBattleBuckets,
  getScopeTargets,
  isInBattleScope,
} from '../../src/attr-scopes.js';
import { deepCloneSingleAttrRecord } from '../../src/extra-bonuses/transforms/apply.js';
import type { BonusScope, PetAttrCalcResult } from '../../src/types.js';

const SIX_ATTR_KEYS = ['atk', 'def', 'spAtk', 'spDef', 'spd', 'hp'] as const;

function emptyBucket(): PetAttrCalcResult['base'] {
  return Object.fromEntries(
    SIX_ATTR_KEYS.map((key) => [key, { value: 0, details: [] }]),
  ) as PetAttrCalcResult['base'];
}

function makeResult(): PetAttrCalcResult {
  const base = emptyBucket();
  base.atk.value = 1;
  const pve = emptyBucket();
  pve.atk.value = 2;
  const pvp = emptyBucket();
  pvp.atk.value = 3;

  return {
    base,
    pve,
    pvp,
    base_inbattle: emptyBucket(),
    pve_inbattle: emptyBucket(),
    pvp_inbattle: emptyBucket(),
  };
}

describe('getScopeTargets', () => {
  it('all 返回三个面板桶', () => {
    const result = makeResult();
    const targets = getScopeTargets('all', result);

    expect(targets).toHaveLength(3);
    expect(targets).toContain(result.base);
    expect(targets).toContain(result.pve);
    expect(targets).toContain(result.pvp);
  });

  it.each([
    ['base', 'base'],
    ['pve', 'pve'],
    ['pvp', 'pvp'],
    ['base_inbattle', 'base_inbattle'],
    ['pve_inbattle', 'pve_inbattle'],
    ['pvp_inbattle', 'pvp_inbattle'],
  ] as const satisfies readonly [BonusScope, keyof PetAttrCalcResult][])(
    'scope %s 映射到 %s 桶',
    (scope, bucket) => {
      const result = makeResult();
      const targets = getScopeTargets(scope, result);

      expect(targets).toEqual([result[bucket]]);
    },
  );
});

describe('isInBattleScope', () => {
  it.each(['base_inbattle', 'pve_inbattle', 'pvp_inbattle'] as const)(
    '%s 为战斗 scope',
    (scope) => {
      expect(isInBattleScope(scope)).toBe(true);
    },
  );

  it.each(['all', 'base', 'pve', 'pvp'] as const)(
    '%s 非战斗 scope',
    (scope) => {
      expect(isInBattleScope(scope)).toBe(false);
    },
  );
});

describe('cloneInBattleBuckets', () => {
  it('将三个面板桶深克隆到对应战斗桶', () => {
    const result = makeResult();
    result.base_inbattle.atk.value = 99;
    result.pve_inbattle.atk.value = 99;
    result.pvp_inbattle.atk.value = 99;

    cloneInBattleBuckets(result);

    for (const mode of ATTR_MODES) {
      const inBattleKey = `${mode}_inbattle` as const;
      expect(result[inBattleKey].atk.value).toBe(result[mode].atk.value);
      expect(result[inBattleKey]).not.toBe(result[mode]);
    }
  });

  it('克隆后修改战斗桶不影响面板桶', () => {
    const result = makeResult();
    cloneInBattleBuckets(result);

    result.base_inbattle.atk.value = 500;
    expect(result.base.atk.value).toBe(1);
  });

  it('克隆保留 details 引用隔离', () => {
    const result = makeResult();
    result.base.atk.details.push({
      name: '学习力',
      value: 10,
      description: 'test',
    });

    cloneInBattleBuckets(result);
    result.base_inbattle.atk.details.push({
      name: '刻印',
      value: 5,
      description: 'inbattle',
    });

    expect(result.base.atk.details).toHaveLength(1);
    expect(result.base_inbattle.atk.details).toHaveLength(2);
  });
});

describe('deepCloneSingleAttrRecord', () => {
  it('与 cloneInBattleBuckets 配合产生独立副本', () => {
    const source = emptyBucket();
    source.atk.details.push({ name: '学习力', value: 1, description: '' });
    const cloned = deepCloneSingleAttrRecord(source);

    cloned.atk.details.push({ name: '刻印', value: 2, description: '' });

    expect(source.atk.details).toHaveLength(1);
    expect(cloned.atk.details).toHaveLength(2);
  });
});
