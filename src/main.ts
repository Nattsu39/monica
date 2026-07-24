import type {
  ExtraBonus,
  PercentSixAttributes,
  PetAttrCalcOptions,
  PetAttrCalcResult,
  SingleAttr,
  SixAttributes,
} from './types.js';
import {
  cloneInBattleBuckets,
  getScopeTargets,
  isInBattleScope,
} from './attr-scopes.js';
import { listAvailableBonuses } from './extra-bonuses/catalog.js';
import {
  resolveBonuses,
  resolveTransferBonuses,
} from './extra-bonuses/resolve.js';
import {
  applyTransforms,
  deepCloneSingleAttrRecord,
} from './extra-bonuses/transforms/apply.js';
import './extra-bonuses/registrations/index.js';

const SIX_ATTR_KEYS = [
  'atk',
  'def',
  'spAtk',
  'spDef',
  'spd',
  'hp',
] as const satisfies readonly (keyof SixAttributes)[];

function floorPetAttrCalcResultValues<T extends PetAttrCalcResult>(
  result: T,
): T {
  for (const attr of Object.keys(result) as (keyof T)[]) {
    for (const key of SIX_ATTR_KEYS) {
      result[attr][key].value = Math.floor(result[attr][key].value);
    }
  }
  return result;
}

/**
 * 五项能力值 = Int[((种族值×2+个体+学习力÷4)×等级÷100+5)×性格修正]
 */
export function calcNonHpStat(
  level: number,
  baseStat: number,
  ev: number,
  iv: number,
  natureModifier: number,
): SingleAttr {
  const evStat = ev / 4;
  const value = Math.floor(
    (((baseStat * 2 + iv + evStat) * level) / 100 + 5) * natureModifier,
  );
  return {
    value,
    details: [
      {
        name: '学习力',
        value: Math.floor(evStat * (level / 100) * natureModifier),
        description: `学习力 ${ev}÷4`,
      },
    ],
  };
}

/**
 * 体力能力值 = Int[(种族值×2+个体+学习力÷4)×等级÷100+10+等级]
 */
export function calcHpStat(
  level: number,
  baseStat: number,
  ev: number,
  iv: number,
): SingleAttr {
  const evStat = ev / 4;
  const value = Math.floor(
    ((baseStat * 2 + iv + evStat) * level) / 100 + 10 + level,
  );
  return {
    value,
    details: [
      {
        name: '学习力',
        value: Math.floor(evStat * (level / 100)),
        description: `学习力 ${ev}÷4`,
      },
    ],
  };
}

function getNatureModifier(
  natureBonus: PercentSixAttributes,
  stat: keyof SixAttributes,
): number {
  const key = `${stat}Percent` as keyof PercentSixAttributes;
  return natureBonus[key] ?? 1;
}

function applyAwakenBaseStatsDelta(
  awakenAttrs: Record<keyof SixAttributes, SingleAttr>,
  baseAttrs: Record<keyof SixAttributes, SingleAttr>,
): void {
  for (const key of SIX_ATTR_KEYS) {
    const diff = awakenAttrs[key].value - baseAttrs[key].value;
    if (diff === 0) {
      continue;
    }
    awakenAttrs[key].details.push({
      name: '神谕觉醒',
      value: diff,
      description: '神谕觉醒种族值',
    });
  }
}

/** 根据种族值、学习力、个体与性格修正，计算六项基础能力值及明细 */
export function calcBaseSixAttributes(
  level: number,
  baseStats: SixAttributes,
  evs: SixAttributes,
  iv: number,
  natureBonus: PercentSixAttributes,
): Record<keyof SixAttributes, SingleAttr> {
  return {
    atk: calcNonHpStat(
      level,
      baseStats.atk,
      evs.atk,
      iv,
      getNatureModifier(natureBonus, 'atk'),
    ),
    def: calcNonHpStat(
      level,
      baseStats.def,
      evs.def,
      iv,
      getNatureModifier(natureBonus, 'def'),
    ),
    spAtk: calcNonHpStat(
      level,
      baseStats.spAtk,
      evs.spAtk,
      iv,
      getNatureModifier(natureBonus, 'spAtk'),
    ),
    spDef: calcNonHpStat(
      level,
      baseStats.spDef,
      evs.spDef,
      iv,
      getNatureModifier(natureBonus, 'spDef'),
    ),
    spd: calcNonHpStat(
      level,
      baseStats.spd,
      evs.spd,
      iv,
      getNatureModifier(natureBonus, 'spd'),
    ),
    hp: calcHpStat(level, baseStats.hp, evs.hp, iv),
  };
}

