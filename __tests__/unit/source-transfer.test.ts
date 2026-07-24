import { describe, expect, it } from 'vitest';
import {
  clearSourceSlot,
  computeEvDetailValue,
  computeMintmarkDetailSum,
  computeTransferAmount,
  type SourceTransferSpec,
} from '../../src/extra-bonuses/derive/source-transfer.js';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import {
  partitionDescriptorsByMechanism,
  resolveTransferBonus,
  resolveTransferBonuses,
} from '../../src/extra-bonuses/resolve.js';
import type { BonusDescriptor } from '../../src/extra-bonuses/types.js';
import { calcPetAttr } from '../../src/main.js';
import type { SingleAttr, SixAttributes } from '../../src/types.js';

const spdToHpSoulmarkSpec: SourceTransferSpec = {
  fromStat: 'spd',
  sourceNames: ['学习力', '刻印'],
  toStat: 'hp',
  asSource: '专属特性',
  mode: 'additive',
};

function makeAttr(
  value: number,
  details: SingleAttr['details'] = [],
): SingleAttr {
  return { value, details };
}

function makeBaseAttrs(
  overrides: Partial<Record<keyof SixAttributes, SingleAttr>> = {},
): Record<keyof SixAttributes, SingleAttr> {
  const empty = (): SingleAttr => ({ value: 0, details: [] });
  return {
    atk: empty(),
    def: empty(),
    spAtk: empty(),
    spDef: empty(),
    spd: empty(),
    hp: empty(),
    ...overrides,
  };
}

const transferDescriptor: BonusDescriptor = {
  id: 'test-transfer',
  source: '专属特性',
  scope: 'base',
  priority: 20,
  description: '测试来源搬运',
  mechanism: {
    kind: 'transfer_sources',
    spec: spdToHpSoulmarkSpec,
  },
};

const emptyNature = {
  atkPercent: 1,
  defPercent: 1,
  spAtkPercent: 1,
  spDefPercent: 1,
  spdPercent: 1.1,
  hpPercent: 1,
};

describe('computeTransferAmount', () => {
  it('汇总 fromStat 上指定来源的明细值', () => {
    const baseAttrs = makeBaseAttrs({
      spd: makeAttr(200, [
        { name: '学习力', value: 70, description: '学习力 255÷4' },
        { name: '刻印', value: 86, description: '1号刻印' },
        { name: '战队加成', value: 10, description: '战队' },
      ]),
    });

    expect(computeTransferAmount(baseAttrs, spdToHpSoulmarkSpec)).toBe(156);
  });

  it('无匹配明细时返回 0', () => {
    const baseAttrs = makeBaseAttrs({
      spd: makeAttr(100, [
        { name: '战队加成', value: 10, description: '战队' },
      ]),
    });

    expect(computeTransferAmount(baseAttrs, spdToHpSoulmarkSpec)).toBe(0);
  });
});

describe('clearSourceSlot', () => {
  it('移除目标属性上 asSource 明细并回退 value', () => {
    const baseAttrs = makeBaseAttrs({
      hp: makeAttr(500, [
        { name: '学习力', value: 63, description: '学习力' },
        { name: '专属特性', value: 100, description: '旧魂印' },
      ]),
    });

    clearSourceSlot(baseAttrs, {
      ...spdToHpSoulmarkSpec,
      mode: 'overwrite',
    });

    expect(baseAttrs.hp.value).toBe(400);
    expect(baseAttrs.hp.details.some((d) => d.name === '专属特性')).toBe(false);
    expect(baseAttrs.hp.details).toHaveLength(1);
  });
});

