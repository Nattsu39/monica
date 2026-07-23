import { describe, expect, it } from 'vitest';
import {
  applyBonusPipeline,
  type BonusConfig,
} from '../validation/bonus-pipeline.js';
import { searchMatchingOrders } from '../validation/order-search.js';

describe('order-search unit', () => {
  it('单一加成时仅一种排列', () => {
    const bonuses: BonusConfig[] = [{ typeId: 7, value: 100, percent: 0 }];
    const search = searchMatchingOrders({
      foundation: 727,
      bonuses,
      target: 827,
      rounding: 'floor',
    });
    expect(search.matchingOrders).toEqual([[7]]);
    expect(search.checkedCount).toBe(1);
  });

  it('flat 先于 percent 时 6→9→8 与 9→6→8 结果相同', () => {
    const foundation = 234;
    const bonuses: BonusConfig[] = [
      { typeId: 6, value: 70, percent: 0 },
      { typeId: 9, value: 20, percent: 0 },
      { typeId: 8, value: 0, percent: 10 },
    ];
    const strategy = {
      kind: 'flat_before_percent' as const,
      tieBreak: { kind: 'priority' as const, scope: 'pve' as const },
    };
    const got = applyBonusPipeline(foundation, bonuses, strategy, 'floor');
    expect(got).toBe(356);
  });
});
