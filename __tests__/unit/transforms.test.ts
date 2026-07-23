import { describe, it, expect, beforeEach } from 'vitest';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import {
  applyTransforms,
  deepCloneSingleAttrRecord,
} from '../../src/extra-bonuses/transforms/apply.js';
import type { PetAttrCalcResult } from '../../src/types.js';
import type { TransformDescriptor } from '../../src/extra-bonuses/transforms/types.js';
import { calcPetAttr } from '../../src/main.js';

const SIX_ATTR_KEYS = ['atk', 'def', 'spAtk', 'spDef', 'spd', 'hp'] as const;

function makeResult(atk: number, spAtk: number): PetAttrCalcResult {
  return makeResultFromValues({ atk, spAtk });
}

function makeResultFromValues(
  values: Partial<Record<(typeof SIX_ATTR_KEYS)[number], number>>,
): PetAttrCalcResult {
  const makeAttr = (value: number): { value: number; details: [] } => ({
    value,
    details: [],
  });
  const record = Object.fromEntries(
    SIX_ATTR_KEYS.map((key) => [key, makeAttr(values[key] ?? 0)]),
  ) as PetAttrCalcResult['pvp'];

  return {
    base: deepCloneSingleAttrRecord(record),
    pve: deepCloneSingleAttrRecord(record),
    pvp: deepCloneSingleAttrRecord(record),
    base_inbattle: deepCloneSingleAttrRecord(record),
    pve_inbattle: deepCloneSingleAttrRecord(record),
    pvp_inbattle: deepCloneSingleAttrRecord(record),
  };
}

const syncToMaxDescriptor: TransformDescriptor = {
  id: 'test-sync-to-max',
  source: '专属特性',
  scope: 'pvp_inbattle',
  priority: 0,
  description: '攻击与特攻等同于其中较高的一项',
  transform: { kind: 'sync_to_max', stats: ['atk', 'spAtk'] },
};

/** 魂印 2037：战斗中速度等于攻击与特攻中较高的一项 */
const soulmark2037TransformDescriptor: TransformDescriptor = {
  id: 'soulmark-2037-transform',
  source: '专属特性',
  scope: 'pvp_inbattle',
  priority: 0,
  description: '在战斗中自身速度值等于攻击值和特攻值中较高的一项',
  transform: {
    kind: 'sync_to_higher_of',
    sources: ['atk', 'spAtk'],
    targets: ['spd'],
  },
};

describe('applyTransforms sync_to_higher_of', () => {
  it('将速度设为攻击与特攻中的较高值（特攻更高）', () => {
    const result = makeResultFromValues({
      atk: 100,
      spAtk: 150,
      spd: 50,
    });
    applyTransforms(result, [soulmark2037TransformDescriptor]);

    expect(result.pvp_inbattle.spd.value).toBe(150);
    expect(result.pvp_inbattle.atk.value).toBe(100);
    expect(result.pvp_inbattle.spAtk.value).toBe(150);
    expect(result.pvp_inbattle.spd.details).toHaveLength(1);
    expect(result.pvp_inbattle.spd.details[0].value).toBe(100);
  });

  it('将速度设为攻击与特攻中的较高值（攻击更高）', () => {
    const result = makeResultFromValues({
      atk: 180,
      spAtk: 120,
      spd: 80,
    });
    applyTransforms(result, [soulmark2037TransformDescriptor]);

    expect(result.pvp_inbattle.spd.value).toBe(180);
    expect(result.pvp_inbattle.atk.value).toBe(180);
    expect(result.pvp_inbattle.spAtk.value).toBe(120);
    expect(result.pvp_inbattle.spd.details).toHaveLength(1);
    expect(result.pvp_inbattle.spd.details[0].value).toBe(100);
  });

  it('不修改攻击、特攻及其他非 targets 属性', () => {
    const result = makeResultFromValues({
      atk: 80,
      spAtk: 120,
      def: 90,
      spd: 40,
    });
    applyTransforms(result, [soulmark2037TransformDescriptor]);

    expect(result.pvp_inbattle.atk.value).toBe(80);
    expect(result.pvp_inbattle.spAtk.value).toBe(120);
    expect(result.pvp_inbattle.def.value).toBe(90);
  });

  it('速度已达 sources 最高值时不产生 detail', () => {
    const result = makeResultFromValues({
      atk: 100,
      spAtk: 150,
      spd: 150,
    });
    applyTransforms(result, [soulmark2037TransformDescriptor]);

    expect(result.pvp_inbattle.spd.details).toHaveLength(0);
  });

  it('不修改 pvp 面板桶', () => {
    const result = makeResultFromValues({
      atk: 100,
      spAtk: 150,
      spd: 50,
    });
    applyTransforms(result, [soulmark2037TransformDescriptor]);

    expect(result.pvp.spd.value).toBe(50);
  });
});

