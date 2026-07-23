import type { AttrBonusEntry } from './collected-pet.ts';
import {
  getPriorityForTypeId,
  type PriorityScope,
} from './type-id-priority.ts';

export type Rounding = 'floor' | 'round' | 'ceil';

export interface BonusConfig {
  readonly typeId: number;
  readonly value: number;
  readonly percent: number;
}

export type OrderStrategy =
  | { kind: 'priority'; scope: PriorityScope }
  | { kind: 'type_id' }
  | { kind: 'flat_before_percent'; tieBreak: OrderStrategy }
  | { kind: 'explicit'; order: readonly number[] };

function applyRounding(value: number, rounding: Rounding): number {
  switch (rounding) {
    case 'floor':
      return Math.floor(value);
    case 'round':
      return Math.round(value);
    case 'ceil':
      return Math.ceil(value);
    default: {
      const _exhaustive: never = rounding;
      throw new Error(`未知取整规则：${_exhaustive}`);
    }
  }
}

/**
 * 先加全部固定值，再对百分比做复合乘法，最后一次性取整。
 * 单百分比时与「逐步 floor 增量」等价；多百分比时与游戏面板更一致。
 */
function applyBonusesTwoPhase(
  foundation: number,
  bonuses: readonly BonusConfig[],
  rounding: Rounding,
): number {
  let running = foundation;
  for (const bonus of bonuses) {
    if (bonus.value !== 0) {
      running += bonus.value;
    }
  }

  let factor = 1;
  let anyPercent = false;
  for (const bonus of bonuses) {
    if (bonus.percent === 0) {
      continue;
    }
    anyPercent = true;
    factor *= 1 + bonus.percent / 100;
  }

  if (!anyPercent) {
    return running;
  }
  return applyRounding(running * factor, rounding);
}

function compareByStrategy(
  left: BonusConfig,
  right: BonusConfig,
  strategy: OrderStrategy,
): number {
  switch (strategy.kind) {
    case 'priority': {
      const leftPriority = getPriorityForTypeId(left.typeId, strategy.scope);
      const rightPriority = getPriorityForTypeId(right.typeId, strategy.scope);
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.typeId - right.typeId;
    }
    case 'type_id':
      return left.typeId - right.typeId;
    case 'flat_before_percent': {
      const leftIsPercent = left.percent !== 0;
      const rightIsPercent = right.percent !== 0;
      if (leftIsPercent !== rightIsPercent) {
        return leftIsPercent ? 1 : -1;
      }
      return compareByStrategy(left, right, strategy.tieBreak);
    }
    case 'explicit': {
      const leftIndex = strategy.order.indexOf(left.typeId);
      const rightIndex = strategy.order.indexOf(right.typeId);
      return leftIndex - rightIndex;
    }
    default: {
      const _exhaustive: never = strategy;
      throw new Error(`未知顺序策略：${(_exhaustive as { kind: string }).kind}`);
    }
  }
}

function sortBonuses(
  bonuses: readonly BonusConfig[],
  strategy: OrderStrategy,
): BonusConfig[] {
  return [...bonuses].sort((left, right) =>
    compareByStrategy(left, right, strategy),
  );
}

/** 将采集条目转为回放配置 */
export function toBonusConfigs(
  entries: readonly AttrBonusEntry[],
): BonusConfig[] {
  return entries
    .filter((entry) => entry.value !== 0 || entry.percent !== 0)
    .map((entry) => ({
      typeId: entry.type_id,
      value: entry.value,
      percent: entry.percent,
    }));
}

/** 按假设顺序回放 type 6–11 加成（固定值先，百分比复合后取整） */
export function applyBonusPipeline(
  foundation: number,
  bonuses: readonly BonusConfig[],
  strategy: OrderStrategy,
  rounding: Rounding,
): number {
  const sorted = sortBonuses(bonuses, strategy);
  return applyBonusesTwoPhase(foundation, sorted, rounding);
}
