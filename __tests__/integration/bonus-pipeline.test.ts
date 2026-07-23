import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyBonusPipeline,
  type OrderStrategy,
  type Rounding,
} from '../validation/bonus-pipeline.js';
import {
  COLLECTED_BUCKET_KEYS,
  COLLECTED_STAT_KEYS,
  getActiveBonuses,
  hasBaseLateBonuses,
  loadCollectedPets,
  type CollectedBucketKey,
  type CollectedStatKey,
} from '../validation/collected-pet.js';
import { searchMatchingOrders } from '../validation/order-search.js';
import { toBonusConfigs } from '../validation/bonus-pipeline.js';

const FIXTURE_DIR = path.resolve('__tests__/fixtures/collected-pets');

interface ReplayCase {
  readonly petId: number;
  readonly stat: CollectedStatKey;
  readonly bucket: CollectedBucketKey;
  readonly foundation: number;
  readonly target: number;
  readonly bonuses: ReturnType<typeof toBonusConfigs>;
}

function collectScopedReplayCases(
  samples: Awaited<ReturnType<typeof loadCollectedPets>>,
): ReplayCase[] {
  const cases: ReplayCase[] = [];

  for (const { pet } of samples) {
    for (const stat of COLLECTED_STAT_KEYS) {
      if (hasBaseLateBonuses(pet, stat)) {
        continue;
      }

      for (const bucket of COLLECTED_BUCKET_KEYS) {
        if (bucket === 'base') {
          continue;
        }

        const bucketData = pet.attr_bonus_data[stat];
        const totalKey = `${bucket}_total` as const;
        const target = bucketData[totalKey];
        if (target === 0) {
          continue;
        }

        const entries = bucket === 'pve' ? bucketData.pve : bucketData.pvp;
        const active = getActiveBonuses(entries);
        if (active.length === 0) {
          continue;
        }

        cases.push({
          petId: pet.pet_id,
          stat,
          bucket,
          foundation: bucketData.base_total,
          target,
          bonuses: toBonusConfigs(active),
        });
      }
    }
  }

  return cases;
}

function strategyForBucket(
  bucket: CollectedBucketKey,
  kind: 'priority' | 'flat_before_percent' | 'type_id',
): OrderStrategy {
  const scope = bucket === 'base' ? 'base' : bucket;
  switch (kind) {
    case 'priority':
      return { kind: 'priority', scope };
    case 'flat_before_percent':
      return {
        kind: 'flat_before_percent',
        tieBreak: { kind: 'priority', scope },
      };
    case 'type_id':
      return { kind: 'type_id' };
    default: {
      const _exhaustive: never = kind;
      throw new Error(String(_exhaustive));
    }
  }
}

describe('bonus-pipeline scoped replay', () => {
  const samplesPromise = loadCollectedPets(FIXTURE_DIR);

  it('flat_before_percent + priority + floor 可解释全部 pve/pvp 桶（base 无 late bonus）', async () => {
    const samples = await samplesPromise;
    const cases = collectScopedReplayCases(samples);
    expect(cases.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const replayCase of cases) {
      const strategy = strategyForBucket(
        replayCase.bucket,
        'flat_before_percent',
      );
      const got = applyBonusPipeline(
        replayCase.foundation,
        replayCase.bonuses,
        strategy,
        'floor',
      );
      if (got !== replayCase.target) {
        failures.push(
          `pet ${replayCase.petId} ${replayCase.stat}.${replayCase.bucket}: expected ${replayCase.target}, got ${got}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it.each([
    ['priority', 'floor'],
    ['type_id', 'floor'],
  ] as const)('策略 %s + %s 的通过率（报告型）', async (kind, rounding) => {
    const samples = await samplesPromise;
    const cases = collectScopedReplayCases(samples);
    let passCount = 0;

    for (const replayCase of cases) {
      const strategy = strategyForBucket(replayCase.bucket, kind);
      const got = applyBonusPipeline(
        replayCase.foundation,
        replayCase.bonuses,
        strategy,
        rounding as Rounding,
      );
      if (got === replayCase.target) {
        passCount += 1;
      }
    }

    expect(passCount).toBeGreaterThan(0);
    expect.soft(passCount / cases.length).toBeGreaterThanOrEqual(0.5);
  });
});

describe('order-search', () => {
  it('169 pve atk 存在 flat-before-percent 等价排列', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const pet = samples.find(({ pet: p }) => p.pet_id === 169)?.pet;
    expect(pet).toBeDefined();

    const foundation = pet!.attr_bonus_data.atk.base_total;
    const target = pet!.attr_bonus_data.atk.pve_total;
    const bonuses = toBonusConfigs(getActiveBonuses(pet!.attr_bonus_data.atk.pve));

    const search = searchMatchingOrders({
      foundation,
      bonuses,
      target,
      rounding: 'floor',
    });

    expect(search.matchingOrders.length).toBeGreaterThan(0);
    // 道具固定值须排在装扮百分比之前
    expect(search.matchingOrders.some((order) => order.indexOf(6) < order.indexOf(8))).toBe(
      true,
    );
  });

  it('4732 pve atk 在 floor 下存在匹配排列', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const pet = samples.find(({ pet: p }) => p.pet_id === 4732)?.pet;
    expect(pet).toBeDefined();

    const foundation = pet!.attr_bonus_data.atk.base_total;
    const target = pet!.attr_bonus_data.atk.pve_total;
    const bonuses = toBonusConfigs(getActiveBonuses(pet!.attr_bonus_data.atk.pve));

    const search = searchMatchingOrders({
      foundation,
      bonuses,
      target,
      rounding: 'floor',
    });

    expect(search.matchingOrders.length).toBeGreaterThan(0);
  });
});
