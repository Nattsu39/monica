import { describe, it, expect, beforeEach } from 'vitest';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import { registerGlobalFixedBonus } from '../../src/extra-bonuses/register-global-bonus.js';
import type { AttrDetail, ExtraBonus, SingleAttr } from '../../src/types.js';
import {
  calcBaseSixAttributes,
  calcNonHpStat,
  calcPetAttr,
  defaultSelectionEntryFor,
  listAvailableBonuses,
} from '../../src/main.js';

function registerSoulmark265(registry: BonusRegistry): void {
  registry.registerSoulmarkBonus({
    effectId: 265,
    descriptorId: 'soulmark-265',
    buildDescriptor(soulmark) {
      const [atk = 0, , , spDef = 0] = soulmark.args;
      return {
        id: 'soulmark-265',
        source: '专属特性',
        scope: 'all',
        priority: 0,
        description: '攻击+10，特防+10',
        mechanism: { kind: 'fixed', value: { atk, spDef } },
      };
    },
  });
}

const emptyNature = {
  atkPercent: 1,
  defPercent: 1,
  spAtkPercent: 1,
  spDefPercent: 1,
  spdPercent: 1,
  hpPercent: 1,
};

const emptyEvs = {
  atk: 0,
  def: 0,
  spAtk: 0,
  spDef: 0,
  spd: 0,
  hp: 0,
};

const baseStats = {
  atk: 100,
  def: 100,
  spAtk: 100,
  spDef: 100,
  spd: 100,
  hp: 100,
};

