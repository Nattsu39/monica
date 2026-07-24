import { describe, it, expect, beforeEach } from 'vitest';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import { registerGlobalFixedBonus } from '../../src/extra-bonuses/register-global-bonus.js';
import {
  calcBaseSixAttributes,
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
});
