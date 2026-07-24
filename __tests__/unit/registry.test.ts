import { describe, it, expect, beforeEach } from 'vitest';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import {
  registerGlobalFixedBonus,
  registerGlobalPickNBonus,
} from '../../src/extra-bonuses/register-global-bonus.js';
import { resolveBonuses } from '../../src/extra-bonuses/resolve.js';

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

describe('BonusRegistry', () => {
  let registry: BonusRegistry;

  beforeEach(() => {
    registry = new BonusRegistry();
  });

  it('global 加成对任意精灵 lookup 均命中', () => {
    registerGlobalFixedBonus(registry, {
      bonusId: 'team-atk-15',
      source: '战队加成',
      description: '战队攻击 +15',
      value: { atk: 15 },
    });

    const descriptors = registry.lookup({ id: 1, level: 100 });
    expect(descriptors).toHaveLength(1);
    expect(descriptors[0].id).toBe('team-atk-15');
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

    expect(registry.lookup({ id: 100, level: 100 })).toHaveLength(1);
    expect(registry.lookup({ id: 999, level: 100 })).toHaveLength(0);
  });

  it('soulmark 加成按 effect_id 命中，无需 petIds', () => {
    registerSoulmarkFixed(registry, 265, 'soulmark-265', (args) => ({
      atk: args[0] ?? 0,
      spDef: args[3] ?? 0,
    }));

    const withSoulmark = registry.lookup({
      id: 999,
      level: 100,
      soulmark: { effect_id: 265, args: [10, 0, 0, 10, 0, 0] },
    });
    expect(withSoulmark).toHaveLength(1);
    expect(withSoulmark[0].mechanism).toEqual({
      kind: 'fixed',
      value: { atk: 10, spDef: 10 },
    });

    expect(registry.lookup({ id: 999, level: 100 })).toHaveLength(0);
  });

  it('重复注册同一 bonusId 时抛错', () => {
    registerGlobalFixedBonus(registry, {
      bonusId: 'dup',
      source: '战队加成',
      description: 'a',
      value: { atk: 1 },
    });

    expect(() =>
      registerGlobalFixedBonus(registry, {
        bonusId: 'dup',
        source: '年费加成',
        description: 'b',
        value: { def: 1 },
      }),
    ).toThrow('加成 dup：已注册，不可重复');
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

    const ids = registry
      .lookup({
        id: 1,
        level: 100,
        soulmark: { effect_id: 1, args: [0, 0, 0, 0, 0, 10] },
      })
      .map((d) => d.id);

    expect(ids).toEqual(['global', 'pet', 'soul']);
  });
});

describe('resolveBonuses', () => {
  it('仅解析 selections 中启用的条目', () => {
    const descriptors = [
      {
        id: 'team-atk-15',
        source: '战队加成' as const,
        scope: 'all' as const,
        priority: 0,
        description: '战队',
        mechanism: { kind: 'fixed' as const, value: { atk: 15 } },
      },
      {
        id: 'vip-year-pick-2',
        source: '年费加成' as const,
        scope: 'all' as const,
        priority: 0,
        description: '年费',
        mechanism: {
          kind: 'pick_n' as const,
          options: [{ atk: 20 }, { def: 20 }],
          pickCount: 1,
        },
      },
    ];

    const resolved = resolveBonuses(descriptors, [
      { id: 'team-atk-15', selection: { kind: 'fixed' } },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].value.atk).toBe(15);
  });

  it('selection id 不在 lookup 结果中时抛错', () => {
    expect(() =>
      resolveBonuses([], [{ id: 'unknown', selection: { kind: 'fixed' } }]),
    ).toThrow('加成 unknown：不在当前精灵可用加成列表中');
  });
});

describe('registerGlobalPickNBonus', () => {
  it('注册年费多选 n 加成并可解析', () => {
    const registry = new BonusRegistry();
    registerGlobalPickNBonus(registry, {
      bonusId: 'vip-year-pick-2',
      source: '年费加成',
      description: '年费多选 2',
      options: [{ atk: 20 }, { def: 20 }, { hp: 30 }],
      pickCount: 2,
    });

    const descriptors = registry.lookup({ id: 1, level: 100 });
    const resolved = resolveBonuses(descriptors, [
      {
        id: 'vip-year-pick-2',
        selection: { kind: 'pick_n', selectedIndices: [0, 2] },
      },
    ]);

    expect(resolved[0].value.atk).toBe(20);
    expect(resolved[0].value.hp).toBe(30);
  });
});