function emptySingleAttrRecord(): Record<keyof SixAttributes, SingleAttr> {
  return Object.fromEntries(
    SIX_ATTR_KEYS.map((key) => [key, { value: 0, details: [] }]),
  ) as Record<keyof SixAttributes, SingleAttr>;
}

/** 加成是否含任意非零百分比（采集约定：10 = +10%） */
function bonusHasPercent(bonus: ExtraBonus): boolean {
  for (const key of SIX_ATTR_KEYS) {
    if (bonus.value[`${key}Percent`] !== 0) {
      return true;
    }
  }
  return false;
}

/**
 * 排序：固定值加成整组先于百分比加成，组内再按 priority 升序。
 * 固定值可交换；百分比按序逐步取整复合（见 applyPercentsCompound）。
 */
function compareExtraBonuses(left: ExtraBonus, right: ExtraBonus): number {
  const leftPercent = bonusHasPercent(left);
  const rightPercent = bonusHasPercent(right);
  if (leftPercent !== rightPercent) {
    return leftPercent ? 1 : -1;
  }
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }
  return 0;
}

/** 仅应用固定值部分 */
function applyFlatOnly(
  target: Record<keyof SixAttributes, SingleAttr>,
  bonus: ExtraBonus,
): void {
  const detailName = bonus.source ?? '特殊加成';
  const description = bonus.description ?? '';

  for (const key of SIX_ATTR_KEYS) {
    const flatValue = bonus.value[key];
    if (flatValue === 0) {
      continue;
    }
    target[key].value += flatValue;
    target[key].details.push({
      name: detailName,
      value: flatValue,
      description,
    });
  }
}

/**
 * 多百分比依次复合：每步 running = floor(running × (1 + p/100))，
 * 明细记录整数增量与 percent，便于逐项移除后重算保持一致。
 */
function applyPercentsCompound(
  target: Record<keyof SixAttributes, SingleAttr>,
  bonuses: readonly ExtraBonus[],
): void {
  for (const key of SIX_ATTR_KEYS) {
    let running = target[key].value;

    for (const bonus of bonuses) {
      const percent = bonus.value[`${key}Percent`];
      if (percent === 0) {
        continue;
      }
      const next = Math.floor(running * (1 + percent / 100));
      const increment = next - running;
      const detailName = bonus.source ?? '特殊加成';
      const description = bonus.description ?? `${percent}%`;
      target[key].details.push({
        name: detailName,
        percent,
        value: increment,
        description,
      });
      running = next;
    }

    target[key].value = running;
  }
}

/**
 * 先应用全部固定值，再按序复合应用全部百分比（每步取整）。
 * 与「固定值整组先于百分比」一致。
 */
function applyExtraBonusesToTargets(
  targets: readonly Record<keyof SixAttributes, SingleAttr>[],
  bonuses: readonly ExtraBonus[],
): void {
  const sorted = [...bonuses].sort(compareExtraBonuses);
  for (const target of targets) {
    for (const bonus of sorted) {
      applyFlatOnly(target, bonus);
    }
    applyPercentsCompound(target, sorted);
  }
}

/**
 * 面板加成分两阶段：
 * 1. scope 为 base / all 的加成写入 base，再克隆到 pve、pvp（与游戏「pve/pvp 以 base_total 为底」一致）
 * 2. 仅 pve / 仅 pvp 的加成分别叠到对应桶
 */
function applyPanelBonuses(
  result: PetAttrCalcResult,
  bonuses: readonly ExtraBonus[],
): void {
  const baseAndAll = bonuses.filter(
    (bonus) => bonus.scope === 'base' || bonus.scope === 'all',
  );
  applyExtraBonusesToTargets([result.base], baseAndAll);

  // base 定稿后再派生 pve/pvp，避免作用域加成从 0 起算
  result.pve = deepCloneSingleAttrRecord(result.base);
  result.pvp = deepCloneSingleAttrRecord(result.base);

  const pveOnly = bonuses.filter((bonus) => bonus.scope === 'pve');
  applyExtraBonusesToTargets([result.pve], pveOnly);

  const pvpOnly = bonuses.filter((bonus) => bonus.scope === 'pvp');
  applyExtraBonusesToTargets([result.pvp], pvpOnly);
}

/** 计算器主入口
 * @param options - 计算精灵属性所需参数
 * @returns 精灵属性计算结果
 */
