import type {
  AttrItemName,
  AttrMode,
  ExtraBonus,
  PercentSixAttributes,
  SixAttributes,
} from '../../src/types.ts';
import type {
  AttrBonusEntry,
  CollectedBucketKey,
  CollectedPet,
  CollectedStatKey,
} from './collected-pet.ts';
import { COLLECTED_STAT_KEYS, getActiveBonuses } from './collected-pet.ts';
import {
  TYPE_ID_TO_ATTR_NAME,
  getPriorityForTypeId,
  type PriorityScope,
} from './type-id-priority.ts';

/** 采集种族值 → 引擎 SixAttributes */
export function collectedBaseStatsToEngine(pet: CollectedPet): SixAttributes {
  return {
    atk: pet.base_stats.atk,
    def: pet.base_stats.def,
    spAtk: pet.base_stats.sp_atk,
    spDef: pet.base_stats.sp_def,
    spd: pet.base_stats.spd,
    hp: pet.base_stats.hp,
  };
}

/** 采集性格修正 → calcPetAttr 使用的乘数 */
export function collectedNatureToEngineBonus(
  pet: CollectedPet,
): PercentSixAttributes {
  const { nature_attributes: attributes } = pet;
  const toMultiplier = (percent: number): number =>
    percent === 0 ? 1 : 1 + percent / 100;

  return {
    atkPercent: toMultiplier(attributes.atk),
    defPercent: toMultiplier(attributes.def),
    spAtkPercent: toMultiplier(attributes.sp_atk),
    spDefPercent: toMultiplier(attributes.sp_def),
    spdPercent: toMultiplier(attributes.spd),
    hpPercent: toMultiplier(attributes.hp),
  };
}

/** 从采集快照构建引擎回放上下文（完全离线） */
export function buildEngineContext(pet: CollectedPet): {
  baseStats: SixAttributes;
  natureBonus: PercentSixAttributes;
} {
  return {
    baseStats: collectedBaseStatsToEngine(pet),
    natureBonus: collectedNatureToEngineBonus(pet),
  };
}

/** 采集 snake_case 属性键 → 引擎 camelCase */
const STAT_TO_ENGINE: Record<CollectedStatKey, keyof SixAttributes> = {
  atk: 'atk',
  def: 'def',
  hp: 'hp',
  sp_atk: 'spAtk',
  sp_def: 'spDef',
  spd: 'spd',
};

/**
 * 前期加成（type 2–5、extra_attr）的 priority。
 * 须低于 PRIORITY_CONSTS 中 type 6–11 的最小值，保证先于道具/魂印等应用。
 */
const EARLY_BONUS_PRIORITY = 0;