describe('calcPetAttr with BonusRegistry', () => {
  let registry: BonusRegistry;

  beforeEach(() => {
    registry = new BonusRegistry();
    registerSoulmark265(registry);
    registerGlobalFixedBonus(registry, {
      bonusId: 'team-atk-15',
      source: '战队加成',
      description: '战队攻击 +15',
      value: { atk: 15 },
    });
  });

  it('通过 registry lookup 与 bonusSelections 应用魂印和战队加成', () => {
    const result = calcPetAttr({
      id: 2234,
      level: 100,
      baseStats,
      iv: 31,
      natureBonus: emptyNature,
      evs: emptyEvs,
      mintmarks: [],
      soulmark: { effect_id: 265, args: [10, 0, 0, 10, 0, 0] },
      bonusRegistry: registry,
      bonusSelections: [
        { id: 'soulmark-265', selection: { kind: 'fixed' } },
        { id: 'team-atk-15', selection: { kind: 'fixed' } },
      ],
      extraBonuses: [],
    });

    expect(result.base.atk.value).toBe(236 + 10 + 15);
    expect(result.base.spDef.value).toBe(236 + 10);
    expect(result.base.atk.details.some((d) => d.name === '战队加成')).toBe(
      true,
    );
    expect(result.base.atk.details.some((d) => d.name === '专属特性')).toBe(
      true,
    );
  });

  it('通过 listAvailableBonuses 与 defaultSelectionEntryFor 构建 selections', () => {
    const soulmark = { effect_id: 265, args: [10, 0, 0, 10, 0, 0] as number[] };
    const available = listAvailableBonuses({
      id: 2234,
      level: 100,
      soulmark,
      bonusRegistry: registry,
    });
    const bonusSelections = available.selectable.map(defaultSelectionEntryFor);

    const result = calcPetAttr({
      id: 2234,
      level: 100,
      baseStats,
      iv: 31,
      natureBonus: emptyNature,
      evs: emptyEvs,
      mintmarks: [],
      soulmark,
      bonusRegistry: registry,
      bonusSelections,
      extraBonuses: [],
    });

    expect(result.base.atk.value).toBe(236 + 10 + 15);
    expect(result.base.spDef.value).toBe(236 + 10);
  });

  it('传入 awakenBaseStats 时用其计算基础值，并将与 baseStats 的差值记入神谕觉醒', () => {
    const awakenBaseStats = {
      ...baseStats,
      atk: 110,
      hp: 110,
    };
    const result = calcPetAttr({
      id: 1,
      level: 100,
      baseStats,
      awakenBaseStats,
      iv: 31,
      natureBonus: emptyNature,
      evs: emptyEvs,
      mintmarks: [],
      bonusRegistry: registry,
      bonusSelections: [],
      extraBonuses: [],
    });

    const normalAttrs = calcBaseSixAttributes(
      100,
      baseStats,
      emptyEvs,
      31,
      emptyNature,
    );
    const awakenAttrs = calcBaseSixAttributes(
      100,
      awakenBaseStats,
      emptyEvs,
      31,
      emptyNature,
    );

    expect(result.base.atk.value).toBe(awakenAttrs.atk.value);
    expect(result.base.hp.value).toBe(awakenAttrs.hp.value);
    expect(result.base.def.value).toBe(normalAttrs.def.value);

    const atkAwakenDetail = result.base.atk.details.find(
      (d) => d.name === '神谕觉醒',
    );
    expect(atkAwakenDetail).toBeDefined();
    expect(atkAwakenDetail!.value).toBe(
      awakenAttrs.atk.value - normalAttrs.atk.value,
    );

    const hpAwakenDetail = result.base.hp.details.find(
      (d) => d.name === '神谕觉醒',
    );
    expect(hpAwakenDetail).toBeDefined();
    expect(hpAwakenDetail!.value).toBe(
      awakenAttrs.hp.value - normalAttrs.hp.value,
    );

    expect(result.base.def.details.some((d) => d.name === '神谕觉醒')).toBe(
      false,
    );
  });

  it('所有加成明细 value 均为整数', () => {
    const soulmark = { effect_id: 265, args: [10, 0, 0, 10, 0, 0] as number[] };
    const available = listAvailableBonuses({
      id: 2234,
      level: 100,
      soulmark,
      bonusRegistry: registry,
    });
    const result = calcPetAttr({
      id: 2234,
      level: 100,
      baseStats,
      iv: 31,
      natureBonus: emptyNature,
      evs: { atk: 80, def: 100, hp: 230, spAtk: 0, spDef: 100, spd: 0 },
      mintmarks: [{ atk: 0, def: 50, spAtk: 0, spDef: 0, spd: 0, hp: 100 }],
      soulmark,
      bonusRegistry: registry,
      bonusSelections: available.selectable.map(defaultSelectionEntryFor),
      extraBonuses: [],
    });

    for (const bucket of [
      result.base,
      result.pve,
      result.pvp,
      result.base_inbattle,
      result.pve_inbattle,
      result.pvp_inbattle,
    ]) {
      for (const stat of Object.values(bucket)) {
        for (const detail of stat.details) {
          expect(detail.value).toBe(Math.floor(detail.value));
        }
      }
    }
  });
});