describe('computeEvDetailValue / computeMintmarkDetailSum', () => {
  it('与非 hp 属性学习力明细公式一致', () => {
    const evs: SixAttributes = {
      atk: 0,
      def: 0,
      spAtk: 0,
      spDef: 0,
      spd: 255,
      hp: 0,
    };
    const neutralNature = { ...emptyNature, spdPercent: 1 };
    expect(computeEvDetailValue('spd', 100, evs, neutralNature)).toBe(63);
  });

  it('汇总刻印固定值', () => {
    expect(
      computeMintmarkDetailSum('spd', [
        { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 50, hp: 0 },
        { atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 36, hp: 0 },
      ]),
    ).toBe(86);
  });
});

describe('resolveTransferBonus', () => {
  it('additive 模式产出目标属性 ExtraBonus', () => {
    const baseAttrs = makeBaseAttrs({
      spd: makeAttr(156, [
        { name: '学习力', value: 70, description: '' },
        { name: '刻印', value: 86, description: '' },
      ]),
    });

    const bonus = resolveTransferBonus(
      transferDescriptor,
      { kind: 'transfer_sources' },
      baseAttrs,
    );

    expect(bonus.source).toBe('专属特性');
    expect(bonus.value.hp).toBe(156);
    expect(bonus.value.spd).toBe(0);
  });

  it('replace_slot 模式先清除已有专属特性槽', () => {
    const baseAttrs = makeBaseAttrs({
      spd: makeAttr(156, [
        { name: '学习力', value: 70, description: '' },
        { name: '刻印', value: 86, description: '' },
      ]),
      hp: makeAttr(300, [{ name: '专属特性', value: 50, description: '旧值' }]),
    });

    const bonus = resolveTransferBonus(
      {
        ...transferDescriptor,
        mechanism: {
          kind: 'transfer_sources',
          spec: { ...spdToHpSoulmarkSpec, mode: 'overwrite' },
        },
      },
      { kind: 'transfer_sources' },
      baseAttrs,
    );

    expect(bonus.value.hp).toBe(156);
    expect(baseAttrs.hp.value).toBe(250);
    expect(baseAttrs.hp.details.some((d) => d.name === '专属特性')).toBe(false);
  });
});

describe('partitionDescriptorsByMechanism', () => {
  it('拆分 static 与 transfer 描述', () => {
    const fixed: BonusDescriptor = {
      id: 'fixed',
      source: '专属特性',
      scope: 'base',
      priority: 0,
      description: '',
      mechanism: { kind: 'fixed', value: { atk: 1 } },
    };

    const partitioned = partitionDescriptorsByMechanism([
      fixed,
      transferDescriptor,
    ]);

    expect(partitioned.static).toHaveLength(1);
    expect(partitioned.transfer).toHaveLength(1);
  });
});

