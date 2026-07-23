import type { PercentSixAttributes, SixAttributes } from '../../src/types.ts';
import type { CollectedPet, CollectedStatKey } from './collected-pet.ts';
import {
  applyBonusPipeline,
  toBonusConfigs,
  type OrderStrategy,
  type Rounding,
} from './bonus-pipeline.ts';
import { getActiveBonuses, sumEarlyBonuses } from './collected-pet.ts';
import { buildEngineContext } from './collected-to-engine.ts';
import { calcHpStat, calcNonHpStat } from '../../src/main.ts';

const STAT_TO_SIX: Record<
  CollectedStatKey,
  keyof SixAttributes | 'hp'
> = {
  atk: 'atk',
  def: 'def',
  hp: 'hp',
  sp_atk: 'spAtk',
  sp_def: 'spDef',
  spd: 'spd',
};

function getCollectedEv(pet: CollectedPet, stat: CollectedStatKey): number {
  return pet.evs[stat];
}

/** 计算不含 type 1–5 与 type 6–11 的公式基础值 */
export function calcFormulaFoundation(
  pet: CollectedPet,
  stat: CollectedStatKey,
  baseStats: SixAttributes,
  natureBonus: PercentSixAttributes,
): number {
  const ev = getCollectedEv(pet, stat);
  const race = baseStats[STAT_TO_SIX[stat] as keyof SixAttributes];

  if (stat === 'hp') {
    return calcHpStat(pet.level, race, ev, pet.dv).value;
  }

  const natureKey = `${STAT_TO_SIX[stat] as 'atk' | 'def' | 'spAtk' | 'spDef' | 'spd'}Percent` as keyof PercentSixAttributes;
  const modifier = natureBonus[natureKey] ?? 1;
  return calcNonHpStat(pet.level, race, ev, pet.dv, modifier).value;
}

/** 回放 base 桶：`formula + type1-5 + type6-11` */
export function replayBaseBucketStat(
  pet: CollectedPet,
  stat: CollectedStatKey,
  baseStats: SixAttributes,
  natureBonus: PercentSixAttributes,
  strategy: OrderStrategy,
  rounding: Rounding,
): number {
  const bucket = pet.attr_bonus_data[stat];
  const formulaFoundation = calcFormulaFoundation(
    pet,
    stat,
    baseStats,
    natureBonus,
  );
  const earlyBonus = sumEarlyBonuses(bucket.base);
  const extraBonus = pet.extra_attr[stat];
  const lateBonuses = toBonusConfigs(getActiveBonuses(bucket.base));
  const foundation = formulaFoundation + earlyBonus + extraBonus;
  return applyBonusPipeline(foundation, lateBonuses, strategy, rounding);
}

/** 回放 pve/pvp 桶：`base_total + 本桶 type6-11` */
export function replayScopedBucketStat(
  pet: CollectedPet,
  stat: CollectedStatKey,
  bucket: 'pve' | 'pvp',
  strategy: OrderStrategy,
  rounding: Rounding,
): number {
  const data = pet.attr_bonus_data[stat];
  const foundation = data.base_total;
  const entries = bucket === 'pve' ? data.pve : data.pvp;
  const bonuses = toBonusConfigs(getActiveBonuses(entries));
  return applyBonusPipeline(foundation, bonuses, strategy, rounding);
}

/** 从采集快照内嵌的种族值 / 性格构建回放上下文 */
export function buildReplayContext(pet: CollectedPet): {
  baseStats: SixAttributes;
  natureBonus: PercentSixAttributes;
} {
  return buildEngineContext(pet);
}
