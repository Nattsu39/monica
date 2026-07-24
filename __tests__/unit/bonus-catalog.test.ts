import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildBonusContext,
  defaultSelectionEntryFor,
  defaultSelectionFor,
  listAvailableBonuses,
} from '../../src/extra-bonuses/catalog.js';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import {
  registerGlobalFixedBonus,
  registerGlobalPickNBonus,
} from '../../src/extra-bonuses/register-global-bonus.js';
import type { BonusDescriptor } from '../../src/extra-bonuses/types.js';
import { partitionDescriptorsByMechanism } from '../../src/extra-bonuses/resolve.js';

function registerSoulmarkFixed(
  registry: BonusRegistry,
  effectId: number,
  bonusId: string,
  valueFromArgs: (args: readonly number[]) => Record<string, number>,
): void {
  registry.registerSoulmarkBonus({
    effectId,
    descriptorId: bonusId,
    buildDescriptor(soulmark) {
      return {
        id: bonusId,
        source: '专属特性',
        scope: 'all',
        priority: 0,
        description: bonusId,
        mechanism: { kind: 'fixed', value: valueFromArgs(soulmark.args) },
      };
    },
  });
}

const fixedDescriptor: BonusDescriptor = {
  id: 'fixed-bonus',
  source: '战队加成',
  scope: 'all',
  priority: 0,
  description: 'fixed',
  mechanism: { kind: 'fixed', value: { atk: 10 } },
};

const pickNDescriptor: BonusDescriptor = {
  id: 'pick-n-bonus',
  source: '年费加成',
  scope: 'all',
  priority: 0,
  description: 'pick_n',
  mechanism: {
    kind: 'pick_n',
    options: [{ atk: 20 }, { def: 20 }],
    pickCount: 1,
  },
};

const poolDescriptor: BonusDescriptor = {
  id: 'pool-bonus',
  source: '战队加成',
  scope: 'base',
  priority: 0,
  description: 'pool',
  mechanism: {
    kind: 'pool',
    total: 15,
    bounds: { atk: { min: 0, max: 15 } },
  },
};

const transferDescriptor: BonusDescriptor = {
  id: 'transfer-bonus',
  source: '专属特性',
  scope: 'base',
  priority: 0,
  description: 'transfer',
  mechanism: {
    kind: 'transfer_sources',
    spec: {
      fromStat: 'spd',
      sourceNames: ['学习力', '刻印'],
      toStat: 'hp',
      asSource: '专属特性',
      mode: 'overwrite',
    },
  },
};

describe('buildBonusContext', () => {
  it('从 PetAttrCalcOptions 字段构建 PetBonusContext', () => {
    const soulmark = { effect_id: 265, args: [10, 0, 0, 10, 0, 0] as number[] };
    expect(buildBonusContext({ id: 2234, level: 100, soulmark })).toEqual({
      id: 2234,
      level: 100,
      soulmark,
    });
  });
});

