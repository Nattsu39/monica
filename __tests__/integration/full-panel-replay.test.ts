import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COLLECTED_STAT_KEYS,
  loadCollectedPets,
} from '../validation/collected-pet.js';
import {
  buildReplayContext,
  replayBaseBucketStat,
} from '../validation/collected-replay.js';
import { collectedNatureToEngineBonus } from '../validation/collected-to-engine.js';

const FIXTURE_DIR = path.resolve('__tests__/fixtures/collected-pets');

describe('full-panel-replay', () => {
  it('采集 JSON 内嵌种族值与性格可用于回放', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const sample = samples.find(({ pet }) => pet.pet_id === 3022);
    expect(sample).toBeDefined();

    const { pet } = sample!;
    expect(pet.base_stats.hp).toBe(163);
    expect(pet.nature_attributes.def).toBe(10);
    expect(collectedNatureToEngineBonus(pet).defPercent).toBe(1.1);
  });

  it('3022 base 桶（含魂印百分比）可全链路回放', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const sample = samples.find(({ pet }) => pet.pet_id === 3022);
    expect(sample).toBeDefined();

    const { pet } = sample!;
    const context = buildReplayContext(pet);
    const strategy = {
      kind: 'flat_before_percent' as const,
      tieBreak: { kind: 'priority' as const, scope: 'base' as const },
    };

    const failures: string[] = [];
    for (const stat of COLLECTED_STAT_KEYS) {
      const expected = pet.attr_bonus_data[stat].base_total;
      if (expected === 0) {
        continue;
      }

      const got = replayBaseBucketStat(
        pet,
        stat,
        context.baseStats,
        context.natureBonus,
        strategy,
        'floor',
      );

      if (got !== expected) {
        failures.push(`${stat}: expected ${expected}, got ${got}`);
      }
    }

    expect(failures).toEqual([]);
  });

  it('全部 fixture 的 base 桶可全链路回放', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const strategy = {
      kind: 'flat_before_percent' as const,
      tieBreak: { kind: 'priority' as const, scope: 'base' as const },
    };

    const failures: string[] = [];

    for (const { pet } of samples) {
      const context = buildReplayContext(pet);
      for (const stat of COLLECTED_STAT_KEYS) {
        const expected = pet.attr_bonus_data[stat].base_total;
        if (expected === 0) {
          continue;
        }

        const got = replayBaseBucketStat(
          pet,
          stat,
          context.baseStats,
          context.natureBonus,
          strategy,
          'floor',
        );

        if (got !== expected) {
          failures.push(
            `pet ${pet.pet_id} ${stat}: expected ${expected}, got ${got}`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
