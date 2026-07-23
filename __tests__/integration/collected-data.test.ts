import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertTypeIdSequence,
  getActiveBonuses,
  isUsableSample,
  loadCollectedPets,
} from '../validation/collected-pet.js';

const FIXTURE_DIR = path.resolve('__tests__/fixtures/collected-pets');

describe('collected-data fixtures', () => {
  it('fixture 样本均可解析且 type_id 序列为 1–11', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    expect(samples.length).toBeGreaterThanOrEqual(40);

    const unusable = samples.filter(({ pet }) => !isUsableSample(pet));
    expect(unusable.map(({ sourcePath }) => path.basename(sourcePath))).toEqual(
      [],
    );

    for (const { pet } of samples) {
      expect(() => assertTypeIdSequence(pet)).not.toThrow();
    }
  });

  it('usable 样本的 *_total 为正整数', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const nonZeroTotals = samples.flatMap(({ pet }) =>
      Object.values(pet.attr_bonus_data).flatMap((stat) =>
        [stat.base_total, stat.pve_total, stat.pvp_total].filter(
          (total) => total !== 0,
        ),
      ),
    );
    expect(nonZeroTotals.length).toBeGreaterThan(0);
    expect(nonZeroTotals.every((total) => Number.isInteger(total))).toBe(true);
    expect(nonZeroTotals.every((total) => total > 0)).toBe(true);
  });

  it('getActiveBonuses 仅返回 minTypeId 及以上活跃项', async () => {
    const [sample] = await loadCollectedPets(FIXTURE_DIR);
    const entries = sample.pet.attr_bonus_data.atk.pve;
    const active = getActiveBonuses(entries);
    expect(active.every((entry) => entry.type_id >= 6)).toBe(true);
    expect(active.every((entry) => entry.value !== 0 || entry.percent !== 0)).toBe(
      true,
    );
  });
});
