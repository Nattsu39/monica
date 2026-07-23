import {
  applyBonusPipeline,
  type BonusConfig,
  type OrderStrategy,
  type Rounding,
} from './bonus-pipeline.ts';

function permute<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) {
    return [items.slice() as T[]];
  }
  const results: T[][] = [];
  for (let index = 0; index < items.length; index += 1) {
    const current = items[index];
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const permutation of permute(rest)) {
      results.push([current, ...permutation]);
    }
  }
  return results;
}

export interface OrderSearchOptions {
  readonly foundation: number;
  readonly bonuses: readonly BonusConfig[];
  readonly target: number;
  readonly rounding: Rounding;
}

export interface OrderSearchResult {
  readonly matchingOrders: readonly (readonly number[])[];
  readonly checkedCount: number;
}

/** 全排列搜索所有使回放结果等于 target 的 type_id 顺序 */
export function searchMatchingOrders(
  options: OrderSearchOptions,
): OrderSearchResult {
  const typeIds = [...new Set(options.bonuses.map((bonus) => bonus.typeId))];
  const permutations = permute(typeIds);
  const matchingOrders: number[][] = [];

  for (const order of permutations) {
    const result = applyBonusPipeline(
      options.foundation,
      options.bonuses,
      { kind: 'explicit', order },
      options.rounding,
    );
    if (result === options.target) {
      matchingOrders.push(order);
    }
  }

  return {
    matchingOrders,
    checkedCount: permutations.length,
  };
}

/** 判断某策略是否能解释目标值 */
export function strategyMatchesTarget(
  foundation: number,
  bonuses: readonly BonusConfig[],
  strategy: OrderStrategy,
  rounding: Rounding,
  target: number,
): boolean {
  return (
    applyBonusPipeline(foundation, bonuses, strategy, rounding) === target
  );
}
