#!/usr/bin/env node
import path from 'node:path';
import {
  COLLECTED_BUCKET_KEYS,
  COLLECTED_STAT_KEYS,
  getActiveBonuses,
  loadCollectedPets,
  type CollectedBucketKey,
} from './collected-pet.ts';
import {
  applyBonusPipeline,
  toBonusConfigs,
  type OrderStrategy,
  type Rounding,
} from './bonus-pipeline.ts';
import { searchMatchingOrders } from './order-search.ts';

const DEFAULT_STRATEGIES = [
  {
    label: 'priority/base',
    strategy: { kind: 'priority' as const, scope: 'base' as const },
  },
  {
    label: 'priority/pve',
    strategy: { kind: 'priority' as const, scope: 'pve' as const },
  },
  {
    label: 'flat_before_percent(priority/pve)',
    strategy: {
      kind: 'flat_before_percent' as const,
      tieBreak: { kind: 'priority' as const, scope: 'pve' as const },
    },
  },
  {
    label: 'type_id',
    strategy: { kind: 'type_id' as const },
  },
];

async function main(): Promise<void> {
  const dataDir = path.resolve('__tests__/fixtures/collected-pets');
  const rounding = (process.env.BONUS_ROUNDING ?? 'floor') as
    | 'floor'
    | 'round'
    | 'ceil';

  const samples = await loadCollectedPets(dataDir);
  let mismatchCount = 0;

  for (const { sourcePath, pet } of samples) {
    console.log(`\n=== ${path.basename(sourcePath)} (pet ${pet.pet_id}) ===`);

    for (const stat of COLLECTED_STAT_KEYS) {
      for (const bucket of COLLECTED_BUCKET_KEYS) {
        const bucketData = pet.attr_bonus_data[stat];
        const totalKey = `${bucket}_total` as const;
        const target = bucketData[totalKey];
        if (target === 0) {
          continue;
        }

        const entries =
          bucket === 'base'
            ? bucketData.base
            : bucket === 'pve'
              ? bucketData.pve
              : bucketData.pvp;
        const active = getActiveBonuses(entries);
        if (active.length === 0 && bucket !== 'base') {
          continue;
        }

        const foundation =
          bucket === 'base' ? null : bucketData.base_total;
        if (foundation === null) {
          continue;
        }

        const bonuses = toBonusConfigs(active);
        const scope: CollectedBucketKey =
          bucket === 'base' ? 'base' : bucket;
        let matched = false;

        for (const { label, strategy } of DEFAULT_STRATEGIES) {
          let resolvedStrategy: OrderStrategy;
          if (strategy.kind === 'priority') {
            resolvedStrategy = { kind: 'priority', scope };
          } else if (strategy.kind === 'flat_before_percent') {
            resolvedStrategy = {
              kind: 'flat_before_percent',
              tieBreak: { kind: 'priority', scope },
            };
          } else {
            resolvedStrategy = strategy;
          }

          const got = applyBonusPipeline(
            foundation,
            bonuses,
            resolvedStrategy,
            rounding as Rounding,
          );
          if (got === target) {
            console.log(`  OK ${stat}.${bucket}: ${label} => ${got}`);
            matched = true;
            break;
          }
        }

        if (!matched) {
          mismatchCount += 1;
          console.log(
            `  MISMATCH ${stat}.${bucket}: target=${target}, foundation=${foundation}, bonuses=${JSON.stringify(bonuses)}`,
          );
          const search = searchMatchingOrders({
            foundation,
            bonuses,
            target,
            rounding,
          });
          console.log(
            `    permutations checked=${search.checkedCount}, matches=${search.matchingOrders.length}`,
          );
          for (const order of search.matchingOrders.slice(0, 5)) {
            console.log(`      order: [${order.join(', ')}]`);
          }
        }
      }
    }
  }

  if (mismatchCount > 0) {
    console.log(`\n共 ${mismatchCount} 个桶未能被默认策略解释。`);
    process.exitCode = 1;
  } else {
    console.log('\n全部桶均能被某默认策略解释。');
  }
}

main().catch((cause: unknown) => {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(message);
  process.exitCode = 1;
});