const zeroBonusValue = {
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

function makeHpPercentBonus(
  source: ExtraBonus['source'],
  hpPercent: number,
  description: string,
  priority: number,
): ExtraBonus {
  return {
    scope: 'base',
    priority,
    source,
    description,
    value: { ...zeroBonusValue, hpPercent },
  };
}

function detailKey(detail: AttrDetail): string {
  return `${detail.name}:${detail.percent ?? ''}:${detail.description}`;
}

function percentDetails(stat: SingleAttr): AttrDetail[] {
  return stat.details.filter((detail) => detail.percent !== undefined);
}

describe('加成明细整数与百分比', () => {
  it('学习力明细 value 为 Math.floor 后的整数', () => {
    const atk = calcNonHpStat(100, 130, 80, 31, 1.1);
    const evDetail = atk.details.find((d) => d.name === '学习力');
    expect(evDetail).toBeDefined();
    expect(evDetail!.value).toBe(Math.floor((80 / 4) * (100 / 100) * 1.1));
    expect(evDetail!.percent).toBeUndefined();

    const attrs = calcBaseSixAttributes(
      100,
      { atk: 130, def: 106, hp: 163, spAtk: 75, spDef: 106, spd: 120 },
      { atk: 80, def: 100, hp: 230, spAtk: 0, spDef: 100, spd: 0 },
      31,
      {
        atkPercent: 1.1,
        defPercent: 1,
        hpPercent: 1,
        spAtkPercent: 0.9,
        spDefPercent: 1,
        spdPercent: 1,
      },
    );
    const hpEv = attrs.hp.details.find((d) => d.name === '学习力');
    expect(hpEv!.value).toBe(Math.floor((230 / 4) * (100 / 100)));
  });

  it('百分比加成明细写入 percent 且 value 为整数', () => {
    const percentBonuses = [
      makeHpPercentBonus('装扮加成', 7, '装扮+7%', 1),
      makeHpPercentBonus('专属特性', 20, '魂印+20%', 2),
    ];
    const result = calcPetAttr({
      id: 3022,
      level: 100,
      baseStats: {
        atk: 130,
        def: 106,
        hp: 163,
        spAtk: 75,
        spDef: 106,
        spd: 120,
      },
      iv: 31,
      natureBonus: emptyNature,
      evs: { atk: 0, def: 0, hp: 230, spAtk: 0, spDef: 0, spd: 0 },
      mintmarks: [],
      bonusSelections: [],
      extraBonuses: percentBonuses,
    });

    const hpPercentDetails = percentDetails(result.base.hp);
    expect(hpPercentDetails).toHaveLength(2);
    for (const detail of hpPercentDetails) {
      expect(detail.value).toBe(Math.floor(detail.value));
      expect(detail.percent).toBeGreaterThan(0);
    }
    expect(hpPercentDetails[0]).toMatchObject({
      name: '装扮加成',
      percent: 7,
      value: expect.any(Number),
    });
    expect(hpPercentDetails[1]).toMatchObject({
      name: '专属特性',
      percent: 20,
      value: expect.any(Number),
    });
  });

  it('多个百分比加成逐个移除时明细与面板值保持一致', () => {
    const percentBonuses = [
      makeHpPercentBonus('装扮加成', 7, '装扮+7%', 1),
      makeHpPercentBonus('专属特性', 20, '魂印+20%', 2),
      makeHpPercentBonus('称号加成', 10, '称号+10%', 3),
    ];
    const calcOptions = {
      id: 3022,
      level: 100,
      baseStats: {
        atk: 130,
        def: 106,
        hp: 163,
        spAtk: 75,
        spDef: 106,
        spd: 120,
      },
      iv: 31,
      natureBonus: emptyNature,
      evs: { atk: 0, def: 0, hp: 230, spAtk: 0, spDef: 0, spd: 0 },
      mintmarks: [] as const,
      bonusSelections: [] as const,
    };

    const calcWith = (bonuses: readonly ExtraBonus[]): ReturnType<typeof calcPetAttr> =>
      calcPetAttr({ ...calcOptions, extraBonuses: [...bonuses] });

    const none = calcWith([]);
    const one = calcWith(percentBonuses.slice(0, 1));
    const two = calcWith(percentBonuses.slice(0, 2));
    const full = calcWith(percentBonuses);

    const assertPrefixMatches = (
      longer: SingleAttr,
      shorter: SingleAttr,
    ): void => {
      const shorterKeys = new Set(
        percentDetails(shorter).map((detail) => detailKey(detail)),
      );
      for (const detail of percentDetails(longer)) {
        if (!shorterKeys.has(detailKey(detail))) {
          continue;
        }
        expect(
          percentDetails(shorter).find((d) => detailKey(d) === detailKey(detail)),
        ).toEqual(detail);
      }
    };

    assertPrefixMatches(full.base.hp, two.base.hp);
    assertPrefixMatches(two.base.hp, one.base.hp);

    const baseHp = none.base.hp.value;
    expect(
      percentDetails(full.base.hp).reduce((sum, detail) => sum + detail.value, 0),
    ).toBe(full.base.hp.value - baseHp);
    expect(
      percentDetails(two.base.hp).reduce((sum, detail) => sum + detail.value, 0),
    ).toBe(two.base.hp.value - baseHp);
    expect(
      percentDetails(one.base.hp).reduce((sum, detail) => sum + detail.value, 0),
    ).toBe(one.base.hp.value - baseHp);
  });
});
