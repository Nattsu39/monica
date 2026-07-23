import { PRIORITY_CONSTS } from '../../src/extra-bonuses/priority-const.ts';

export type PriorityScope = keyof typeof PRIORITY_CONSTS;
export type PrioritySourceKey = keyof (typeof PRIORITY_CONSTS)['base'];

/** type_id 6–11 与 PRIORITY_CONSTS 常量名的映射 */
export const TYPE_ID_TO_PRIORITY_SOURCE = {
  6: 'ITEM_BONUS',
  7: 'SOULMARK_BONUS',
  8: 'EQUIPMENT_BONUS',
  9: 'SUPERNONO_BONUS',
  11: 'SPECIAL_BONUS',
} as const satisfies Partial<Record<number, PrioritySourceKey>>;

/** type_id 与游戏内加成来源名称的映射 */
export const TYPE_ID_TO_ATTR_NAME: Record<number, string> = {
  1: '学习力',
  2: '刻印',
  3: '战队加成',
  4: '称号加成',
  5: '年费加成',
  6: '道具加成',
  7: '专属特性',
  8: '装扮加成',
  9: '超能加成',
  10: '神谕觉醒',
  11: '特殊加成',
};

/** type 10 神谕觉醒 — 当前 priority-const 未定义优先级 */
export const UNMAPPED_PRIORITY_TYPE_IDS = [10] as const;

const PRIORITY_SCOPES = [
  'base',
  'pve',
  'pvp',
] as const satisfies readonly PriorityScope[];

/** 获取 type_id 在指定 scope 下的 priority 数值；未映射时排在最后 */
export function getPriorityForTypeId(
  typeId: number,
  scope: PriorityScope,
): number {
  const sourceKey =
    TYPE_ID_TO_PRIORITY_SOURCE[
      typeId as keyof typeof TYPE_ID_TO_PRIORITY_SOURCE
    ];
  if (sourceKey === undefined) {
    return Number.MAX_SAFE_INTEGER;
  }
  return PRIORITY_CONSTS[scope][sourceKey];
}

/** 断言 PRIORITY_CONSTS 各 scope 内严格递增 */
export function assertPriorityConstsMonotonic(): void {
  for (const scope of PRIORITY_SCOPES) {
    const values = Object.values(PRIORITY_CONSTS[scope]);
    for (let index = 1; index < values.length; index += 1) {
      const prev = values[index - 1];
      const current = values[index];
      if (current <= prev) {
        throw new Error(
          `PRIORITY_CONSTS.${scope} 未严格递增：${String(prev)} >= ${String(current)}`,
        );
      }
    }
  }
}

/** 断言 type_id 6–11（除 10）与 PRIORITY_CONSTS 常量一一对应 */
export function assertTypeIdPriorityMapping(): void {
  const mappedIds = Object.keys(TYPE_ID_TO_PRIORITY_SOURCE).map(Number);
  for (const typeId of mappedIds) {
    const sourceKey =
      TYPE_ID_TO_PRIORITY_SOURCE[
        typeId as keyof typeof TYPE_ID_TO_PRIORITY_SOURCE
      ];
    if (sourceKey === undefined) {
      continue;
    }
    for (const scope of PRIORITY_SCOPES) {
      if (!(sourceKey in PRIORITY_CONSTS[scope])) {
        throw new Error(
          `type_id ${typeId} 映射的 ${sourceKey} 不在 PRIORITY_CONSTS.${scope}`,
        );
      }
    }
  }
}