export function calcPetAttr(options: PetAttrCalcOptions): PetAttrCalcResult {
  const { level, baseStats, evs, iv: dv, natureBonus } = options;
  const raceStats = options.awakenBaseStats ?? baseStats;
  const baseAttrs = calcBaseSixAttributes(
    level,
    raceStats,
    evs,
    dv,
    natureBonus,
  );
  if (options.awakenBaseStats !== undefined) {
    const normalAttrs = calcBaseSixAttributes(
      level,
      baseStats,
      evs,
      dv,
      natureBonus,
    );
    applyAwakenBaseStatsDelta(baseAttrs, normalAttrs);
  }
  for (let i = 0; i < options.mintmarks.length; i++) {
    const mintmark = options.mintmarks[i];
    for (const stat of SIX_ATTR_KEYS) {
      const mintmarkValue = mintmark[stat];
      baseAttrs[stat].value += mintmarkValue;
      baseAttrs[stat].details.push({
        name: '刻印',
        value: mintmarkValue,
        description: `${i + 1}号刻印`,
      });
    }
  }

  const {
    static: staticDescriptors,
    transfer: transferDescriptors,
    transforms: registryTransforms,
  } = listAvailableBonuses(options);
  const staticSelectionIds = new Set(staticDescriptors.map((d) => d.id));
  const transferSelectionIds = new Set(transferDescriptors.map((d) => d.id));
  const staticSelections = options.bonusSelections.filter((entry) =>
    staticSelectionIds.has(entry.id),
  );
  const transferSelections = options.bonusSelections.filter((entry) =>
    transferSelectionIds.has(entry.id),
  );
  const resolvedStaticBonuses = resolveBonuses(
    staticDescriptors,
    staticSelections,
  );
  const resolvedTransferBonuses = resolveTransferBonuses(
    transferDescriptors,
    transferSelections,
    baseAttrs,
  );
  const allBonuses = [
    ...resolvedStaticBonuses,
    ...resolvedTransferBonuses,
    ...options.extraBonuses,
  ];

  let result: PetAttrCalcResult = {
    base: baseAttrs,
    pve: emptySingleAttrRecord(),
    pvp: emptySingleAttrRecord(),
    base_inbattle: emptySingleAttrRecord(),
    pve_inbattle: emptySingleAttrRecord(),
    pvp_inbattle: emptySingleAttrRecord(),
  };

  const panelBonuses = allBonuses.filter(
    (bonus) => !isInBattleScope(bonus.scope),
  );
  const inBattleBonuses = allBonuses.filter((bonus) =>
    isInBattleScope(bonus.scope),
  );

  applyPanelBonuses(result, panelBonuses);
  result = floorPetAttrCalcResultValues(result);
  cloneInBattleBuckets(result);

  const sortedInBattle = [...inBattleBonuses].sort(compareExtraBonuses);
  for (const bonus of sortedInBattle) {
    applyExtraBonusesToTargets(getScopeTargets(bonus.scope, result), [bonus]);
  }

  const transforms = [
    ...registryTransforms,
    ...(options.externalTransforms ?? []),
  ];
  applyTransforms(result, transforms);

  return result;
}

/** 核心计算输入/输出与属性结构（见 {@link calcPetAttr}） */
export type {
  AttrBucket,
  AttrDetail,
  AttrItemName,
  AttrMode,
  BonusScope,
  ExtraBonus,
  MintmarkAttr,
  PercentSixAttributes,
  PetAttrCalcOptions,
  PetAttrCalcResult,
  SingleAttr,
  SixAttributes,
  Soulmark,
} from './types.js';
/** 加成描述与玩家选择相关类型（见 {@link listAvailableBonuses}） */
export type {
  BonusDescriptor,
  BonusMechanism,
  BonusSelection,
  BonusSelectionEntry,
  PetBonusContext,
} from './extra-bonuses/types.js';
/** 魂印属性变换描述 */
export type { TransformDescriptor } from './extra-bonuses/transforms/types.js';
/** {@link listAvailableBonuses} 的返回值 */
export type { AvailableBonuses } from './extra-bonuses/catalog.js';
/** 加成注册表；默认数据见 {@link defaultBonusRegistry} */
export {
  BonusRegistry,
  defaultBonusRegistry,
} from './extra-bonuses/registry.js';
/** 加成目录 API：发现可选 descriptor、生成默认 selection */
export {
  buildBonusContext,
  defaultSelectionEntryFor,
  defaultSelectionFor,
  listAvailableBonuses,
} from './extra-bonuses/catalog.js';
/** 自定义 {@link ExtraBonus} 时与内置加成对齐的 priority 常量 */
export { PRIORITY_CONSTS } from './extra-bonuses/priority-const.js';
