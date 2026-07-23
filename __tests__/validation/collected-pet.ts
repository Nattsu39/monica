import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { assertCollectedPetSchema } from './collected-pet-schema.ts';

export const COLLECTED_STAT_KEYS = [
  'atk',
  'def',
  'hp',
  'sp_atk',
  'sp_def',
  'spd',
] as const;

export const COLLECTED_BUCKET_KEYS = ['base', 'pve', 'pvp'] as const;

export type CollectedStatKey = (typeof COLLECTED_STAT_KEYS)[number];
export type CollectedBucketKey = (typeof COLLECTED_BUCKET_KEYS)[number];

export interface AttrBonusEntry {
  readonly percent: number;
  readonly type_id: number;
  readonly type_name: string;
  readonly value: number;
}

export interface AttrBonusBucket {
  readonly base: readonly AttrBonusEntry[];
  readonly base_total: number;
  readonly pve: readonly AttrBonusEntry[];
  readonly pve_total: number;
  readonly pvp: readonly AttrBonusEntry[];
  readonly pvp_total: number;
}

export interface CollectedEffect {
  readonly args: readonly number[];
  readonly id: number;
  readonly status: number;
}

export interface CollectedSixAttributes {
  readonly atk: number;
  readonly def: number;
  readonly hp: number;
  readonly sp_atk: number;
  readonly sp_def: number;
  readonly spd: number;
}

export interface CollectedNatureAttributes extends CollectedSixAttributes {
  readonly percent: boolean;
}

export interface CollectedPet {
  readonly attr_bonus_data: Record<CollectedStatKey, AttrBonusBucket>;
  readonly base_stats: CollectedSixAttributes;
  readonly cloths: readonly number[];
  readonly collection_time: number;
  readonly dv: number;
  readonly effects: readonly CollectedEffect[];
  readonly evs: CollectedSixAttributes;
  readonly extra_attr: CollectedSixAttributes;
  readonly level: number;
  readonly nature: number;
  readonly nature_attributes: CollectedNatureAttributes;
  readonly nature_name: string;
  readonly pet_catch_time: number;
  readonly pet_id: number;
  readonly pet_name: string;
  readonly title_id: number;
}

export interface LoadedCollectedPet {
  readonly sourcePath: string;
  readonly pet: CollectedPet;
}

const EXPECTED_TYPE_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** 将 JSON 解析为采集精灵快照（JSON Schema 校验） */
export function parseCollectedPet(value: unknown): CollectedPet {
  return assertCollectedPetSchema(value);
}

/** 任一 `*_total` 非零即视为可用于顺序验证的样本 */
export function isUsableSample(pet: CollectedPet): boolean {
  for (const stat of COLLECTED_STAT_KEYS) {
    const bucket = pet.attr_bonus_data[stat];
    if (
      bucket.base_total !== 0 ||
      bucket.pve_total !== 0 ||
      bucket.pvp_total !== 0
    ) {
      return true;
    }
  }
  return false;
}

/** 校验每个桶的 type_id 序列为 1–11 */
export function assertTypeIdSequence(pet: CollectedPet): void {
  for (const stat of COLLECTED_STAT_KEYS) {
    for (const bucketKey of COLLECTED_BUCKET_KEYS) {
      const entries =
        bucketKey === 'base'
          ? pet.attr_bonus_data[stat].base
          : bucketKey === 'pve'
            ? pet.attr_bonus_data[stat].pve
            : pet.attr_bonus_data[stat].pvp;
      if (entries.length !== EXPECTED_TYPE_IDS.length) {
        throw new Error(
          `${stat}.${bucketKey} 条目数量应为 ${EXPECTED_TYPE_IDS.length}`,
        );
      }
      for (let index = 0; index < entries.length; index += 1) {
        const expected = EXPECTED_TYPE_IDS[index];
        const actual = entries[index]?.type_id;
        if (actual !== expected) {
          throw new Error(
            `${stat}.${bucketKey}[${index}] type_id 应为 ${expected}，实际为 ${actual}`,
          );
        }
      }
    }
  }
}

/** 筛出活跃加成条目（value 或 percent 非零） */
export function getActiveBonuses(
  entries: readonly AttrBonusEntry[],
  minTypeId = 6,
): readonly AttrBonusEntry[] {
  return entries.filter(
    (entry) =>
      entry.type_id >= minTypeId && (entry.value !== 0 || entry.percent !== 0),
  );
}

/** 读取单个采集 JSON 文件 */
export async function loadCollectedPetFile(
  filePath: string,
): Promise<LoadedCollectedPet> {
  const raw = await readFile(filePath, 'utf8');
  const pet = parseCollectedPet(JSON.parse(raw) as unknown);
  return { sourcePath: filePath, pet };
}

async function collectJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

/** 遍历目录加载全部采集 JSON（支持 `{pet_id}/{catch_time}.json` 或扁平 fixture 命名） */
export async function loadCollectedPets(dir: string): Promise<LoadedCollectedPet[]> {
  const files = await collectJsonFiles(dir);
  return Promise.all(files.map((filePath) => loadCollectedPetFile(filePath)));
}

/** base 桶是否存在 type 6–11 活跃加成 */
export function hasBaseLateBonuses(pet: CollectedPet, stat: CollectedStatKey): boolean {
  return getActiveBonuses(pet.attr_bonus_data[stat].base).length > 0;
}

/** 汇总 type 2–5 固定值加成（type 1 学习力已含于公式基础段） */
export function sumEarlyBonuses(entries: readonly AttrBonusEntry[]): number {
  return entries
    .filter((entry) => entry.type_id >= 2 && entry.type_id <= 5)
    .reduce((sum, entry) => sum + entry.value, 0);
}