function emptyBonusValue(): SixAttributes & PercentSixAttributes {
  return {
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
}

function isAttrItemName(name: string): name is AttrItemName {
  return (
    name === '学习力' ||
    name === '刻印' ||
    name === '战队加成' ||
    name === '称号加成' ||
    name === '年费加成' ||
    name === '道具加成' ||
    name === '专属特性' ||
    name === '装扮加成' ||
    name === '超能加成' ||
    name === '神谕觉醒' ||
    name === '特殊加成' ||
    name === '基础值加成'
  );
}

function sourceForTypeId(typeId: number, fallbackName: string): AttrItemName {
  const mapped = TYPE_ID_TO_ATTR_NAME[typeId] ?? fallbackName;
  return isAttrItemName(mapped) ? mapped : '特殊加成';
}

/**
 * 将同一 type_id 在六维上的采集条目合并为一条 ExtraBonus。
 * 百分比沿用采集约定：10 表示 +10%（而不是 0.1）。
 */
function mergeEntriesToBonus(
  typeId: number,
  typeName: string,
  scope: AttrMode,
  priority: number,
  byStat: Partial<Record<CollectedStatKey, AttrBonusEntry>>,
): ExtraBonus {
  const value = emptyBonusValue();
  for (const stat of COLLECTED_STAT_KEYS) {
    const entry = byStat[stat];
    if (entry === undefined) {
      continue;
    }
    const engineKey = STAT_TO_ENGINE[stat];
    value[engineKey] = entry.value;
    value[`${engineKey}Percent`] = entry.percent;
  }
  return {
    scope,
    priority,
    source: sourceForTypeId(typeId, typeName),
    description: `采集 type_id=${typeId}（${typeName}）`,
    value,
  };
}

function collectBucketBonuses(
  pet: CollectedPet,
  bucket: CollectedBucketKey,
  scope: AttrMode,
  minTypeId: number,
  maxTypeId: number,
  priorityFor: (typeId: number) => number,
): ExtraBonus[] {
  const grouped = new Map<
    number,
    {
      typeName: string;
      byStat: Partial<Record<CollectedStatKey, AttrBonusEntry>>;
    }
  >();

  for (const stat of COLLECTED_STAT_KEYS) {
    const bucketData = pet.attr_bonus_data[stat];
    const entries =
      bucket === 'base'
        ? bucketData.base
        : bucket === 'pve'
          ? bucketData.pve
          : bucketData.pvp;
    for (const entry of getActiveBonuses(entries, minTypeId)) {
      if (entry.type_id > maxTypeId) {
        continue;
      }
      let group = grouped.get(entry.type_id);
      if (group === undefined) {
        group = { typeName: entry.type_name, byStat: {} };
        grouped.set(entry.type_id, group);
      }
      group.byStat[stat] = entry;
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .map(([typeId, group]) =>
      mergeEntriesToBonus(
        typeId,
        group.typeName,
        scope,
        priorityFor(typeId),
        group.byStat,
      ),
    );
}

/**
 * 将 `extra_attr` 转为 ExtraBonus。
 * 采集端该字段包含「额外体力上限」（体力合剂等），以及其他维度的额外固定值。
 */
export function extraAttrToBonus(pet: CollectedPet): ExtraBonus | undefined {
  const { extra_attr } = pet;
  const hasAny =
    extra_attr.atk !== 0 ||
    extra_attr.def !== 0 ||
    extra_attr.hp !== 0 ||
    extra_attr.sp_atk !== 0 ||
    extra_attr.sp_def !== 0 ||
    extra_attr.spd !== 0;
  if (!hasAny) {
    return undefined;
  }

  const value = emptyBonusValue();
  value.atk = extra_attr.atk;
  value.def = extra_attr.def;
  value.hp = extra_attr.hp;
  value.spAtk = extra_attr.sp_atk;
  value.spDef = extra_attr.sp_def;
  value.spd = extra_attr.spd;

  return {
    // 写入 base，随后由引擎克隆到 pve/pvp
    scope: 'base',
    priority: EARLY_BONUS_PRIORITY,
    source: '基础值加成',
    description: '采集 extra_attr（含额外体力上限等固定值）',
    value,
  };
}

/**
 * 将采集快照中的数值加成转为引擎 `extraBonuses`。
 * 不解析刻印/魂印/称号等语义，只搬运 type 2–11 与 extra_attr 的数值。
 * type 1（学习力）已由公式 + evs 计入，此处跳过。
 */
export function collectedPetToExtraBonuses(
  pet: CollectedPet,
): readonly ExtraBonus[] {
  const bonuses: ExtraBonus[] = [];

  // type 2–5：刻印/战队/称号/年费 — 只取 base 桶（pve/pvp 桶中对应项通常为 0）
  bonuses.push(
    ...collectBucketBonuses(
      pet,
      'base',
      'base',
      2,
      5,
      () => EARLY_BONUS_PRIORITY,
    ),
  );

  const extra = extraAttrToBonus(pet);
  if (extra !== undefined) {
    bonuses.push(extra);
  }

  // type 6–11：按桶写入对应 scope，priority 对齐 PRIORITY_CONSTS
  for (const bucket of ['base', 'pve', 'pvp'] as const) {
    const scope: PriorityScope = bucket;
    bonuses.push(
      ...collectBucketBonuses(pet, bucket, bucket, 6, 11, (typeId) =>
        getPriorityForTypeId(typeId, scope),
      ),
    );
  }

  return bonuses;
}

/** 采集 evs → 引擎 SixAttributes */
export function collectedEvsToEngine(pet: CollectedPet): SixAttributes {
  return {
    atk: pet.evs.atk,
    def: pet.evs.def,
    spAtk: pet.evs.sp_atk,
    spDef: pet.evs.sp_def,
    spd: pet.evs.spd,
    hp: pet.evs.hp,
  };
}