describe('listAvailableBonuses', () => {
  let registry: BonusRegistry;

  beforeEach(() => {
    registry = new BonusRegistry();
  });

  it('global 加成对任意精灵均出现在 selectable 中', () => {
    registerGlobalFixedBonus(registry, {
      bonusId: 'team-atk-15',
      source: '战队加成',
      description: '战队攻击 +15',
      value: { atk: 15 },
    });

    const available = listAvailableBonuses({
      id: 1,
      level: 100,
      bonusRegistry: registry,
    });

    expect(available.selectable.map((d) => d.id)).toEqual(['team-atk-15']);
    expect(available.transforms).toEqual([]);
  });

  it('pet 加成仅命中 petIds 内的精灵', () => {
    registry.registerPetBonus({
      petIds: [100, 101],
      descriptor: {
        id: 'pet-100-bonus',
        source: '神谕觉醒',
        scope: 'all',
        priority: 0,
        description: '专属',
        mechanism: { kind: 'fixed', value: { atk: 5 } },
      },
    });

    expect(
      listAvailableBonuses({ id: 100, level: 100, bonusRegistry: registry })
        .selectable,
    ).toHaveLength(1);
    expect(
      listAvailableBonuses({ id: 999, level: 100, bonusRegistry: registry })
        .selectable,
    ).toHaveLength(0);
  });

  it('soulmark 加成按 effect_id 命中', () => {
    registerSoulmarkFixed(registry, 265, 'soulmark-265', (args) => ({
      atk: args[0] ?? 0,
      spDef: args[3] ?? 0,
    }));

    const available = listAvailableBonuses({
      id: 999,
      level: 100,
      soulmark: { effect_id: 265, args: [10, 0, 0, 10, 0, 0] },
      bonusRegistry: registry,
    });

    expect(available.selectable).toHaveLength(1);
    expect(available.selectable[0].id).toBe('soulmark-265');
  });

  it('static / transfer 分区与 partitionDescriptorsByMechanism 一致', () => {
    registerGlobalFixedBonus(registry, {
      bonusId: 'global-fixed',
      source: '战队加成',
      description: 'fixed',
      value: { atk: 1 },
    });
    registry.registerSoulmarkBonus({
      effectId: 697,
      descriptorId: 'soulmark-697-transfer',
      buildDescriptor() {
        return transferDescriptor;
      },
    });

    const available = listAvailableBonuses({
      id: 1,
      level: 100,
      soulmark: { effect_id: 697, args: [] },
      bonusRegistry: registry,
    });
    const partitioned = partitionDescriptorsByMechanism(available.selectable);

    expect(available.static.map((d) => d.id)).toEqual(
      partitioned.static.map((d) => d.id),
    );
    expect(available.transfer.map((d) => d.id)).toEqual(
      partitioned.transfer.map((d) => d.id),
    );
    expect(available.transfer[0].id).toBe('transfer-bonus');
  });

  it('魂印 transform 出现在 transforms 且不在 selectable 中', () => {
    registry.registerSoulmarkTransform({
      effectId: 2037,
      descriptorId: 'soulmark-2037-transform',
      buildDescriptor() {
        return {
          id: 'soulmark-2037-transform',
          source: '专属特性',
          scope: 'pvp_inbattle',
          priority: 0,
          description: '速度等于攻特攻较高项',
          transform: {
            kind: 'sync_to_higher_of',
            sources: ['atk', 'spAtk'],
            targets: ['spd'],
          },
        };
      },
    });
    registerGlobalFixedBonus(registry, {
      bonusId: 'team-atk-15',
      source: '战队加成',
      description: '战队',
      value: { atk: 15 },
    });

    const available = listAvailableBonuses({
      id: 1,
      level: 100,
      soulmark: { effect_id: 2037, args: [] },
      bonusRegistry: registry,
    });

    expect(available.transforms).toHaveLength(1);
    expect(available.transforms[0].id).toBe('soulmark-2037-transform');
    expect(
      available.selectable.some((d) => d.id === 'soulmark-2037-transform'),
    ).toBe(false);
  });

  it('lookup 顺序为 global → pet → soulmark', () => {
    registerGlobalFixedBonus(registry, {
      bonusId: 'global',
      source: '战队加成',
      description: 'g',
      value: { atk: 1 },
    });
    registry.registerPetBonus({
      petIds: [1],
      descriptor: {
        id: 'pet',
        source: '神谕觉醒',
        scope: 'all',
        priority: 0,
        description: 'p',
        mechanism: { kind: 'fixed', value: { def: 1 } },
      },
    });
    registerSoulmarkFixed(registry, 1, 'soul', () => ({ hp: 10 }));

    const ids = listAvailableBonuses({
      id: 1,
      level: 100,
      soulmark: { effect_id: 1, args: [0, 0, 0, 0, 0, 10] },
      bonusRegistry: registry,
    }).selectable.map((d) => d.id);

    expect(ids).toEqual(['global', 'pet', 'soul']);
  });
});

describe('defaultSelectionFor', () => {
  it('fixed 机制返回 { kind: fixed }', () => {
    expect(defaultSelectionFor(fixedDescriptor)).toEqual({ kind: 'fixed' });
  });

  it('transfer_sources 机制返回 { kind: transfer_sources }', () => {
    expect(defaultSelectionFor(transferDescriptor)).toEqual({
      kind: 'transfer_sources',
    });
  });

  it('pick_n 机制返回空 selectedIndices', () => {
    expect(defaultSelectionFor(pickNDescriptor)).toEqual({
      kind: 'pick_n',
      selectedIndices: [],
    });
  });

  it('pool 机制返回空 allocation', () => {
    expect(defaultSelectionFor(poolDescriptor)).toEqual({
      kind: 'pool',
      allocation: {},
    });
  });
});

describe('defaultSelectionEntryFor', () => {
  it('id 与 descriptor 匹配且 selection 为默认值', () => {
    expect(defaultSelectionEntryFor(fixedDescriptor)).toEqual({
      id: 'fixed-bonus',
      selection: { kind: 'fixed' },
    });
  });

  it('pick_n descriptor 生成空选 entry', () => {
    registerGlobalPickNBonus(new BonusRegistry(), {
      bonusId: 'vip-year-pick-2',
      source: '年费加成',
      description: '年费多选 2',
      options: [{ atk: 20 }, { def: 20 }],
      pickCount: 1,
    });

    const entry = defaultSelectionEntryFor(pickNDescriptor);
    expect(entry.id).toBe('pick-n-bonus');
    expect(entry.selection).toEqual({
      kind: 'pick_n',
      selectedIndices: [],
    });
  });
});
