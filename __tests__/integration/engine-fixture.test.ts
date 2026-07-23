import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { BonusRegistry } from '../../src/extra-bonuses/registry.js';
import { calcPetAttr } from '../../src/main.js';
import type { SixAttributes } from '../../src/types.js';
import {
  COLLECTED_STAT_KEYS,
  loadCollectedPets,
  type CollectedStatKey,
} from '../validation/collected-pet.js';
import {
  buildEngineContext,
  collectedEvsToEngine,
  collectedPetToExtraBonuses,
} from '../validation/collected-to-engine.js';

const FIXTURE_DIR = path.resolve('__tests__/fixtures/collected-pets');

/** 采集 snake_case → 引擎结果键 */
const STAT_TO_ENGINE: Record<CollectedStatKey, keyof SixAttributes> = {
  atk: 'atk',
  def: 'def',
  hp: 'hp',
  sp_atk: 'spAtk',
  sp_def: 'spDef',
  spd: 'spd',
};

function assertEngineMatchesTotals(dataDir: string): void {
  return loadCollectedPets(dataDir).then((samples) => {
    expect(samples.length).toBeGreaterThan(0);

    const emptyRegistry = new BonusRegistry();
    const failures: string[] = [];

    for (const { pet, sourcePath } of samples) {
      const context = buildEngineContext(pet);
      const result = calcPetAttr({
        id: pet.pet_id,
        level: pet.level,
        baseStats: context.baseStats,
        dv: pet.dv,
        natureBonus: context.natureBonus,
        evs: collectedEvsToEngine(pet),
        mintmarks: [],
        bonusRegistry: emptyRegistry,
        bonusSelections: [],
        extraBonuses: [...collectedPetToExtraBonuses(pet)],
      });

      for (const stat of COLLECTED_STAT_KEYS) {
        const engineKey = STAT_TO_ENGINE[stat];
        const bucket = pet.attr_bonus_data[stat];

        for (const mode of ['base', 'pve', 'pvp'] as const) {
          const expected = bucket[`${mode}_total`];
          if (expected === 0) {
            continue;
          }
          const got = result[mode][engineKey].value;
          if (got !== expected) {
            failures.push(
              `${path.basename(sourcePath)} pet ${pet.pet_id} ${stat}.${mode}: expected ${expected}, got ${got}`,
            );
          }
        }
      }
    }

    expect(failures).toEqual([]);
  });
}

/**
 * 用采集数值驱动 calcPetAttr：
 * - 种族值 / 性格来自采集 JSON 内嵌字段
 * - type 2–11 与 extra_attr 经适配器注入 extraBonuses
 * - 空 registry，避免 default 全局加成与采集数值重复叠加
 */
describe('calcPetAttr engine vs collected fixtures', () => {
  it('各 fixture 的 base / pve / pvp 面板值与 *_total 一致', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    expect(samples.length).toBeGreaterThanOrEqual(40);
    await assertEngineMatchesTotals(FIXTURE_DIR);
  });

  it('3022 的 extra_attr.hp（额外体力上限）进入 base 面板', async () => {
    const samples = await loadCollectedPets(FIXTURE_DIR);
    const sample = samples.find(({ pet }) => pet.pet_id === 3022);
    expect(sample).toBeDefined();

    const { pet } = sample!;
    expect(pet.extra_attr.hp).toBe(20);

    const context = buildEngineContext(pet);
    const result = calcPetAttr({
      id: pet.pet_id,
      level: pet.level,
      baseStats: context.baseStats,
      dv: pet.dv,
      natureBonus: context.natureBonus,
      evs: collectedEvsToEngine(pet),
      mintmarks: [],
      bonusRegistry: new BonusRegistry(),
      bonusSelections: [],
      extraBonuses: [...collectedPetToExtraBonuses(pet)],
    });

    expect(
      result.base.hp.details.some(
        (detail) =>
          detail.name === '额外体力上限' && detail.value === pet.extra_attr.hp,
      ),
    ).toBe(true);
    expect(result.base.hp.value).toBe(pet.attr_bonus_data.hp.base_total);
  });
});