describe('calcPetAttr transfer_sources integration', () => {
  const baseStats = {
    atk: 130,
    def: 100,
    spAtk: 80,
    spDef: 100,
    spd: 150,
    hp: 130,
  };

  it('魂印 697：hp 获得 spd 学习力+刻印搬运量', () => {
    const registry = new BonusRegistry();
    registry.registerSoulmarkBonus({
      effectId: 697,
      descriptorId: 'soulmark-697-transfer',
      buildDescriptor() {
        return transferDescriptor;
      },
    });

    const result = calcPetAttr({
      id: 2988,
      level: 100,
      baseStats,
      dv: 31,
      natureBonus: emptyNature,
      evs: {
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 255,
        hp: 255,
      },
      mintmarks: [
        {
          atk: 0,
          def: 0,
          spAtk: 0,
          spDef: 0,
          spd: 86,
          hp: 0,
        },
      ],
      soulmark: { effect_id: 697, args: [4, 5, 50, 0, 0, 0, 0, 0] },
      bonusRegistry: registry,
      bonusSelections: [
        { id: 'test-transfer', selection: { kind: 'transfer_sources' } },
      ],
      extraBonuses: [],
    });

    const spdEvDetail = result.base.spd.details.find(
      (d) => d.name === '学习力',
    );
    const spdMintDetail = result.base.spd.details.find(
      (d) => d.name === '刻印',
    );
    const hpSoulmarkDetail = result.base.hp.details.find(
      (d) => d.name === '专属特性',
    );

    expect(spdEvDetail?.value).toBe(70);
    expect(spdMintDetail?.value).toBe(86);
    expect(hpSoulmarkDetail?.value).toBe(156);
  });

  it('scope=pvp 时仅 pvp 桶获得搬运加成', () => {
    const registry = new BonusRegistry();
    registry.registerSoulmarkBonus({
      effectId: 9999,
      descriptorId: 'soulmark-9999-transfer',
      buildDescriptor() {
        return {
          ...transferDescriptor,
          id: 'pvp-transfer',
          scope: 'pvp',
        };
      },
    });

    const result = calcPetAttr({
      id: 1,
      level: 100,
      baseStats,
      dv: 31,
      natureBonus: emptyNature,
      evs: {
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 255,
        hp: 0,
      },
      mintmarks: [
        {
          atk: 0,
          def: 0,
          spAtk: 0,
          spDef: 0,
          spd: 86,
          hp: 0,
        },
      ],
      soulmark: { effect_id: 9999, args: [] },
      bonusRegistry: registry,
      bonusSelections: [
        { id: 'pvp-transfer', selection: { kind: 'transfer_sources' } },
      ],
      extraBonuses: [],
    });

    expect(result.base.hp.details.some((d) => d.name === '专属特性')).toBe(
      false,
    );
    expect(result.pvp.hp.details.some((d) => d.name === '专属特性')).toBe(true);
  });

  it('与 fixed 魂印 additive 共存时累加', () => {
    const registry = new BonusRegistry();
    registry.registerSoulmarkBonus({
      effectId: 8888,
      descriptorId: 'soulmark-8888-fixed',
      buildDescriptor() {
        return {
          id: 'fixed-hp',
          source: '专属特性',
          scope: 'base',
          priority: 20,
          description: '固定体力',
          mechanism: { kind: 'fixed', value: { hp: 50 } },
        };
      },
    });
    registry.registerSoulmarkBonus({
      effectId: 8888,
      descriptorId: 'soulmark-8888-transfer',
      buildDescriptor() {
        return {
          ...transferDescriptor,
          id: 'transfer-hp',
        };
      },
    });

    const result = calcPetAttr({
      id: 1,
      level: 100,
      baseStats,
      dv: 31,
      natureBonus: emptyNature,
      evs: {
        atk: 0,
        def: 0,
        spAtk: 0,
        spDef: 0,
        spd: 255,
        hp: 0,
      },
      mintmarks: [
        {
          atk: 0,
          def: 0,
          spAtk: 0,
          spDef: 0,
          spd: 86,
          hp: 0,
        },
      ],
      soulmark: { effect_id: 8888, args: [] },
      bonusRegistry: registry,
      bonusSelections: [
        { id: 'fixed-hp', selection: { kind: 'fixed' } },
        { id: 'transfer-hp', selection: { kind: 'transfer_sources' } },
      ],
      extraBonuses: [],
    });

    const soulmarkDetails = result.base.hp.details.filter(
      (d) => d.name === '专属特性',
    );
    const soulmarkSum = soulmarkDetails.reduce((sum, d) => sum + d.value, 0);
    expect(soulmarkSum).toBe(206);
  });
});

describe('resolveTransferBonuses', () => {
  it('忽略不在 transfer descriptors 中的 selection', () => {
    const baseAttrs = makeBaseAttrs({
      spd: makeAttr(70, [{ name: '学习力', value: 70, description: '' }]),
    });

    const bonuses = resolveTransferBonuses(
      [transferDescriptor],
      [
        { id: 'missing', selection: { kind: 'transfer_sources' } },
        { id: 'test-transfer', selection: { kind: 'transfer_sources' } },
      ],
      baseAttrs,
    );

    expect(bonuses).toHaveLength(1);
    expect(bonuses[0].value.hp).toBe(70);
  });
});