describe('applyTransforms sync_to_max', () => {
  it('将较低项提升至与较高项相同', () => {
    const result = makeResult(100, 150);
    applyTransforms(result, [syncToMaxDescriptor]);

    expect(result.pvp_inbattle.atk.value).toBe(150);
    expect(result.pvp_inbattle.spAtk.value).toBe(150);
    expect(result.pvp_inbattle.atk.details).toHaveLength(1);
    expect(result.pvp_inbattle.atk.details[0].value).toBe(50);
    expect(result.pvp_inbattle.spAtk.details).toHaveLength(0);
  });

  it('已相等时不产生多余 detail', () => {
    const result = makeResult(120, 120);
    applyTransforms(result, [syncToMaxDescriptor]);

    expect(result.pvp_inbattle.atk.details).toHaveLength(0);
    expect(result.pvp_inbattle.spAtk.details).toHaveLength(0);
  });

  it('不修改 pvp 面板桶', () => {
    const result = makeResult(100, 150);
    applyTransforms(result, [syncToMaxDescriptor]);

    expect(result.pvp.atk.value).toBe(100);
    expect(result.pvp.spAtk.value).toBe(150);
  });

  it('base_inbattle scope 仅修改 base_inbattle 桶', () => {
    const descriptor: TransformDescriptor = {
      ...syncToMaxDescriptor,
      id: 'test-sync-to-max-base',
      scope: 'base_inbattle',
    };
    const result = makeResult(100, 150);
    applyTransforms(result, [descriptor]);

    expect(result.base_inbattle.atk.value).toBe(150);
    expect(result.base_inbattle.spAtk.value).toBe(150);
    expect(result.base.atk.value).toBe(100);
    expect(result.pvp_inbattle.atk.value).toBe(100);
  });

  it('pve_inbattle scope 仅修改 pve_inbattle 桶', () => {
    const descriptor: TransformDescriptor = {
      ...syncToMaxDescriptor,
      id: 'test-sync-to-max-pve',
      scope: 'pve_inbattle',
    };
    const result = makeResult(100, 150);
    applyTransforms(result, [descriptor]);

    expect(result.pve_inbattle.atk.value).toBe(150);
    expect(result.pve_inbattle.spAtk.value).toBe(150);
    expect(result.pve.atk.value).toBe(100);
    expect(result.pvp_inbattle.atk.value).toBe(100);
  });
});

describe('BonusRegistry lookupTransforms', () => {
  let registry: BonusRegistry;

  beforeEach(() => {
    registry = new BonusRegistry();
  });

  it('魂印 effect_id 匹配时返回变换描述', () => {
    registry.registerSoulmarkTransform({
      effectId: 247,
      descriptorId: 'soulmark-247-transform',
      buildDescriptor() {
        return syncToMaxDescriptor;
      },
    });

    const transforms = registry.lookupTransforms({
      petId: 2221,
      level: 100,
      soulmark: { effect_id: 247, args: [] },
    });

    expect(transforms).toHaveLength(1);
    expect(transforms[0].transform.kind).toBe('sync_to_max');
  });

  it('无 soulmark 时返回空数组', () => {
    registry.registerSoulmarkTransform({
      effectId: 247,
      descriptorId: 'soulmark-247-transform',
      buildDescriptor() {
        return syncToMaxDescriptor;
      },
    });

    expect(registry.lookupTransforms({ petId: 1, level: 100 })).toEqual([]);
  });

  it('重复注册 descriptorId 时抛错', () => {
    registry.registerSoulmarkTransform({
      effectId: 247,
      descriptorId: 'dup-transform',
      buildDescriptor() {
        return syncToMaxDescriptor;
      },
    });

    expect(() =>
      registry.registerSoulmarkTransform({
        effectId: 999,
        descriptorId: 'dup-transform',
        buildDescriptor() {
          return syncToMaxDescriptor;
        },
      }),
    ).toThrow('加成 dup-transform：已注册，不可重复');
  });
});

const zeroFlatBonusValue = {
  atk: 0,
  def: 0,
  spAtk: 0,
  spDef: 0,
  spd: 0,
  hp: 0,
  atkPercent: 0,
  defPercent: 0,
  spAtkPercent: 0,
  spDefPercent: 0,
  spdPercent: 0,
  hpPercent: 0,
};

describe('calcPetAttr inbattle buckets', () => {
  const emptyNature = {
    atkPercent: 1,
    defPercent: 1,
    spAtkPercent: 1,
    spDefPercent: 1,
    spdPercent: 1,
    hpPercent: 1,
  };

  const calcOptions = {
    id: 1,
    level: 100,
    baseStats: {
      atk: 100,
      def: 100,
      spAtk: 100,
      spDef: 100,
      spd: 100,
      hp: 100,
    },
    dv: 31,
    natureBonus: emptyNature,
    evs: {
      atk: 0,
      def: 0,
      spAtk: 0,
      spDef: 0,
      spd: 0,
      hp: 0,
    },
    mintmarks: [] as const,
    bonusRegistry: new BonusRegistry(),
    bonusSelections: [] as const,
    extraBonuses: [] as const,
  };

  it('魂印 247：战斗中攻击与特攻等同于其中较高的一项，面板 pvp 保持不变', () => {
    const registry = new BonusRegistry();
    registry.registerSoulmarkTransform({
      effectId: 247,
      descriptorId: 'soulmark-247-transform',
      buildDescriptor() {
        return syncToMaxDescriptor;
      },
    });

    const result = calcPetAttr({
      id: 2221,
      level: 100,
      baseStats: {
        atk: 120,
        def: 80,
        spAtk: 100,
        spDef: 80,
        spd: 90,
        hp: 100,
      },
      dv: 31,
      natureBonus: emptyNature,
      evs: {
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 0,
        hp: 0,
      },
      mintmarks: [],
      soulmark: { effect_id: 247, args: [] },
      bonusRegistry: registry,
      bonusSelections: [],
      extraBonuses: [
        {
          scope: 'pvp',
          priority: 0,
          source: '专属特性',
          value: { ...zeroFlatBonusValue, atk: 200, spAtk: 150 },
        },
      ],
    });

    // pve/pvp 从 base 克隆后再叠作用域加成
    expect(result.pvp.atk.value).toBe(result.base.atk.value + 200);
    expect(result.pvp.spAtk.value).toBe(result.base.spAtk.value + 150);
    expect(result.pvp_inbattle.atk.value).toBe(result.pvp_inbattle.spAtk.value);
    expect(result.pvp_inbattle.atk.value).toBe(result.pvp.atk.value);
  });

  it('无变换时三个战斗桶分别等于对应面板桶', () => {
    const result = calcPetAttr({
      ...calcOptions,
      extraBonuses: [
        {
          scope: 'pve',
          priority: 0,
          source: '特殊加成',
          value: { ...zeroFlatBonusValue, atk: 10 },
        },
        {
          scope: 'pvp',
          priority: 0,
          source: '特殊加成',
          value: { ...zeroFlatBonusValue, spAtk: 20 },
        },
      ],
    });

    for (const key of SIX_ATTR_KEYS) {
      expect(result.base_inbattle[key].value).toBe(result.base[key].value);
      expect(result.pve_inbattle[key].value).toBe(result.pve[key].value);
      expect(result.pvp_inbattle[key].value).toBe(result.pvp[key].value);
    }
    expect(result.pve.atk.value).toBe(result.base.atk.value + 10);
    expect(result.pvp.spAtk.value).toBe(result.base.spAtk.value + 20);
  });

  it('无魂印时 pvp_inbattle 与 pvp 数值相同', () => {
    const result = calcPetAttr(calcOptions);

    for (const key of SIX_ATTR_KEYS) {
      expect(result.pvp_inbattle[key].value).toBe(result.pvp[key].value);
    }
  });
});
